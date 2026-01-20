async function loadStores(wrapper, onSelectStore) {
  try {
    const res = await fetch("/apps/store-locator");
    const { stores, style } = await res.json();

    const storeListLoading = wrapper.querySelector(".store-list-loading");
    const container = wrapper.querySelector(".store-list");
    const searchInput = wrapper.querySelector(".sl-address");

    if (!container) return;

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
          <div
            class="store-item"
            data-original-index="${stores.indexOf(s)}"
            style="
              border:2px solid rgb(210,207,207);
              padding:12px;
              margin-bottom:8px;
              cursor:pointer;
              background:white;
              transition:border-color .2s;
            "
          >
            <p style="
              color:${style.primaryColor};
              font-family:${style.primaryFont};
              margin:0 0 6px;
              font-weight:600;
            ">
              ${s.storeName}
            </p>

            <p style="
              color:${style.primaryColor};
              font-family:${style.secondaryFont};
              margin:0 0 6px;
              font-size:11px;
            ">
              ${s.address}, ${s.city}, ${s.code}
            </p>

            ${s.phone ? `
              <p style="
                color:${style.secondaryColor};
                font-family:${style.secondaryFont};
                margin:0;
                font-size:11px;
              ">
                ${s.phone}
              </p>
            ` : ""}
          </div>
        `)
        .join("");
    }

    /************************************************
     * Init
     ************************************************/
    if (storeListLoading) storeListLoading.style.display = "none";
    container.style.display = "block";

    renderStores(stores);

    /************************************************
     * Search
     ************************************************/
    if (searchInput) {
      searchInput.addEventListener("input", e => {
        const term = e.target.value.toLowerCase().trim();

        if (!term) {
          renderStores(stores);
          return;
        }

        const filtered = stores.filter(store =>
          store.storeName?.toLowerCase().includes(term) ||
          store.address?.toLowerCase().includes(term) ||
          store.code?.toLowerCase().includes(term)
        );

        renderStores(filtered);
      });
    }

    /************************************************
     * Click store item (delegation – scoped)
     ************************************************/
    container.addEventListener("click", e => {
      const item = e.target.closest(".store-item");
      if (!item) return;

      const originalIndex = Number(item.dataset.originalIndex);

      // reset border CHỈ trong block này
      container.querySelectorAll(".store-item").forEach(el => {
        el.style.borderColor = "rgb(210,207,207)";
      });

      item.style.borderColor = style.secondaryColor;

      // callback cho map
      if (typeof onSelectStore === "function") {
        onSelectStore(originalIndex);
      }
    });

  } catch (err) {
    console.error("Load stores error:", err);
  }
}
