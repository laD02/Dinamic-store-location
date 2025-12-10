async function loadStores() {
  try {
    const res = await fetch("/apps/storeLoader");
    const { stores, style } = await res.json();
    const storeListLoading = document.getElementById("store-list-loading");
    const storeListContainer = document.getElementById("store-list");

    const container = document.getElementById("store-list");
    const searchInput = document.getElementById("sl-address");

    // ✅ Hàm render stores
    function renderStores(storesToRender) {
      container.innerHTML = storesToRender
        .map((s, index) => `
          <div 
            class="store-item" 
            data-id="${index}"
            data-original-index="${stores.indexOf(s)}"
            style="
              border: 2px solid rgb(210, 207, 207);
              padding: 12px;
              margin-bottom: 8px;
              cursor: pointer;
              transition: border-color 0.3s;
              background-color: white
            "
          >
            <p style="color: ${style.primaryColor}; font-family: ${style.primaryFont}; margin: 0 0 8px 0; font-weight: 600;">
              ${s.storeName}
            </p>

            <p style="color: ${style.primaryColor}; font-family: ${style.secondaryFont}; margin: 0 0 8px 0; font-size: 11px;">
              ${s.address}, ${s.city}, ${s.state}, ${s.code}
            </p>

            <p style="color: ${style.secondaryColor}; margin: 0; font-size: 11px;">
              ${s.phone}
            </p>
          </div>
        `)
        .join("");

      // Nếu không có kết quả
      if (storesToRender.length === 0) {
        container.innerHTML = `
          <p style="padding: 20px; text-align: center; color: #999;">
            No stores found matching "${searchInput.value}"
          </p>
        `;
      }
    }
    if (storeListLoading) storeListLoading.style.display = "none";
    if (storeListContainer) storeListContainer.style.display = "block";

    // ✅ Render tất cả stores ban đầu
    renderStores(stores);

    // ✅ Xử lý tìm kiếm
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        const searchTerm = e.target.value.toLowerCase().trim();

        // Nếu input rỗng, hiện tất cả
        if (searchTerm === "") {
          renderStores(stores);
          return;
        }

        // Lọc stores theo tên, địa chỉ, thành phố, state, zip code
        const filteredStores = stores.filter(store => {
          return (
            store.storeName?.toLowerCase().includes(searchTerm) ||
            store.address?.toLowerCase().includes(searchTerm) ||
            store.city?.toLowerCase().includes(searchTerm) ||
            store.state?.toLowerCase().includes(searchTerm) ||
            store.code?.toLowerCase().includes(searchTerm)
          );
        });

        renderStores(filteredStores);
      });
    }

    // ✅ Event delegation: click vào item
    container.addEventListener("click", (e) => {
      const item = e.target.closest(".store-item");
      if (!item) return;

      // Lấy index gốc từ mảng stores ban đầu
      const originalIndex = parseInt(item.dataset.originalIndex);

      // Reset border toàn bộ
      document.querySelectorAll(".store-item").forEach(el => {
        el.style.borderColor = "rgb(210, 207, 207)";
      });

      // Set border color cho item được chọn
      item.style.borderColor = style.secondaryColor;

      // Pan tới map
      if (window.selectStoreByIndex) {
        window.selectStoreByIndex(originalIndex);
      }
    });

  } catch (err) {
    console.error("Proxy fetch error:", err);
  }
}

loadStores();