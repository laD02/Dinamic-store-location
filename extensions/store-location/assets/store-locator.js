async function loadStores(wrapper, onSelectStore, onFilter) {
  try {
    const res = await fetch("/apps/store-locator");
    const { stores, style } = await res.json();

    // Calculate Activity Ranks for top 3
    const storesSorted = [...stores]
      .filter(s => (s.totalActivity || 0) > 0)
      .sort((a, b) => (b.totalActivity || 0) - (a.totalActivity || 0));

    stores.forEach(s => {
      const idx = storesSorted.findIndex(sorted => sorted.id === s.id);
      if (idx >= 0 && idx < 3) {
        s.activityRank = idx + 1;
      }
    });

    const storeListLoading = wrapper.querySelector(".store-list-loading");
    const container = wrapper.querySelector(".store-list");
    const searchInput = wrapper.querySelector(".sl-address");

    if (!container) return;

    /************************************************
     * Helpers for Toast & Clipboard
     ************************************************/
    function showToast(title, message, type = 'success') {
      // Remove existing toasts if any
      document.querySelectorAll('.sl-toast-notification').forEach(t => t.remove());

      const toast = document.createElement('div');
      toast.className = `sl-toast-notification`;
      toast.innerHTML = `
        <div class="sl-toast-content ${type}">
          <i class="fa-solid ${type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation'}"></i>
          <div class="sl-toast-text">
            <strong>${title}</strong>
            <p>${message}</p>
          </div>
          <button class="sl-toast-close">×</button>
        </div>
      `;
      document.body.appendChild(toast);

      const closeBtn = toast.querySelector('.sl-toast-close');
      closeBtn.onclick = () => {
        toast.style.animation = 'slideOutRight 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
      };

      setTimeout(() => {
        if (toast.parentNode) {
          toast.style.animation = 'slideOutRight 0.3s forwards';
          setTimeout(() => toast.remove(), 300);
        }
      }, 4000);
    } async function copyToClipboard(text) {
      try {
        await navigator.clipboard.writeText(text);
        showToast('Copied!', 'Address copied to clipboard', 'success');
      } catch (err) {
        // Fallback for older browsers
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          showToast('Copied!', 'Address copied to clipboard', 'success');
        } catch (e) {
          showToast('Error', 'Could not copy address', 'warning');
        }
        document.body.removeChild(textArea);
      }
    }
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
        const minutesUntilClose = closeMinutes - currentMinutes;
        if (minutesUntilClose > 0 && minutesUntilClose <= 60) {
          return { isOpen: true, text: `Closing Soon (${minutesUntilClose}m)`, class: "closing-soon" };
        }
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
        .map(s => {
          const fullAddress = [s.address, s.city, s.code].filter(Boolean).join(', ');
          const status = isStoreOpen(s);

          let tagsHtml = "";
          if (s.tags) {
            try {
              const tagsArray = typeof s.tags === 'string' ? JSON.parse(s.tags) : s.tags;
              if (Array.isArray(tagsArray)) {
                const validTags = tagsArray.filter(tag => tag && tag.trim() !== "");
                if (validTags.length > 0) {
                  tagsHtml = `
                    <div class="sl-tags-wrapper">
                      <div class="sl-tags-icon-container">
                        <i class="fa-solid fa-tags sl-tags-icon"></i>
                      </div>
                      <div class="sl-tags-list">
                        ${validTags.map(tag => `<span class="sl-tag-badge">${tag}</span>`).join('')}
                      </div>
                    </div>
                  `;
                }
              }
            } catch (e) {
              console.error("Error parsing tags:", e);
            }
          }

          return `
          <div class="store-item" data-original-index="${stores.indexOf(s)}">
            <div class="store-item-header">
              <div class="store-item-header-top">
                <h4 class="store-item-name">${s.storeName}</h4>
                <span class="store-status-badge ${status.class}">
                  <span class="status-dot"></span> ${status.text}
                </span>
              </div>
              <div class="store-item-header-bottom">
                ${s.activityRank ? `
                  <span class="sl-rank-badge rank-${s.activityRank}">
                    <i class="fa-solid fa-fire"></i> Rank #${s.activityRank}
                  </span>
                ` : ""}
                ${s.distance ? `
                  <span class="store-distance-tag">
                    <i class="fa-solid fa-person-walking"></i> ${s.distance < 1 ? (s.distance * 1000).toFixed(0) + ' m' : s.distance.toFixed(1) + ' km'} away
                  </span>
                ` : ""}
              </div>
            </div>

            <div class="store-item-details">
              <div class="store-item-row address-row">
                <i class="fa-solid fa-location-dot"></i>
                <span>${fullAddress}</span>
                <button class="sl-copy-btn" title="Copy Address" data-address="${fullAddress}">
                  <i class="fa-regular fa-copy"></i>
                </button>
              </div>

              ${s.phone ? `
              <div class="store-item-row phone-row">
                <i class="fa-solid fa-phone"></i>
                <span>${s.phone}</span>
              </div>
              ` : ""}
              ${tagsHtml}
            </div>
          </div>
        `;
        })
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
    const topStoreFilter = wrapper.querySelector("#sl-top-store-filter");
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
      const showTopOnly = topStoreFilter?.checked || false;
      const radius = parseFloat(radiusSelect?.value) || Infinity;

      let filtered = stores.filter(store => {
        // Clear distance if no user location
        if (!userCoords) {
          delete store.distance;
        }

        // Search term filter
        let tagsString = "";
        if (store.tags) {
          if (typeof store.tags === 'string') {
            tagsString = store.tags;
          } else {
            try { tagsString = JSON.stringify(store.tags); } catch (e) { }
          }
        }

        const matchesTerm = !term ||
          store.storeName?.toLowerCase().includes(term) ||
          store.address?.toLowerCase().includes(term) ||
          store.code?.toLowerCase().includes(term) ||
          tagsString.toLowerCase().includes(term);


        // Open status filter
        let matchesOpen = true;
        if (showOpenOnly) {
          const status = isStoreOpen(store);
          matchesOpen = status.isOpen;
        }

        // Radius filter
        let matchesRadius = true;
        if (userCoords) {
          if (store.lat && store.lng) {
            const distance = calculateDistance(userCoords.lat, userCoords.lng, store.lat, store.lng);
            store.distance = distance; // Store distance for display
            if (radius !== Infinity) {
              matchesRadius = distance <= radius;
            }
          } else if (radius !== Infinity) {
            matchesRadius = false;
          }
        }

        return matchesTerm && matchesOpen && matchesRadius;
      });

      // Sort logic
      if (showTopOnly) {
        // Sort by activity descending and limit to top 3
        filtered.sort((a, b) => (b.totalActivity || 0) - (a.totalActivity || 0));
        filtered = filtered.slice(0, 3);
      } else if (userCoords) {
        // Default: Sort by distance if user location is available
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

    if (topStoreFilter) {
      topStoreFilter.addEventListener("change", filterAndRender);
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
      const copyBtn = e.target.closest(".sl-copy-btn");

      if (copyBtn) {
        e.stopPropagation();
        const address = copyBtn.dataset.address;
        copyToClipboard(address);
        return;
      }
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

    // Initialize Google Places Autocomplete if available
    if (window.google && window.google.maps && window.google.maps.places && searchInput) {
      const autocomplete = new google.maps.places.Autocomplete(searchInput, {
        types: ['geocode', 'establishment'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (place.geometry) {
          searchInput.value = place.formatted_address || place.name;
          filterAndRender();
        }
      });

      // Prevent form submission on enter if within a form
      searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
        }
      });
    }

    // Periodically refresh statuses every 60 seconds
    setInterval(() => {
      const items = container.querySelectorAll(".store-item");
      items.forEach(item => {
        const originalIndex = Number(item.dataset.originalIndex);
        const store = stores[originalIndex];
        if (store) {
          const status = isStoreOpen(store);
          const badge = item.querySelector(".store-status-badge");
          if (badge) {
            badge.className = `store-status-badge ${status.class}`;
            badge.innerHTML = `<span class="status-dot"></span> ${status.text}`;
          }
        }
      });
      // Notify map to refresh overlays if needed
      window.dispatchEvent(new CustomEvent('sl:status-refresh'));
    }, 5000);

  } catch (err) {
    console.error("Load stores error:", err);
  }
}
