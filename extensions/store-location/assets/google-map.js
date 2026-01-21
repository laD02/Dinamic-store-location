/************************************************
 * Utils
 ************************************************/
const hexToRgba = (hex, alpha) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/************************************************
 * Google Maps Loader (singleton)
 ************************************************/
let googleMapsPromise = null;

function loadGoogleMaps(apiKey) {
    if (googleMapsPromise) return googleMapsPromise;

    googleMapsPromise = new Promise((resolve, reject) => {
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

    return googleMapsPromise;
}

/************************************************
 * Init all blocks
 ************************************************/
document.addEventListener("DOMContentLoaded", async () => {
    const wrappers = document.querySelectorAll(".sl-wrapper");
    if (!wrappers.length) return;

    const firstMap = wrappers[0].querySelector(".sl-map");
    const apiKey = firstMap?.dataset.gmapKey;

    // Nếu có API key, load Google Maps
    if (apiKey) {
        try {
            await loadGoogleMaps(apiKey);
        } catch (err) {
            console.error("Failed to load Google Maps:", err);
        }
    }

    // Init tất cả store locators (có hoặc không có Maps)
    wrappers.forEach(wrapper => {
        initStoreLocator(wrapper);
    });
});

/************************************************
 * Init single Store Locator instance
 ************************************************/
async function initStoreLocator(wrapper) {
    const mapEl = wrapper.querySelector(".sl-map");
    const mapLoading = wrapper.querySelector(".map-loading");
    if (!mapEl) return;

    const apiKey = mapEl.dataset.gmapKey;
    const hasGoogleMaps = apiKey && window.google && window.google.maps;

    let map;
    let markers = [];
    let currentOverlay = null;
    let mapStyle = null;

    try {
        // Luôn fetch stores data
        const res = await fetch("/apps/store-locator");
        const { stores, style } = await res.json();
        mapStyle = style || {};

        // Nếu có Google Maps, khởi tạo map và markers
        if (hasGoogleMaps) {
            map = new google.maps.Map(mapEl, {
                center: { lat: 0, lng: 0 },
                zoom: 10,
                styles: Array.isArray(style) ? style : []
            });

            const bounds = new google.maps.LatLngBounds();

            stores.forEach((store, index) => {
                const marker = new google.maps.Marker({
                    position: { lat: store.lat, lng: store.lng },
                    map,
                    title: store.storeName || store.name
                });

                marker.addListener("click", () => {
                    panToStore(store, marker);
                });

                markers.push({ marker, store, index });
                bounds.extend(marker.getPosition());
            });

            if (!bounds.isEmpty()) {
                map.fitBounds(bounds);
            }

            google.maps.event.addListenerOnce(map, "idle", () => {
                if (mapLoading) mapLoading.style.display = "none";
            });
        } else {
            // Không có Google Maps - ẩn loading và hiển thị thông báo
            if (mapLoading) mapLoading.style.display = "none";
        }

        // Load stores list (luôn chạy, dù có hay không có Maps)
        loadStores(wrapper, (storeIndex) => {
            if (hasGoogleMaps) {
                const storeData = markers.find(m => m.index === storeIndex);
                if (storeData) {
                    panToStore(storeData.store, storeData.marker);
                }
            }
        });

    } catch (err) {
        console.error("Store locator error:", err);
        if (mapLoading) mapLoading.style.display = "none";
    }

    /************************************************
     * Pan + Overlay (chỉ khi có Google Maps)
     ************************************************/
    function panToStore(store, marker) {
        if (!map) return;

        map.setZoom(16);

        google.maps.event.addListenerOnce(map, "idle", () => {
            const projection = map.getProjection();
            if (!projection) return;

            const hasImage = !!store.image;
            const overlayHeight = hasImage ? 260 : 170;
            const offsetY = overlayHeight / 2 + 140;

            const latLng = new google.maps.LatLng(store.lat, store.lng);
            const point = projection.fromLatLngToPoint(latLng);
            const scale = Math.pow(2, map.getZoom());

            const newPoint = new google.maps.Point(
                point.x,
                point.y - offsetY / scale
            );

            const newCenter = projection.fromPointToLatLng(newPoint);
            map.panTo(newCenter);

            showOverlay(store, marker);
        });
    }

    function showOverlay(store, marker) {
        if (!map) return;

        if (currentOverlay) {
            currentOverlay.setMap(null);
            currentOverlay = null;
        }

        class StoreOverlay extends google.maps.OverlayView {
            constructor(position, store) {
                super();
                this.position = position;
                this.store = store;
                this.div = null;
            }

            onAdd() {
                this.div = document.createElement("div");
                this.div.className = "map-overlay-card";
                this.div.style.borderRadius = `${mapStyle.cornerRadius || 3}px`;

                if (mapStyle.shadowColor) {
                    const shadow = hexToRgba(
                        mapStyle.shadowColor,
                        (mapStyle.transparency !== undefined ? mapStyle.transparency : 60) / 100
                    );
                    const anchorX = mapStyle.anchorx !== undefined ? mapStyle.anchorx : -2;
                    const anchorY = mapStyle.anchory !== undefined ? mapStyle.anchory : -2;
                    const blur = mapStyle.blur !== undefined ? mapStyle.blur : 4;

                    this.div.style.boxShadow = `${anchorX}px ${anchorY}px ${blur}px ${shadow}`;
                }

                this.div.innerHTML = this.getHTML();

                this.div
                    .querySelector(".map-overlay-close")
                    .addEventListener("click", () => {
                        this.setMap(null);
                        currentOverlay = null;
                    });

                this.getPanes().floatPane.appendChild(this.div);
            }

            getHTML() {
                const s = this.store;
                const time = s.time || {};
                const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

                let hoursHtml = '';
                days.forEach(day => {
                    const lowerDay = day.toLowerCase();
                    const openKey = `${lowerDay}Open`;
                    const closeKey = `${lowerDay}Close`;

                    const openVal = time[openKey];
                    const closeVal = time[closeKey];

                    if (!openVal || !closeVal || openVal === 'close' || closeVal === 'close') {
                        hoursHtml += `
                            <tr>
                                <td>${day}</td>
                                <td>Close</td>
                            </tr>
                        `;
                    } else {
                        hoursHtml += `
                            <tr>
                                <td>${day}</td>
                                <td>${openVal} - ${closeVal}</td>
                            </tr>
                        `;
                    }
                });

                const socialIconsMap = {
                    facebook: 'fa-facebook',
                    youtube: 'fa-youtube',
                    linkedin: 'fa-linkedin',
                    instagram: 'fa-square-instagram',
                    x: 'fa-square-x-twitter',
                    pinterest: 'fa-pinterest',
                    tiktok: 'fa-tiktok'
                };

                let socialHtml = '';
                if (s.contract) {
                    Object.keys(s.contract).forEach(platform => {
                        const urls = s.contract[platform];
                        if (Array.isArray(urls) && urls.length > 0) {
                            const url = urls[0];
                            const iconClass = socialIconsMap[platform] || 'fa-link';
                            socialHtml += `
                                <a href="${url}" target="_blank" class="${platform}">
                                    <i class="fa-brands ${iconClass}"></i>
                                </a>
                            `;
                        }
                    });
                }

                return `
                    <button class="map-overlay-close">×</button>

                    ${s.image ? `
                    <div class="map-overlay-hero">
                        <img src="${s.image}" alt="${s.storeName || 'Store'}" />
                    </div>
                    ` : ''}

                    <div class="map-overlay-content" style="
                        background:${mapStyle.backgroundColor || "#fff"};
                    ">
                        <h3 class="map-overlay-title" style="color:${mapStyle.color};">${s.storeName}</h3>
                        
                        <div class="map-overlay-row">
                            <i class="fa-solid fa-location-dot" style="color:${mapStyle.iconColor};"></i>
                            <span style="color:${mapStyle.color};">${[s.address, s.city, s.code].filter(Boolean).join(', ')}</span>
                        </div>

                        ${s.phone ? `
                        <div class="map-overlay-row">
                            <i class="fa-solid fa-phone" style="color:${mapStyle.iconColor};"></i>
                            <span style="color:${mapStyle.color};">${s.phone}</span>
                        </div>
                        ` : ''}

                         ${s.url ? `
                        <div class="map-overlay-row">
                            <i class="fa-solid fa-earth-americas" style="color:${mapStyle.iconColor};"></i>
                            <a href="${s.url}" target="_blank" style="color:${mapStyle.color};">${s.url}</a>
                        </div>
                        ` : ''}

                        <div class="map-overlay-row">
                            <i class="fa-solid fa-clock" style="color:${mapStyle.iconColor};"></i>
                            <table class="map-overlay-table" style="color:${mapStyle.color};">
                                <tbody>
                                    ${hoursHtml}
                                </tbody>
                            </table>
                        </div>

                        ${socialHtml ? `
                        <div class="map-overlay-socials">
                            ${socialHtml}
                        </div>
                        ` : ''}

                    </div>
                `;
            }

            draw() {
                const projection = this.getProjection();
                const pos = projection.fromLatLngToDivPixel(this.position);

                if (this.div) {
                    this.div.style.left = pos.x - this.div.offsetWidth / 2 + "px";
                    this.div.style.top = pos.y - this.div.offsetHeight - 20 + "px";
                }
            }

            onRemove() {
                if (this.div) {
                    this.div.remove();
                    this.div = null;
                }
            }
        }

        currentOverlay = new StoreOverlay(
            new google.maps.LatLng(store.lat, store.lng),
            store
        );

        currentOverlay.setMap(map);
    }
}