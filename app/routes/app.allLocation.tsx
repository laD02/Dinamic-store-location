// app/routes/app.help-center.tsx
import {
  ActionFunctionArgs,
  Link,
  LoaderFunctionArgs,
  useFetcher,
  useLoaderData,
} from "react-router";
import { useEffect, useState, useMemo } from "react";
import prisma from "app/db.server";
import { Store } from "@prisma/client";
import { exportStoresToCSV } from "../utils/exportCSV";
import { useAppBridge } from '@shopify/app-bridge-react';
import { authenticate } from "../shopify.server";
import { deleteImageFromCloudinary } from "../utils/upload.server";
import Import from "app/component/allLocation/Import";
import { getCoordinatesFromAddress } from "../utils/Geocoding";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session?.shop;
  const storeData = await prisma.store.findMany({
    where: { shop },
    orderBy: {
      createdAt: 'desc', // mới nhất lên đầu
    },
  });

  return storeData.map((s: any) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "import") {
    const { session } = await authenticate.admin(request);
    const shop = session?.shop;
    const file = formData.get("file");

    if (!file) {
      return { error: "No file uploaded" };
    }

    if (!(file instanceof File)) {
      return { error: "Invalid file format" };
    }

    try {
      // Đọc file content - xử lý cho cả browser và Node.js environment
      let text: string;

      if (typeof file.text === 'function') {
        // Browser environment
        text = await file.text();
      } else {
        // Node.js environment - convert to buffer then string
        const buffer = await file.arrayBuffer();
        text = new TextDecoder('utf-8').decode(buffer);
      }

      // Xử lý BOM (Byte Order Mark) nếu có
      const cleanText = text.replace(/^\uFEFF/, '');

      const lines = cleanText.split(/\r?\n/).filter(line => line.trim());

      if (lines.length < 2) {
        return { error: "CSV file is empty or invalid. Please ensure it has header row and at least one data row." };
      }

      // Bỏ qua dòng header
      const dataLines = lines.slice(1);
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];

        // Skip empty lines
        if (!line.trim()) {
          continue;
        }

        try {
          // Parse CSV line - cải thiện regex để xử lý tốt hơn
          const values: string[] = [];
          let current = '';
          let inQuotes = false;

          for (let j = 0; j < line.length; j++) {
            const char = line[j];
            const nextChar = line[j + 1];

            if (char === '"') {
              if (inQuotes && nextChar === '"') {
                current += '"';
                j++; // Skip next quote
              } else {
                inQuotes = !inQuotes;
              }
            } else if (char === ',' && !inQuotes) {
              values.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          values.push(current.trim()); // Add last value

          // Validate minimum columns (Store Name, Address, City, Zip Code, Country)
          if (values.length < 5) {
            errors.push(`Line ${i + 2}: Not enough columns (found ${values.length}, need at least 5)`);
            errorCount++;
            continue;
          }

          // Map theo template: Store Name, Address, City, Zip Code, Country, Phone, Website
          const storeName = values[0] || "";
          const address = values[1] || "";
          const city = values[2] || "";
          const code = values[3] || "";
          const country = values[4] || "";
          const phone = values[5] || "";
          const website = values[6] || "";

          // Validate required fields
          if (!storeName.trim()) {
            errors.push(`Line ${i + 2}: Store Name is required`);
            errorCount++;
            continue;
          }
          if (!address.trim()) {
            errors.push(`Line ${i + 2}: Address is required`);
            errorCount++;
            continue;
          }
          if (!city.trim()) {
            errors.push(`Line ${i + 2}: City is required`);
            errorCount++;
            continue;
          }

          if (!country.trim()) {
            errors.push(`Line ${i + 2}: Country is required`);
            errorCount++;
            continue;
          }

          if (!phone.trim()) {
            errors.push(`Line ${i + 2}: Phone is required`);
            errorCount++;
            continue;
          }

          // Lấy tọa độ từ địa chỉ
          const coordinates = await getCoordinatesFromAddress(
            address.trim(),
            city.trim(),
            country.trim(),
            code.trim() || undefined
          );

          // Nếu không lấy được tọa độ, ghi log nhưng vẫn tiếp tục tạo store
          if (!coordinates) {
            console.warn(`Line ${i + 2}: Could not geocode address for ${storeName}`);
          }

          // Tạo store mới với đúng schema, bao gồm tọa độ
          await prisma.store.create({
            data: {
              shop: shop || "",
              storeName: storeName.trim(),
              address: address.trim(),
              city: city.trim(),
              state: "",
              code: code.trim(),
              region: country.trim(),
              phone: phone.trim(),
              image: "",
              url: website.trim(),
              directions: "",
              source: "import",
              visibility: "hidden",
              lat: coordinates?.lat || null,
              lng: coordinates?.lng || null,
              time: {
                mondayOpen: "09:00",
                mondayClose: "17:00",
                tuesdayOpen: "09:00",
                tuesdayClose: "17:00",
                wednesdayOpen: "09:00",
                wednesdayClose: "17:00",
                thursdayOpen: "09:00",
                thursdayClose: "17:00",
                fridayOpen: "09:00",
                fridayClose: "17:00",
                saturdayOpen: "09:00",
                saturdayClose: "17:00",
                sundayOpen: "09:00",
                sundayClose: "17:00",
              }
            }
          });

          successCount++;

          // Thêm delay nhỏ giữa các request để tránh rate limit
          if (i < dataLines.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }

        } catch (error: any) {
          errors.push(`Line ${i + 2}: ${error.message}`);
          errorCount++;
        }
      }

      if (successCount === 0) {
        const errorMsg = errors.length > 0
          ? `No locations imported. First 3 errors: ${errors.slice(0, 3).join('; ')}`
          : 'No valid data rows found in CSV file.';
        return { error: errorMsg };
      }

      return {
        success: true,
        count: successCount,
        message: `Successfully imported ${successCount} location${successCount > 1 ? 's' : ''}${errorCount > 0 ? `. ${errorCount} row${errorCount > 1 ? 's' : ''} had errors and were skipped.` : '!'}`
      };

    } catch (error: any) {
      console.error("Import error:", error);
      return { error: `Failed to process CSV file: ${error.message}` };
    }
  }

  if (actionType === "deleteId") {
    const id = formData.get("id") as string;

    // 1. Lấy thông tin store để lấy URL ảnh
    const store = await prisma.store.findUnique({
      where: { id },
      select: { image: true }
    });

    // 2. Xóa ảnh từ Cloudinary nếu có
    if (store?.image) {
      await deleteImageFromCloudinary(store.image);
    }

    // 3. Xóa store từ database
    await prisma.store.delete({ where: { id } });

    return { success: true };
  }

  if (actionType === "delete") {
    const ids = formData.getAll("ids") as string[];

    // 1. Lấy danh sách ảnh của các store cần xóa
    const stores = await prisma.store.findMany({
      where: { id: { in: ids } },
      select: { id: true, image: true }
    });

    // 2. Xóa tất cả ảnh từ Cloudinary
    const deletePromises = stores
      .filter(store => store.image) // Chỉ xóa những store có ảnh
      .map(store => deleteImageFromCloudinary(store.image!));

    await Promise.all(deletePromises);

    // 3. Xóa stores từ database
    await prisma.store.deleteMany({ where: { id: { in: ids } } });

    return { success: true };
  }

  if (actionType === "updateVisibility") {
    const visibility = formData.get("visibility") as string;
    const selectedIds = JSON.parse(formData.get("selectedIds") as string);

    if (!["visible", "hidden"].includes(visibility)) {
      return { error: "Invalid visibility value" };
    }

    if (selectedIds.length > 0) {
      await prisma.store.updateMany({
        where: { id: { in: selectedIds } },
        data: { visibility },
      });
    }
    return { oks: true };
  }

  return { error: "Unknown action" };
}

