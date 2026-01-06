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
    console.warn("Missing Google Maps API key");
    return;
  }

  await loadGoogleMaps(apiKey);
  googleMap(); // hàm bạn đã viết sẵn
});

async function googleMap() {
    try {
        const mapLoading = document.getElementById("map-loading");
        const res = await fetch("/apps/storeLoader");
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
                ">
                    <button onclick="closeOverlay()" style="
                        position: absolute;
                        top: 8px;
                        right: 8px;
                        background: transparent;
                        border: none;
                        color: ${mapStyle.color};
                        font-size: 20px;
                        cursor: pointer;
                        padding: 0;
                        width: 24px;
                        height: 24px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        opacity: 0.7;
                        transition: opacity 0.2s;
                    " onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.7'">
                        ×
                    </button>
                    ${this.store.image ? `
                        <img src="${this.store.image}" 
                             alt="${this.store.name}" 
                             style=" width: 100%; height: 40px; object-fit: contain; border-radius: 8px;" />
                    ` : ''}
                    <div style= "display: flex; justify-content: center">
                        <h3 style="margin: 0 0 4px 0; font-size: 16px; color: ${mapStyle.color}; font-weight: 600">
                            ${this.store.storeName}
                        </h3>
                    </div>
                    <p style="margin: 0 0 4px 0; color: ${mapStyle.color}; font-size: 12px; line-height: 1.5;">
                        ${this.store.address || ''}, ${this.store.city}, ${this.store.state}, ${this.store.code}
                    </p>
                    ${this.store.phone ? `
                        <p style="margin: 0; color: ${mapStyle.color}; font-size: 12px">
                            <i class="fa-solid fa-phone" style="margin-right: 4px; color: ${mapStyle.iconColor};"></i>
                            ${this.store.phone}
                        </p>
                    ` : ''}                  
                    <div style="display: flex; justify-content: flex-start;margin-top:4px;">
                        <i class="fa-solid fa-clock" style="margin-right: 4px; color: ${mapStyle.iconColor}"></i>
                        <div style="font-size: 12px;">
                            <p>
                            Mon ${
                                this.store.time.mondayClose === 'close' || this.store.time.mondayOpen === 'close'
                                ? 'Close'
                                : `${this.store.time.mondayOpen} - ${this.store.time.mondayClose}`
                            }
                            </p>

                            <p>
                            Tue ${
                                this.store.time.tuesdayClose === 'close' || this.store.time.tuesdayOpen === 'close'
                                ? 'Close'
                                : `${this.store.time.tuesdayOpen} - ${this.store.time.tuesdayClose}`
                            }
                            </p>

                            <p>
                            Wed ${
                                this.store.time.wednesdayClose === 'close' || this.store.time.wednesdayOpen === 'close'
                                ? 'Close'
                                : `${this.store.time.wednesdayOpen} - ${this.store.time.wednesdayClose}`
                            }
                            </p>

                            <p>
                            Thu ${
                                this.store.time.thursdayClose === 'close' || this.store.time.thursdayOpen === 'close'
                                ? 'Close'
                                : `${this.store.time.thursdayOpen} - ${this.store.time.thursdayClose}`
                            }
                            </p>

                            <p>
                            Fri ${
                                this.store.time.fridayClose === 'close' || this.store.time.fridayOpen === 'close'
                                ? 'Close'
                                : `${this.store.time.fridayOpen} - ${this.store.time.fridayClose}`
                            }
                            </p>

                            <p>
                            Sat ${
                                this.store.time.saturdayClose === 'close' || this.store.time.saturdayOpen === 'close'
                                ? 'Close'
                                : `${this.store.time.saturdayOpen} - ${this.store.time.saturdayClose}`
                            }
                            </p>

                            <p>
                            Sun ${
                                this.store.time.sundayClose === 'close' || this.store.time.sundayOpen === 'close'
                                ? 'Close'
                                : `${this.store.time.sundayOpen} - ${this.store.time.sundayClose}`
                            }
                            </p>
                        </div>               
                    </div>
                    <div style="margin-top: 4px;display: flex; justify-content: center; gap: 4px; align-item: center; ">               
                        ${
                            Object.entries(this.store.contract)
                                .map(([platform, items]) =>
                                items.map((href) => `
                                    <a href="${href}" target="_blank" style="margin-right:4px; color: ${mapStyle.iconColor}; font-size: 16px;">
                                        <i class="fa-brands ${icons[platform]}"></i>
                                    </a>
                                `).join('')
                                )
                                .join('')
                        }
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

// googleMap();