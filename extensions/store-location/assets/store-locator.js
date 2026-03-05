async function loadStores(wrapper, onSelectStore, onFilter) {
  try {
    const res = await fetch("/apps/store-locator");
    const { stores, style } = await res.json();

    const storeListLoading = wrapper.querySelector(".store-list-loading");
    const container = wrapper.querySelector(".store-list");
    const searchInput = wrapper.querySelector(".sl-address");

    if (!container) return;

    // Helper for Event Tracking
    window.slSessionId = window.slSessionId || Math.random().toString(36).substring(2, 15);
    window.trackStoreEvent = async function (eventType, data = {}) {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        let shop = urlParams.get('shop') || window.Shopify?.shop;
        if (!shop && document.querySelector('.sl-wrapper')) {
          // Attempt to get shop from a data attribute if available, or just send without and let proxy handle if it can. 
          // Often Shopify App Proxy automatically includes ?shop= in the forwarded request.
        }

        const payload = {
          eventType,
          sessionId: window.slSessionId,
          device: window.innerWidth < 768 ? 'mobile' : 'desktop',
          ...data
        };

        const fetchUrl = shop ? `/apps/store-locator?shop=${shop}` : '/apps/store-locator';

        fetch(fetchUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload)
        }).catch(err => console.error("Tracking Error:", err));
      } catch (e) {
        console.error("Failed to track event:", e);
      }
    };

    /************************************************
     * Helper for Opening Hours
     ************************************************/
    function isStoreOpen(store) {
      if (!store.time) return { isOpen: false, text: "Closed", class: "closed" };

      const now = new Date();
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = days[now.getDay()];

      const openTime = store.time[`${dayName}Open`];
      const closeTime = store.time[`${dayName}Close`];

      if (!openTime || !closeTime || openTime === 'close' || closeTime === 'close') {
        return { isOpen: false, text: "Closed", class: "closed" };
      }

      // Parse current time to minutes
      const currentMinutes = now.getHours() * 60 + now.getMinutes();

      // Parse open/close times (assuming format HH:mm or H:mm)
      const parseTimeToMinutes = (timeStr) => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
      };

      const openMinutes = parseTimeToMinutes(openTime);
      const closeMinutes = parseTimeToMinutes(closeTime);

      if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
        return { isOpen: true, text: "Open Now", class: "open" };
      }

      return { isOpen: false, text: "Closed", class: "closed" };
    }

    /************************************************
     * Render stores
     ************************************************/
    function renderStores(storesToRender) {
      container.innerHTML = "";

      if (storesToRender.length === 0) {
        container.innerHTML = `
          <p style="padding:20px;text-align:center;color:#999;">
            No stores found${searchInput?.value ? ` for "${searchInput.value}"` : ""}
          </p>
        `;
        return;
      }

      container.innerHTML = storesToRender
        .map(s => `
          <div class="store-item" data-original-index="${stores.indexOf(s)}">
            <div class="store-item-header">
              <h4 class="store-item-name">${s.storeName}</h4>
              ${(() => {
            const status = isStoreOpen(s);
            return `<span class="store-status-badge ${status.class}">
                  <span class="status-dot"></span> ${status.text}
                </span>`;
          })()}
            </div>

            <div class="store-item-details">
              <div class="store-item-row address-row">
                <i class="fa-solid fa-location-dot"></i>
                <span>${[s.address, s.city, s.code].filter(Boolean).join(', ')}</span>
              </div>

              ${s.phone ? `
              <div class="store-item-row phone-row">
                <i class="fa-solid fa-phone"></i>
                <span>${s.phone}</span>
              </div>
              ` : ""}
            </div>
          </div>
        `)
        .join("");
    }

    /************************************************
     * Init
     ************************************************/
    if (storeListLoading) storeListLoading.style.display = "none";
    container.style.display = "block";

    // Set CSS variables for dynamic theming
    if (style) {
      container.style.setProperty('--sl-primary', style.primaryColor || '#000');
      container.style.setProperty('--sl-secondary', style.secondaryColor || '#3B82F6');
      container.style.setProperty('--sl-primary-font', style.primaryFont || 'inherit');
      container.style.setProperty('--sl-secondary-font', style.secondaryFont || 'inherit');
    }

    renderStores(stores);

    /************************************************
     * Filter Logic
     ************************************************/
    const openNowFilter = wrapper.querySelector("#sl-open-now-filter");
    const detectLocationBtn = wrapper.querySelector("#sl-detect-location");
    const radiusSelect = wrapper.querySelector("#sl-radius-select");
    let userCoords = null;

    // Haversine formula to calculate distance in KM
    function calculateDistance(lat1, lon1, lat2, lon2) {
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    }

    function filterAndRender() {
      const term = searchInput?.value?.toLowerCase().trim() || "";
      const showOpenOnly = openNowFilter?.checked || false;
      const radius = parseFloat(radiusSelect?.value) || Infinity;

      const filtered = stores.filter(store => {
        // Search term filter
        const matchesTerm = !term ||
          store.storeName?.toLowerCase().includes(term) ||
          store.address?.toLowerCase().includes(term) ||
          store.code?.toLowerCase().includes(term);

        // Open status filter
        let matchesOpen = true;
        if (showOpenOnly) {
          const status = isStoreOpen(store);
          matchesOpen = status.isOpen;
        }

        // Radius filter
        let matchesRadius = true;
        if (userCoords && radius !== Infinity) {
          if (store.lat && store.lng) {
            const distance = calculateDistance(userCoords.lat, userCoords.lng, store.lat, store.lng);
            store.distance = distance; // Store distance for possible sorting or display
            matchesRadius = distance <= radius;
          } else {
            matchesRadius = false;
          }
        }

        return matchesTerm && matchesOpen && matchesRadius;
      });

      // Sort by distance if user location is available
      if (userCoords && radius !== Infinity) {
        filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      }

      renderStores(filtered);
      if (typeof onFilter === "function") {
        onFilter(filtered, userCoords);
      }

      // Track Search if term exists
      if (term) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
          const storeIds = filtered.map(s => s.id).filter(Boolean);
          if (window.trackStoreEvent) {
            window.trackStoreEvent("SEARCH", { searchKeyword: term, storeIds });
          }
        }, 1000);
      }
    }

    let searchTimeout;
    if (searchInput) {
      searchInput.addEventListener("input", filterAndRender);
    }

    if (openNowFilter) {
      openNowFilter.addEventListener("change", filterAndRender);
    }

    if (detectLocationBtn) {
      detectLocationBtn.addEventListener("click", () => {
        if (detectLocationBtn.classList.contains('active')) {
          // Reset location
          userCoords = null;
          detectLocationBtn.classList.remove('active');
          radiusSelect.value = "";
          radiusSelect.disabled = true;
          filterAndRender();
          return;
        }

        detectLocationBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        navigator.geolocation.getCurrentPosition(
          (position) => {
            userCoords = {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            };
            detectLocationBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>';
            detectLocationBtn.classList.add('active');
            radiusSelect.disabled = false;
            filterAndRender();
          },
          (error) => {
            console.error("Geolocation error:", error);
            detectLocationBtn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>';
            alert("Could not determine your location. Please check your browser permissions.");
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
        );
      });
    }

    if (radiusSelect) {
      radiusSelect.addEventListener("change", filterAndRender);
    }

    /************************************************
     * Click store item (delegation – scoped)
     ************************************************/
    container.addEventListener("click", e => {
      const item = e.target.closest(".store-item");
      if (!item) return;

      const originalIndex = Number(item.dataset.originalIndex);

      // Single dynamic selection class
      container.querySelectorAll(".store-item").forEach(el => {
        el.classList.remove("selected");
      });

      item.classList.add("selected");

      // callback cho map
      if (typeof onSelectStore === "function") {
        onSelectStore(originalIndex);
      }

      // Track Event
      const clickedStore = stores[originalIndex];
      if (clickedStore) {
        window.trackStoreEvent("VIEW_STORE", { storeId: clickedStore.id });
      }
    });

  } catch (err) {
    console.error("Load stores error:", err);
  }
}
