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

function loadGoogleMaps(apiKey) {
    return new Promise((resolve, reject) => {
        if (window.google && window.google.maps) {
            resolve();
            return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.defer = true;

        script.onload = resolve;
        script.onerror = reject;

        document.head.appendChild(script);
    });
}

document.addEventListener("DOMContentLoaded", async () => {
    const mapEl = document.getElementById("sl-map");
    if (!mapEl) return;

    const apiKey = mapEl.dataset.gmapKey;
    if (!apiKey) {
        return;
    }

    await loadGoogleMaps(apiKey);
    googleMap(); // hàm bạn đã viết sẵn
});

async function googleMap() {
    try {
        const mapLoading = document.getElementById("map-loading");
        const res = await fetch("/apps/store-locator");
        const { stores, style } = await res.json();
        mapStyle = style;

        map = new google.maps.Map(document.getElementById("sl-map"), {
            center: { lat: 0, lng: 0 },
            zoom: 10,
            styles: Array.isArray(style) ? style : []
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
    map.setZoom(16);

    google.maps.event.addListenerOnce(map, "idle", () => {
        const projection = map.getProjection();
        if (!projection) return;

        const overlayHeight = 260; // chiều cao overlay (ước lượng)
        const offsetY = overlayHeight / 2 + 20; // 40px khoảng hở

        const latLng = new google.maps.LatLng(store.lat, store.lng);

        // LatLng -> world point
        const point = projection.fromLatLngToPoint(latLng);

        // scale theo zoom
        const scale = Math.pow(2, map.getZoom());

        // Tạo point mới lệch xuống dưới
        const newPoint = new google.maps.Point(
            point.x,
            point.y - offsetY / scale
        );

        // World point -> LatLng
        const newCenter = projection.fromPointToLatLng(newPoint);

        map.panTo(newCenter);

        showOverlay(store, marker);
    });
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
            const icons = {
                facebook: 'fa-facebook',
                youtube: 'fa-youtube',
                linkedin: 'fa-linkedin',
                instagram: 'fa-square-instagram',
                x: 'fa-square-x-twitter',
                pinterest: 'fa-pinterest',
                tiktok: 'fa-tiktok'
            }
            // Tạo div container
            this.div = document.createElement('div');
            this.div.className = 'map-overlay-card';
            this.div.style.zIndex = '1000';
            this.div.style.borderRadius = `${mapStyle.cornerRadius}px`;

            // Thêm shadow từ mapStyle
            if (mapStyle.shadowColor) {
                const shadowRgba = hexToRgba(
                    mapStyle.shadowColor,
                    mapStyle.transparency / 100 // convert 0-100 thành 0-1
                );
                const offsetX = mapStyle.anchorx;
                const offsetY = mapStyle.anchory;
                const blur = mapStyle.blur;

                this.div.style.boxShadow = `${offsetX}px ${offsetY}px ${blur}px 0px ${shadowRgba}`;
            }

            // Dynamic styles that must be inline because they come from backend config
            // We apply color/font settings to a wrapper or specific elements

            const contentStyle = `
                color: ${mapStyle.color};
                background: ${mapStyle.backgroundColor || '#fff'};
            `;

            // Prepare Social Icons
            const socialLinks = Object.entries(this.store.contract || {})
                .map(([platform, items]) =>
                    items.map((href) => `
                        <a href="${href}" target="_blank" style="color: ${mapStyle.iconColor}">
                            <i class="fa-brands ${icons[platform]}"></i>
                        </a>
                    `).join('')
                ).join('');

            // Tạo nội dung HTML
            this.div.innerHTML = `
                <button class="map-overlay-close" onclick="closeOverlay()">×</button>
                
                ${this.store.image ? `
                    <div class="map-overlay-hero">
                        <img src="${this.store.image}" alt="${this.store.name}" />
                    </div>
                ` : ''}
                
                <div class="map-overlay-content" style="${contentStyle}">
                    <div class="map-overlay-header">
                        <h3 class="map-overlay-title" style="color: ${mapStyle.color}">
                            ${this.store.storeName}
                        </h3>
                    </div>

                    <div class="map-overlay-row">
                        <i class="fa-solid fa-location-dot" style="color: ${mapStyle.iconColor}"></i>
                        <span>${this.store.address || ''}, ${this.store.city}, ${this.store.code}</span>
                    </div>

                    ${this.store.phone ? `
                        <div class="map-overlay-row">
                            <i class="fa-solid fa-phone" style="color: ${mapStyle.iconColor}"></i>
                            <span>${this.store.phone}</span>
                        </div>
                    ` : ''}

                    ${socialLinks ? `
                        <div class="map-overlay-socials">
                            ${socialLinks}
                        </div>
                    ` : ''}
                </div>
            `;

            // Apply border radius and shadow dynamically if needed, 
            // but for now we used CSS classes. If existing config has specific radius/shadow,
            // we can override via inline style on the card.
            // mapStyle.cornerRadius, mapStyle.shadowColor etc.

            this.div.style.borderRadius = `${mapStyle.cornerRadius}px`;
            // For shadow, it's complex to map exactly, but we can try basic or skip if CSS is enough.
            // Let's rely on CSS for shadow for better look, or use the custom one if really needed.

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
                // Offset horizontal by half width, vertical by height + arrow/space
                this.div.style.left = (position.x - this.div.offsetWidth / 2) + 'px';
                this.div.style.top = (position.y - this.div.offsetHeight - 20) + 'px';
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

window.selectStoreByIndex = function (storeIndex) {
    const storeData = markers.find(m => m.index === storeIndex);
    if (storeData) {
        panToStore(storeData.store, storeData.marker);
    }
};

// Export để có thể gọi từ HTML
window.closeOverlay = closeOverlay;

// googleMap();