export default function AllLocation() {
  const storesData = useLoaderData<Store[]>();
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fetcher = useFetcher();
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedVisibility, setSelectedVisibility] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const shopify = useAppBridge()
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    // Lấy width lần đầu
    setWindowWidth(window.innerWidth);

    // Update khi resize
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ Đọc message từ URL - chỉ chạy 1 lần khi mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = params.get('message');

    if (message === 'deleted') {
      shopify.toast.show('Store deleted successfully!');

      // Xóa param khỏi URL
      window.history.replaceState({}, '', '/app');
    }
  }, []); // Empty deps - chỉ chạy 1 lần

  // Theo dõi fetcher.data cho các action trong trang này
  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show('Stores deleted successfully!');
    }
  }, [fetcher.data]);

  useEffect(() => {
    if (fetcher.data?.oks) {
      shopify.toast.show('Stores updated visibility successfully!');
    }
  }, [fetcher.data]);

  useEffect(() => {
    setStores(storesData);
  }, [storesData]);

  useEffect(() => {
    setSelectedIds(prev => {
      const newSet = new Set<string>();
      stores.forEach(s => {
        if (prev.has(s.id)) newSet.add(s.id);
      });
      return newSet;
    });
  }, [stores]);

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchesSearch =
        store.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.address.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesSource =
        selectedSources.length === 0 || selectedSources.includes(store.source);

      const matchesVisibility =
        !selectedVisibility ||
        store.visibility.toLowerCase() === selectedVisibility.toLowerCase();

      return matchesSearch && matchesSource && matchesVisibility;
    });
  }, [stores, searchTerm, selectedSources, selectedVisibility]);

  // Tính tổng số trang
  const totalPages = Math.ceil(filteredStores.length / itemsPerPage);

  // Tính vị trí bắt đầu và kết thúc
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;

  // Lấy chỉ 5 items của trang hiện tại
  const currentStores = filteredStores.slice(startIndex, endIndex);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedSources, selectedVisibility]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAllVisible = () => {
    const allSelected = filteredStores.every(s => selectedIds.has(s.id));
    setSelectedIds(prev => {
      const next = new Set(prev);
      filteredStores.forEach(s => {
        allSelected ? next.delete(s.id) : next.add(s.id);
      });
      return next;
    });
  };

  useEffect(() => {
    // Nếu trang hiện tại không còn item nhưng vẫn còn item ở trang cũ → lùi lại 1 trang
    if (currentPage > 1 && currentStores.length === 0) {
      setCurrentPage(prev => prev - 1);
    }
  }, [filteredStores, currentPage, currentStores.length]);


  const allVisibleSelected =
    filteredStores.length > 0 &&
    filteredStores.every(s => selectedIds.has(s.id));

  const hasChecked = selectedIds.size > 0;
  const checkedRowCount = selectedIds.size;

  const handleDeleteTrash = (id: string) => {
    setStores(prev => prev.filter(s => s.id !== id));
    const formData = new FormData();
    formData.append("actionType", "deleteId");
    formData.append("id", id);
    fetcher.submit(formData, { method: "post" });
  };

  const handleDelete = () => {
    const ids = Array.from(selectedIds);
    const formData = new FormData();
    formData.append("actionType", "delete");
    ids.forEach(id => formData.append("ids", id));
    fetcher.submit(formData, { method: "post" });
  };

  const updateVisibility = (visibility: "visible" | "hidden") => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setStores(prev =>
      prev.map(s => (ids.includes(s.id) ? { ...s, visibility } : s))
    );

    fetcher.submit(
      {
        actionType: "updateVisibility",
        visibility,
        selectedIds: JSON.stringify(ids),
      },
      { method: "post" }
    );
  };

  const handleExport = () => {
    const selectedStoreList = stores.filter(s => selectedIds.has(s.id));
    const selectedIdList = Array.from(selectedIds);

    const success = exportStoresToCSV(selectedStoreList, selectedIdList);

    if (success) {
      shopify.toast.show('Stores exported successfully!');
    }
  };

  return (
    <s-page heading="Store Locator">
      <s-stack direction="inline" justifyContent="space-between" alignItems="center">
        <h2>
          All Locations
        </h2>
        {
          windowWidth > 768
            ?
            <s-stack direction="inline" gap="base">
              <Import />
              <Link to="/app/addLocation" >
                <s-button variant="primary" icon="plus-circle">Add Location</s-button>
              </Link>
            </s-stack>
            :
            <s-stack direction="inline" justifyContent="end" gap="base">
              <Import />
              <Link to="/app/addLocation" >
                <s-button variant="primary" icon="plus-circle"></s-button>
              </Link>
            </s-stack>
        }
      </s-stack>

      <s-section padding="none">
        <s-table
        // paginate
        // hasPreviousPage={currentPage > 1}  
        // hasNextPage={currentPage < totalPages}  
        // onPreviousPage={() => setCurrentPage(prev => Math.max(1, prev - 1))}
        // onNextPage={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
        >
          <s-grid slot="filters" gap="small-200">
            <s-stack direction="inline" gap="small-200" justifyContent={hasChecked ? "space-between" : undefined}>
              {hasChecked && !showSearch && (
                <s-stack direction="inline" gap="base" justifyContent="space-between" alignItems="center">
                  <s-stack direction="inline" gap="small-200" justifyContent="start">
                    <s-button onClick={() => updateVisibility("visible")}>
                      Set As Visible
                    </s-button>
                    <s-button onClick={() => updateVisibility("hidden")}>
                      Set As Hidden
                    </s-button>
                    <s-button commandFor="customer-menu" icon="menu-horizontal"></s-button>
                    <s-popover id="customer-menu">
                      <s-stack direction="block">
                        <s-button variant="tertiary" onClick={handleExport}>Export CSV</s-button>
                        <s-button variant="tertiary" commandFor="deleteTrash-modal" tone="critical">Delete all stores</s-button>
                      </s-stack>
                    </s-popover>
                    <s-modal id="deleteTrash-modal" heading="Delete Location">
                      <s-text>
                        Are you sure you want to delete {selectedIds.size} stores? This action cannot be undone.
                      </s-text>
                      <s-button
                        slot="secondary-actions"
                        variant="secondary"
                        commandFor="deleteTrash-modal"
                        command="--hide"
                      >
                        Cancel
                      </s-button>

                      <s-button
                        slot="primary-action"
                        variant="primary"
                        tone="critical"
                        commandFor="deleteTrash-modal"
                        command="--hide"
                        onClick={() => handleDelete()}
                      >
                        Delete
                      </s-button>
                    </s-modal>
                  </s-stack>
                </s-stack>
              )}
              <div style={{ flex: 1 }}>
                <s-stack direction="inline" gap="small-200" justifyContent={showSearch ? "space-between" : 'end'}>
                  {
                    showSearch ? (
                      <div style={{ flex: 1, gap: 8, display: "flex", height: 28 }}>
                        <s-search-field
                          placeholder="Search by name, city, or address"
                          value={searchTerm}
                          onInput={(event) => {
                            const target = event.target as any;
                            setSearchTerm(target.value);
                          }}
                        />
                        <s-button
                          variant="tertiary"
                          onClick={() => {
                            setShowSearch(false)
                            hasChecked === false
                            setSearchTerm("")
                          }}
                        >
                          Cancel
                        </s-button>
                      </div>
                    ) : (
                      <s-button
                        icon="search"
                        onClick={() => {
                          setShowSearch(true)
                          hasChecked === true
                        }}
                      >

                      </s-button>
                    )
                  }
                  <s-button
                    icon="sort"
                    variant="secondary"
                    accessibilityLabel="Sort"
                    interestFor="sort-tooltip"
                    commandFor="sort-actions"
                  />
                  <s-tooltip id="sort-tooltip">
                    <s-text>Sort</s-text>
                  </s-tooltip>
                  <s-popover id="sort-actions">
                    <s-stack gap="none">
                      <s-divider />
                      <s-box padding="small">
                        <s-choice-list
                          label="Visibility"
                          name="visi"
                          values={selectedVisibility ? [selectedVisibility] : []}
                          onChange={(e) => {
                            const target = e.currentTarget.values;
                            setSelectedVisibility(target ? target[0] : "")
                          }}
                        >
                          <s-choice value="visible">Visible</s-choice>
                          <s-choice value="hidden">Hidden</s-choice>
                        </s-choice-list>
                        <s-button
                          variant="tertiary"
                          onClick={() => setSelectedVisibility("")}
                        >
                          Clear
                        </s-button>
                      </s-box>
                    </s-stack>
                  </s-popover>
                </s-stack>
              </div>
            </s-stack>
          </s-grid>
          {
            filteredStores.length !== 0 ? (
              <>
                {!hasChecked ? (
                  <s-table-header-row>
                    <s-table-header listSlot="primary">
                      <s-stack direction="inline" gap="base">
                        <s-checkbox
                          checked={allVisibleSelected}
                          onChange={selectAllVisible}
                        />
                        StoreName
                      </s-stack>
                    </s-table-header>
                    <s-table-header listSlot="labeled">Visibility</s-table-header>
                    <s-table-header listSlot="labeled">Created</s-table-header>
                    <s-table-header listSlot="labeled">Update</s-table-header>
                    <s-table-header listSlot="labeled">Actions</s-table-header>
                  </s-table-header-row>
                ) : (
                  <s-table-header-row>
                    <s-table-header listSlot="primary">
                      <s-stack direction="inline" gap="base">
                        <s-checkbox
                          checked={allVisibleSelected}
                          onChange={selectAllVisible}
                        />
                        {checkedRowCount} selected
                      </s-stack>
                    </s-table-header>
                    <s-table-header listSlot="labeled"></s-table-header>
                    <s-table-header listSlot="labeled"></s-table-header>
                    <s-table-header listSlot="labeled"></s-table-header>
                    <s-table-header listSlot="labeled"></s-table-header>
                  </s-table-header-row>
                )}
                <s-table-body>
                  {
                    currentStores.map((store, index) => (
                      <s-table-row key={store.id}>
                        <s-table-cell>
                          <s-stack direction="inline" alignItems="center" gap="base">
                            <s-checkbox
                              checked={selectedIds.has(store.id)}
                              onChange={() => toggleSelect(store.id)}
                            />
                            <s-thumbnail src={store.image || ''} size="small" />
                            <s-link href={`/app/editLocation/${store.id}`}>
                              <s-box>{store.storeName}</s-box>
                              <s-box>{store.address}, {store.city}, {store.region}{store.code ? `, ${store.code}` : ''}</s-box>
                            </s-link>
                          </s-stack>
                        </s-table-cell>
                        <s-table-cell>
                          <s-badge tone={store.visibility === "visible" ? "success" : "auto"}><s-text>{store.visibility === "visible" ? "Visible" : "Hidden"}</s-text></s-badge>
                        </s-table-cell>
                        <s-table-cell>{new Date(store.createdAt).toISOString().split("T")[0]}</s-table-cell>
                        <s-table-cell>{new Date(store.updatedAt).toISOString().split("T")[0]}</s-table-cell>
                        <s-table-cell>
                          <s-stack direction="inline" alignItems="center" gap="small">
                            <s-tooltip id="deleteId">Delete</s-tooltip>
                            <s-button
                              variant="tertiary"
                              icon="delete"
                              commandFor={`deleteId-modal-${store.id}`}
                              interestFor="deleteId"
                            >
                            </s-button>
                            <s-modal id={`deleteId-modal-${store.id}`} heading="Delete Location">
                              <s-text>
                                Are you sure you want to delete this store? This action cannot be undone.
                              </s-text>

                              <s-button
                                slot="secondary-actions"
                                variant="secondary"
                                commandFor={`deleteId-modal-${store.id}`}
                                command="--hide"
                              >
                                Cancel
                              </s-button>

                              <s-button
                                slot="primary-action"
                                variant="primary"
                                tone="critical"
                                commandFor={`deleteId-modal-${store.id}`}
                                command="--hide"
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDeleteTrash(store.id);
                                }}
                              >
                                Delete
                              </s-button>
                            </s-modal>
                            <s-link href={`/app/editLocation/${store.id}`}>
                              <s-tooltip id="editId">Edit</s-tooltip>
                              <s-button variant="tertiary" icon="edit" interestFor="editId"></s-button>
                            </s-link>
                          </s-stack>
                        </s-table-cell>
                      </s-table-row>
                    ))
                  }
                </s-table-body>
              </>
            ) : (
              <>
                <s-table-body>
                  <s-table-row>
                    <s-table-cell >
                      <s-stack alignItems="center" gap="small">
                        {/* <s-icon type="search" size="base" /> */}
                        <h2>No filters found</h2>
                        <s-text color="subdued">
                          Try changing the filters or search term
                        </s-text>
                      </s-stack>
                    </s-table-cell>
                  </s-table-row>
                </s-table-body>
              </>
            )
          }
        </s-table>
        <s-stack
          direction="inline"
          justifyContent="center"
          gap="small-400"
          background="subdued"
          paddingBlock="small-200"
        >
          <s-button
            variant="secondary"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(p => p - 1)}
            icon="caret-left"
          >

          </s-button>

          <s-button
            variant="secondary"
            disabled={currentPage === totalPages || totalPages === 0}
            onClick={() => setCurrentPage(p => p + 1)}
            icon="caret-right"
          >

          </s-button>
        </s-stack>
      </s-section>

      <s-stack alignItems="center" paddingBlock="large-200">
        <s-text>
          Learn more about <span style={{ color: 'blue' }}><s-link href="">Location section</s-link></span>
        </s-text>
      </s-stack>
    </s-page>
  );
}