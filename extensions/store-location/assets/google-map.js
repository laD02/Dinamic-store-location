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
 * Validate coordinates
 ************************************************/
const isValidCoordinate = (lat, lng) => {
    return lat !== null &&
        lat !== undefined &&
        lng !== null &&
        lng !== undefined &&
        !isNaN(lat) &&
        !isNaN(lng) &&
        lat >= -90 &&
        lat <= 90 &&
        lng >= -180 &&
        lng <= 180;
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
    const mapType = firstMap?.dataset.mapType;
    const apiKey = firstMap?.dataset.gmapKey;

    // Chỉ load Google Maps nếu có API key
    if (mapType === 'google' && apiKey) {
        try {
            await loadGoogleMaps(apiKey);
        } catch (err) {
            console.error("Failed to load Google Maps:", err);
        }
    }

    // Init tất cả store locators
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

    const mapType = mapEl.dataset.mapType;
    const apiKey = mapEl.dataset.gmapKey;
    const useGoogleMaps = mapType === 'google' && apiKey && window.google && window.google.maps;

    let map;
    let markers = [];
    let currentOverlay = null;
    let mapStyle = null;

    try {
        // Fetch stores data
        const res = await fetch("/apps/store-locator");
        const { stores, style } = await res.json();
        mapStyle = style || {};

        // Lọc stores có tọa độ hợp lệ VÀ GIỮ INDEX GỐC
        const validStores = stores
            .map((store, index) => ({ ...store, originalIndex: index }))
            .filter(store => isValidCoordinate(store.lat, store.lng));

        if (validStores.length === 0) {
            console.warn("No stores with valid coordinates found");
            if (mapLoading) mapLoading.style.display = "none";
            return;
        }

        if (useGoogleMaps) {
            // === GOOGLE MAPS ===
            initGoogleMap(mapEl, validStores, mapStyle, mapLoading);
        } else {
            // === OPENSTREETMAP ===
            initOpenStreetMap(mapEl, validStores, mapStyle, mapLoading);
        }

        // Load stores list (bao gồm cả stores không có tọa độ)
        loadStores(wrapper, (storeIndex) => {
            const store = stores[storeIndex];
            if (!store) return;

            // Kiểm tra tọa độ và thông báo người dùng
            if (!isValidCoordinate(store.lat, store.lng)) {
                showCoordinateWarning(store);
                return;
            }

            if (useGoogleMaps) {
                // TÌM MARKER THEO originalIndex
                const storeData = markers.find(m => m.originalIndex === storeIndex);
                if (storeData) {
                    panToStoreGoogle(storeData.store, storeData.marker);
                }
            } else {
                // TÌM MARKER THEO originalIndex
                const markerData = markers.find(m => m.originalIndex === storeIndex);
                if (markerData) {
                    panToStoreOSM(markerData.store, markerData.originalIndex);
                }
            }
        });

    } catch (err) {
        console.error("Store locator error:", err);
        if (mapLoading) mapLoading.style.display = "none";
    }

    /************************************************
     * Show warning for stores without coordinates
     ************************************************/
    function showCoordinateWarning(store) {
        // Tạo thông báo toast
        const toast = document.createElement('div');
        toast.className = 'sl-toast-notification';
        toast.innerHTML = `
            <div class="sl-toast-content">
                <i class="fa-solid fa-location-slash"></i>
                <div class="sl-toast-text">
                    <strong>${store.storeName || 'Store'}</strong>
                    <p>Location not available on map</p>
                </div>
                <button class="sl-toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Thêm styles inline nếu chưa có
        if (!document.getElementById('sl-toast-styles')) {
            const style = document.createElement('style');
            style.id = 'sl-toast-styles';
            style.textContent = `
                .sl-toast-notification {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    z-index: 10000;
                    animation: slideInRight 0.3s ease-out;
                }
                
                .sl-toast-content {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: #fff;
                    border-left: 4px solid #f59e0b;
                    padding: 16px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                    min-width: 300px;
                    max-width: 400px;
                }
                
                .sl-toast-content i {
                    font-size: 24px;
                    color: #f59e0b;
                    flex-shrink: 0;
                }
                
                .sl-toast-text {
                    flex: 1;
                }
                
                .sl-toast-text strong {
                    display: block;
                    font-size: 14px;
                    color: #111827;
                    margin-bottom: 4px;
                }
                
                .sl-toast-text p {
                    margin: 0;
                    font-size: 13px;
                    color: #6b7280;
                }
                
                .sl-toast-close {
                    background: none;
                    border: none;
                    font-size: 24px;
                    color: #9ca3af;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 4px;
                    transition: all 0.2s;
                    flex-shrink: 0;
                }
                
                .sl-toast-close:hover {
                    background: #f3f4f6;
                    color: #111827;
                }
                
                @keyframes slideInRight {
                    from {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @keyframes slideOutRight {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(400px);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // Tự động ẩn sau 4 giây
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-out';
            setTimeout(() => toast.remove(), 300);
        }, 4000);
    }

    /************************************************
     * GOOGLE MAPS IMPLEMENTATION
     ************************************************/
    function initGoogleMap(mapEl, stores, mapStyle, mapLoading) {
        map = new google.maps.Map(mapEl, {
            center: { lat: 0, lng: 0 },
            zoom: 10,
            styles: Array.isArray(mapStyle) ? mapStyle : [],
            gestureHandling: 'greedy',
            disableDefaultUI: false
        });

        const bounds = new google.maps.LatLngBounds();

        stores.forEach((store) => {
            // Kiểm tra lại tọa độ trước khi tạo marker
            if (!isValidCoordinate(store.lat, store.lng)) {
                console.warn(`Skipping store "${store.storeName}" - invalid coordinates`);
                return;
            }

            const marker = new google.maps.Marker({
                position: { lat: store.lat, lng: store.lng },
                map,
                title: store.storeName || store.name,
                animation: null
            });

            marker.addListener("click", () => {
                panToStoreGoogle(store, marker);
            });

            // LƯU originalIndex để map với store list
            markers.push({
                marker,
                store,
                originalIndex: store.originalIndex
            });
            bounds.extend(marker.getPosition());
        });

        if (!bounds.isEmpty()) {
            map.fitBounds(bounds);
        }

        google.maps.event.addListenerOnce(map, "idle", () => {
            if (mapLoading) mapLoading.style.display = "none";
        });
    }

    function panToStoreGoogle(store, marker) {
        if (!map || !isValidCoordinate(store.lat, store.lng)) return;

        if (currentOverlay) {
            currentOverlay.setMap(null);
            currentOverlay = null;
        }

        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.pointerEvents = 'none';
        tempDiv.className = 'map-overlay-card';
        tempDiv.style.borderRadius = `${mapStyle.cornerRadius || 3}px`;
        tempDiv.innerHTML = generateOverlayHTML(store);
        document.body.appendChild(tempDiv);

        requestAnimationFrame(() => {
            const overlayHeight = tempDiv.offsetHeight;
            document.body.removeChild(tempDiv);

            const projection = map.getProjection();
            if (!projection) {
                map.setZoom(16);
                map.setCenter(new google.maps.LatLng(store.lat, store.lng));
                google.maps.event.addListenerOnce(map, 'idle', () => {
                    panToStoreGoogle(store, marker);
                });
                return;
            }

            const offsetY = overlayHeight / 2 + 20;
            const latLng = new google.maps.LatLng(store.lat, store.lng);
            const point = projection.fromLatLngToPoint(latLng);
            const scale = Math.pow(2, 16);

            const newPoint = new google.maps.Point(
                point.x,
                point.y - offsetY / scale
            );

            const newCenter = projection.fromPointToLatLng(newPoint);

            map.setOptions({
                center: newCenter,
                zoom: 16
            });

            showOverlayGoogle(store, marker);
        });
    }

    function showOverlayGoogle(store, marker) {
        if (!map || !isValidCoordinate(store.lat, store.lng)) return;

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

                this.div.innerHTML = generateOverlayHTML(this.store);

                this.div
                    .querySelector(".map-overlay-close")
                    .addEventListener("click", () => {
                        this.setMap(null);
                        currentOverlay = null;
                    });

                this.getPanes().floatPane.appendChild(this.div);
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

    /************************************************
     * OPENSTREETMAP IMPLEMENTATION
     ************************************************/
    function initOpenStreetMap(mapEl, stores, mapStyle, mapLoading) {
        if (!window.L) {
            console.error("Leaflet library not loaded");
            if (mapLoading) mapLoading.style.display = "none";
            return;
        }

        // Tạo map với center mặc định
        map = L.map(mapEl, {
            center: [0, 0],
            zoom: 2,
            scrollWheelZoom: true
        });

        // Thêm tile layer (OpenStreetMap)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(map);

        // Tạo bounds để fit tất cả markers
        const bounds = L.latLngBounds();

        // Tạo custom icon
        const customIcon = L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
        });

        // Thêm markers
        stores.forEach((store) => {
            // Kiểm tra lại tọa độ trước khi tạo marker
            if (!isValidCoordinate(store.lat, store.lng)) {
                console.warn(`Skipping store "${store.storeName}" - invalid coordinates`);
                return;
            }

            const marker = L.marker([store.lat, store.lng], { icon: customIcon })
                .addTo(map);

            marker.on('click', () => {
                panToStoreOSM(store, store.originalIndex);
            });

            // LƯU originalIndex để map với store list
            markers.push({
                marker,
                store,
                originalIndex: store.originalIndex
            });
            bounds.extend([store.lat, store.lng]);
        });

        // Fit map vào tất cả markers
        if (stores.length > 0 && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }

        // Ẩn loading
        setTimeout(() => {
            if (mapLoading) mapLoading.style.display = "none";
        }, 500);
    }

    function panToStoreOSM(store, storeIndex) {
        if (!map || !isValidCoordinate(store.lat, store.lng)) {
            console.warn('Cannot pan to store - invalid coordinates');
            return;
        }

        // Xóa overlay cũ nếu có
        if (currentOverlay) {
            map.removeLayer(currentOverlay);
            currentOverlay = null;
        }

        // Tạo div ẩn để đo kích thước
        const tempDiv = document.createElement('div');
        tempDiv.style.position = 'absolute';
        tempDiv.style.visibility = 'hidden';
        tempDiv.style.pointerEvents = 'none';
        tempDiv.className = 'map-overlay-card';
        tempDiv.style.borderRadius = `${mapStyle.cornerRadius || 12}px`;
        tempDiv.innerHTML = generateOverlayHTML(store);
        document.body.appendChild(tempDiv);

        requestAnimationFrame(() => {
            const overlayHeight = tempDiv.offsetHeight;
            const overlayWidth = tempDiv.offsetWidth;
            document.body.removeChild(tempDiv);

            // Tính offset pixel
            const offsetPixels = overlayHeight / 2 + 20;

            // Chuyển đổi pixel offset sang lat/lng offset
            const zoom = 16;
            const scale = Math.pow(2, zoom);

            // Tính lat offset
            const metersPerPixel = 156543.03392 * Math.cos(store.lat * Math.PI / 180) / scale;
            const latOffset = (offsetPixels * metersPerPixel) / 111320;

            // Tạo center mới
            const newLat = store.lat + latOffset;

            // Pan đến vị trí mới
            map.setView([newLat, store.lng], 16, {
                animate: true,
                duration: 0.5
            });

            // Đợi animation xong rồi mới hiển thị overlay
            setTimeout(() => {
                showOverlayOSM(store, overlayWidth, overlayHeight);
            }, 500);
        });
    }

    function showOverlayOSM(store, overlayWidth, overlayHeight) {
        if (!map || !isValidCoordinate(store.lat, store.lng)) return;

        // Tạo custom overlay với Leaflet
        const CustomOverlay = L.Layer.extend({
            onAdd: function (map) {
                this._map = map;

                // Tạo div overlay
                const div = L.DomUtil.create('div', 'leaflet-custom-overlay');
                div.className = 'map-overlay-card';
                div.style.position = 'absolute';
                div.style.borderRadius = `${mapStyle.cornerRadius || 12}px`;

                // Thêm box shadow nếu có
                if (mapStyle.shadowColor) {
                    const shadow = hexToRgba(
                        mapStyle.shadowColor,
                        (mapStyle.transparency !== undefined ? mapStyle.transparency : 60) / 100
                    );
                    const anchorX = mapStyle.anchorx !== undefined ? mapStyle.anchorx : -2;
                    const anchorY = mapStyle.anchory !== undefined ? mapStyle.anchory : -2;
                    const blur = mapStyle.blur !== undefined ? mapStyle.blur : 4;
                    div.style.boxShadow = `${anchorX}px ${anchorY}px ${blur}px ${shadow}`;
                }

                div.innerHTML = generateOverlayHTML(store);

                // Xử lý nút đóng
                const closeBtn = div.querySelector('.map-overlay-close');
                if (closeBtn) {
                    L.DomEvent.on(closeBtn, 'click', (e) => {
                        L.DomEvent.stopPropagation(e);
                        if (currentOverlay) {
                            map.removeLayer(currentOverlay);
                            currentOverlay = null;
                        }
                    });
                }

                // Ngăn map pan khi click vào overlay
                L.DomEvent.disableClickPropagation(div);
                L.DomEvent.disableScrollPropagation(div);

                this._div = div;
                map.getPanes().popupPane.appendChild(div);

                // Đợi DOM render xong để lấy kích thước thực tế
                requestAnimationFrame(() => {
                    this._update();
                });
            },

            onRemove: function (map) {
                if (this._div) {
                    L.DomUtil.remove(this._div);
                    this._div = null;
                }
            },

            _update: function () {
                if (!this._map || !this._div) return;

                const pos = this._map.latLngToLayerPoint([store.lat, store.lng]);

                // Lấy kích thước thực tế của overlay sau khi render
                const actualWidth = this._div.offsetWidth;
                const actualHeight = this._div.offsetHeight;

                // Vị trí overlay phía trên marker, căn giữa theo chiều ngang
                this._div.style.left = (pos.x - actualWidth / 2) + 'px';
                this._div.style.top = (pos.y - actualHeight - 20) + 'px';
            }
        });

        // Tạo và thêm overlay
        currentOverlay = new CustomOverlay();
        currentOverlay.addTo(map);

        // Update vị trí khi map di chuyển
        map.on('move', () => {
            if (currentOverlay && currentOverlay._update) {
                currentOverlay._update();
            }
        });

        map.on('zoom', () => {
            if (currentOverlay && currentOverlay._update) {
                currentOverlay._update();
            }
        });
    }

    /************************************************
     * SHARED: Generate Overlay HTML
     ************************************************/
    function generateOverlayHTML(store) {
        const s = store;
        const time = s.time || {};
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

        const schedule = {};
        days.forEach(day => {
            const lowerDay = day.toLowerCase();
            const openVal = time[`${lowerDay}Open`];
            const closeVal = time[`${lowerDay}Close`];

            if (!openVal || !closeVal || openVal === 'close' || closeVal === 'close') {
                schedule[day] = 'Close';
            } else {
                schedule[day] = `${openVal} - ${closeVal}`;
            }
        });

        const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const weekends = ['Saturday', 'Sunday'];

        const weekdayHours = weekdays.map(d => schedule[d]);
        const weekendHours = weekends.map(d => schedule[d]);
        const allHours = days.map(d => schedule[d]);

        const weekdaysMatch = weekdayHours.every(h => h === weekdayHours[0]);
        const weekendsMatch = weekendHours.every(h => h === weekendHours[0]);
        const allDaysMatch = allHours.every(h => h === allHours[0]);

        let hoursHtml = '';

        if (allDaysMatch) {
            hoursHtml = `<tr><td>All days</td><td>${schedule['Monday']}</td></tr>`;
        } else if (weekdaysMatch && weekendsMatch) {
            hoursHtml = `
                <tr><td>Weekdays</td><td>${schedule['Monday']}</td></tr>
                <tr><td>Weekends</td><td>${schedule['Saturday']}</td></tr>
            `;
        } else if (weekdaysMatch) {
            hoursHtml = `<tr><td>Weekdays</td><td>${schedule['Monday']}</td></tr>`;
            weekends.forEach(day => {
                hoursHtml += `<tr><td>${day}</td><td>${schedule[day]}</td></tr>`;
            });
        } else if (weekendsMatch) {
            weekdays.forEach(day => {
                hoursHtml += `<tr><td>${day}</td><td>${schedule[day]}</td></tr>`;
            });
            hoursHtml += `<tr><td>Weekends</td><td>${schedule['Saturday']}</td></tr>`;
        } else {
            days.forEach(day => {
                hoursHtml += `<tr><td>${day}</td><td>${schedule[day]}</td></tr>`;
            });
        }

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

        // Thêm kiểm tra tọa độ cho Google Maps direction link
        const directionUrl = isValidCoordinate(s.lat, s.lng)
            ? `https://www.google.com/maps/dir/?api=1&destination=${s.lat},${s.lng}`
            : '#';

        return `
            <button class="map-overlay-close">×</button>

            ${s.image ? `
            <div class="map-overlay-hero">
                <img src="${s.image}" alt="${s.storeName || 'Store'}" />
            </div>
            ` : ''}

            <div class="map-overlay-content" style="background:${mapStyle.backgroundColor || "#fff"};">
                <h3 class="map-overlay-title" style="color:${mapStyle.color};">${s.storeName}</h3>
                
                <div class="map-overlay-row">
                    <i class="fa-solid fa-location-dot" style="color:${mapStyle.iconColor};"></i>
                    <span style="color:${mapStyle.color};">${[s.address, s.city, s.region, s.code].filter(Boolean).join(', ')}</span>
                </div>

                ${s.phone ? `
                <div class="map-overlay-row">
                    <i class="fa-solid fa-phone" style="color:${mapStyle.iconColor};"></i>
                    <a href="tel:${s.phone}" style="color:${mapStyle.color};">${s.phone}</a>
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
                        <tbody>${hoursHtml}</tbody>
                    </table>
                </div>

                ${socialHtml ? `
                <div class="map-overlay-socials">${socialHtml}</div>
                ` : ''}

                ${isValidCoordinate(s.lat, s.lng) ? `
                <a href="${directionUrl}" 
                   target="_blank" 
                   class="map-overlay-direction-btn"
                   style="
                       display: flex;
                       justify-content: center;
                       align-items: center;
                       width: 100%;
                       padding: 10px 0;
                       margin-top: 12px;
                       border-radius: 8px;
                       text-decoration: none;
                       font-weight: 600;
                       font-size: 14px;
                       transition: all 0.3s ease;
                       box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                       background-color: ${mapStyle.iconColor || '#333'}; 
                       color: #ffffff;
                   "
                   onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 12px rgba(0,0,0,0.15)'; this.style.opacity='0.95';"
                   onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px rgba(0,0,0,0.1)'; this.style.opacity='1';"
                >
                    <i class="fa-solid fa-diamond-turn-right" style="margin-right: 8px; font-size: 16px;"></i>
                    Get Direction
                </a>
                ` : `
                <div class="map-overlay-no-coords"
                     style="
                         display: flex;
                         align-items: center;
                         justify-content: center;
                         width: 100%;
                         padding: 10px;
                         margin-top: 12px;
                         border-radius: 8px;
                         background-color: #fef3c7;
                         border: 1px dashed #f59e0b;
                         color: #92400e;
                         font-size: 13px;
                         gap: 8px;
                     "
                >
                    <i class="fa-solid fa-location-slash" style="font-size: 14px;"></i>
                    <span>Location not available on map</span>
                </div>
                `}
            </div>
        `;
    }
}