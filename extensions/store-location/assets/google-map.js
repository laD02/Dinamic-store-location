let map;
let markers = [];
let currentOverlay = null;
let mapStyle = null;

const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

async function googleMap() {
    try {
        const mapLoading = document.getElementById("map-loading");
        const res = await fetch("/apps/storeLoader");
        const { stores, style } = await res.json();
        mapStyle = style;

        map = new google.maps.Map(document.getElementById("sl-map"), {
            center: { lat: 0, lng: 0 },
            zoom: 10,
            styles: style || [],
        });

        const bounds = new google.maps.LatLngBounds();

        // --- 1. RENDER TẤT CẢ STORE LÊN MAP ---
        stores.forEach((store, index) => {
            const marker = new google.maps.Marker({
                position: { lat: store.lat, lng: store.lng },
                map,
                title: store.name
            });

            marker.addListener("click", () => {
                panToStore(store, marker);
            });

            markers.push({ marker, store, index });

            // Thêm point vào bounds để fit toàn bộ store
            bounds.extend({ lat: store.lat, lng: store.lng });
        });

        // --- Fit the map to contain all stores ---
        if (!bounds.isEmpty()) {
            map.fitBounds(bounds);
        }

        // --- 2. LẮNG NGHE CLICK VÀO STORE ITEM TRONG LIST ---
        document.querySelectorAll(".store-item").forEach(item => {
            item.addEventListener("click", () => {
                const storeId = item.dataset.id; // ví dụ data-id="store_1"
                const storeData = markers.find(m => m.store.id == storeId);

                if (storeData) {
                    panToStore(storeData.store, storeData.marker);
                }
            });
        });
        google.maps.event.addListenerOnce(map, 'idle', () => {
            if (mapLoading) {
                mapLoading.style.display = "none";
            }
        });

    } catch (error) {
        console.error("Proxy fetch error:", error);
    }
}

function panToStore(store, marker) {
    map.panTo({ lat: store.lat, lng: store.lng });
    map.setZoom(16);

    showOverlay(store, marker);
}

function showOverlay(store, marker) {
    // Xóa overlay cũ nếu có
    if (currentOverlay) {
        currentOverlay.setMap(null);
    }

    // Tạo Custom OverlayView class
    class StoreOverlay extends google.maps.OverlayView {
        constructor(position, store) {
            super();
            this.position = position;
            this.store = store;
            this.div = null;
        }

        onAdd() {
            // Tạo div container
            this.div = document.createElement('div');
            this.div.style.position = 'absolute';
            this.div.style.cursor = 'default';
            this.div.style.zIndex = '1000';
            
            // Tạo nội dung HTML
            this.div.innerHTML = `
                <div style="
                    background: ${mapStyle?.backgroundColor};
                    color: ${mapStyle.color};
                    padding: 16px;
                    border-radius: ${mapStyle.cornerRadius}px;
                    box-shadow: ${mapStyle.anchorx}px ${mapStyle.anchory}px ${mapStyle.blur}px ${hexToRgba(mapStyle.shadowColor, mapStyle.transparency / 100)};
                    min-width: 150px;
                    max-width: 300px;
                    position: relative;
                    align-items: center;
                    justify-items: center;  
                ">
                    ${this.store.image ? `
                        <img src="${this.store.image}" 
                             alt="${this.store.name}" 
                             style=" width: 100%; height: 80px; object-fit: cover; border-radius: 8px; padding: 12px;" />
                    ` : ''}
                    <h3 style="margin: 0 0 8px 0; font-size: 12px; color: ${mapStyle.color}; font-weight: 600;">
                        ${this.store.storeName}
                    </h3>
                    <p style="margin: 0 0 8px 0; color: ${mapStyle.color}; font-size: 8px; line-height: 1.5;">
                        ${this.store.address || ''}, ${this.store.city}, ${this.store.state}, ${this.store.code}
                    </p>
                    ${this.store.phone ? `
                        <p style="margin: 0; color: ${mapStyle.color}; font-size: 8px; padding-bottom: 12px">
                            <i class="fa-solid fa-phone" style="margin-right: 5px; color: ${mapStyle.iconColor};"></i>
                            ${this.store.phone}
                        </p>
                    ` : ''}
                    
                    <!-- Nút đóng -->
                    <button onclick="closeOverlay()" style="
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        background: rgba(0,0,0,0.5);
                        color: white;
                        border: none;
                        border-radius: 50%;
                        width: 24px;
                        height: 24px;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 16px;
                        line-height: 1;
                    ">×</button>
                    
                    <!-- Mũi tên tam giác -->
                    <div style="
                        position: absolute;
                        bottom: -8px;
                        left: 50%;
                        transform: translateX(-50%);
                        width: 0;
                        height: 0;
                        border-left: 8px solid transparent;
                        border-right: 8px solid transparent;
                        border-top: 8px solid white;
                    "></div>
                </div>
            `;
            
            // Thêm vào pane
            const panes = this.getPanes();
            panes.floatPane.appendChild(this.div);
        }

        draw() {
            // Tính toán vị trí pixel
            const overlayProjection = this.getProjection();
            const position = overlayProjection.fromLatLngToDivPixel(this.position);
            
            if (this.div) {
                // Căn giữa overlay và đặt phía trên marker
                this.div.style.left = (position.x - this.div.offsetWidth / 2) + 'px';
                this.div.style.top = (position.y - this.div.offsetHeight - 40) + 'px';
            }
        }

        onRemove() {
            if (this.div && this.div.parentNode) {
                this.div.parentNode.removeChild(this.div);
                this.div = null;
            }
        }
    }

    // Tạo overlay mới
    const position = new google.maps.LatLng(store.lat, store.lng);
    currentOverlay = new StoreOverlay(position, store);
    currentOverlay.setMap(map);
}

// Hàm đóng overlay (global function để button có thể gọi)
function closeOverlay() {
    if (currentOverlay) {
        currentOverlay.setMap(null);
        currentOverlay = null;
    }
}

window.selectStoreByIndex = function(storeIndex) {
    const storeData = markers.find(m => m.index === storeIndex);
    if (storeData) {
        panToStore(storeData.store, storeData.marker);
    }
};

// Export để có thể gọi từ HTML
window.closeOverlay = closeOverlay;

googleMap();