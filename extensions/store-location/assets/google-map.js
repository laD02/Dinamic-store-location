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
    if (!apiKey) return;

    await loadGoogleMaps(apiKey);

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

    let map;
    let markers = [];
    let currentOverlay = null;
    let mapStyle = null;

    try {
        const res = await fetch("/apps/store-locator");
        const { stores, style } = await res.json();
        mapStyle = style || {};

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

        loadStores(wrapper, (storeIndex) => {
            const storeData = markers.find(m => m.index === storeIndex);
            if (storeData) {
                panToStore(storeData.store, storeData.marker);
            }
        });

    } catch (err) {
        console.error("Store locator error:", err);
    }

    /************************************************
     * Pan + Overlay
     ************************************************/
    function panToStore(store, marker) {
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
                this.div.style.borderRadius = `${mapStyle.cornerRadius || 12}px`;

                if (mapStyle.shadowColor) {
                    const shadow = hexToRgba(
                        mapStyle.shadowColor,
                        (mapStyle.transparency || 30) / 100
                    );
                    this.div.style.boxShadow = `
            ${mapStyle.anchorx || 0}px
            ${mapStyle.anchory || 4}px
            ${mapStyle.blur || 12}px
            ${shadow}
          `;
                }

                this.div.innerHTML = `
          <button class="map-overlay-close">×</button>

          ${store.image ? `
            <div class="map-overlay-hero">
              <img src="${store.image}" />
            </div>
          ` : ""}

          <div class="map-overlay-content" style="
            background:${mapStyle.backgroundColor || "#fff"};
            color:${mapStyle.color || "#000"};
          ">
            <h3>${store.storeName || store.name}</h3>
            <p>${store.address || ""}</p>
            ${store.phone ? `<p>${store.phone}</p>` : ""}
            ${store.url ? `<a href="${store.url}" target="_blank">${store.url}</a>` : ""}
          </div>
        `;

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
}
