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
  const connections = await prisma.shopConnection.findMany({
    where: {
      targetShop: shop
    }
  })

  const sourceShops = connections.map(c => c.sourceShop)

  const stores = await prisma.store.findMany({
    where: {
      OR: [
        { shop },
        { shop: { in: sourceShops } }
      ]
    }
  })

  return stores.map((s: any) => ({
    ...s,
    type: s.shop === shop ? "Manual" : "Shopify B2B",
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

    if (!file) return { error: "No files uploaded." };
    if (!(file instanceof File)) return { error: "Invalid file format" };

    // Kiểm tra extension file
    const fileName = file.name.toLowerCase();
    if (!fileName.endsWith('.csv')) {
      return { error: "Only .csv files are accepted. Please upload the correct file format.." };
    }

    try {
      let text: string;
      if (typeof file.text === 'function') {
        text = await file.text();
      } else {
        const buffer = await file.arrayBuffer();
        text = new TextDecoder('utf-8').decode(buffer);
      }

      const cleanText = text.replace(/^\uFEFF/, '');
      const lines = cleanText.split(/\r?\n/).filter(line => line.trim());

      if (lines.length < 2) {
        return { error: "The CSV file is empty or invalid. Please ensure it contains a header row and at least one line of data." };
      }

      // Parse header line để kiểm tra cấu trúc
      const headerLine = lines[0];
      const headerValues: string[] = [];
      let current = '';
      let inQuotes = false;

      for (let j = 0; j < headerLine.length; j++) {
        const char = headerLine[j];
        const nextChar = headerLine[j + 1];
        if (char === '"') {
          if (inQuotes && nextChar === '"') { current += '"'; j++; }
          else { inQuotes = !inQuotes; }
        } else if (char === ',' && !inQuotes) {
          headerValues.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      headerValues.push(current.trim());

      // Danh sách các cột bắt buộc theo đúng thứ tự
      const requiredHeaders = [
        "Store Name",
        "Address",
        "City",
        "Zip Code",
        "Country",
        "Phone",
        "Website",
        "Visibility",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
      ];

      // Kiểm tra số lượng cột
      if (headerValues.length < requiredHeaders.length) {
        return {
          error: `The file is not in the correct format. Please download the template and use the correct format.`
        };
      }

      // Kiểm tra từng cột theo thứ tự
      for (let i = 0; i < requiredHeaders.length; i++) {
        const expected = requiredHeaders[i];
        const actual = headerValues[i];

        if (actual !== expected) {
          return {
            error: `The file is not in the correct format. Please download the template and use the correct format.`
          };
        }
      }

      const dataLines = lines.slice(1);
      let successCount = 0;

      const isValidTimeFormat = (time: string): boolean => {
        const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
        return timeRegex.test(time);
      };

      const isTimeBefore = (time1: string, time2: string): boolean => {
        const [hours1, minutes1] = time1.split(':').map(Number);
        const [hours2, minutes2] = time2.split(':').map(Number);
        if (hours1 < hours2) return true;
        if (hours1 > hours2) return false;
        return minutes1 < minutes2;
      };

      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
        if (!line.trim()) continue;

        // Parse CSV line
        const values: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let j = 0; j < line.length; j++) {
          const char = line[j];
          const nextChar = line[j + 1];
          if (char === '"') {
            if (inQuotes && nextChar === '"') { current += '"'; j++; }
            else { inQuotes = !inQuotes; }
          } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        values.push(current.trim());

        if (values.length < requiredHeaders.length) {
          return {
            error: `The file is not in the correct format. Please download the template and use the correct format.`
          };
        }

        const storeName = values[0] || "";
        const address = values[1] || "";
        const city = values[2] || "";
        const code = values[3] || "";
        const country = values[4] || "";
        const phone = values[5] || "";
        const website = values[6] || "";
        const visibility = values[7] || "hidden";

        // BƯỚC 1: Check từng required field, gặp lỗi đầu tiên là dừng luôn
        if (!storeName.trim()) return { error: `Store Name is required` };
        if (!address.trim()) return { error: `Address is required` };
        if (!city.trim()) return { error: `City is required` };
        if (!country.trim()) return { error: `Country is required` };
        if (!phone.trim()) return { error: `Phone is required` };

        const parseTimeSlot = (timeStr: string, dayName: string) => {
          if (!timeStr || timeStr.trim().toLowerCase() === 'close') {
            return { open: "close", close: "close" };
          }
          const parts = timeStr.split('-').map(t => t.trim());
          if (parts.length !== 2) {
            throw new Error(`${dayName} must be in the format "HH:MM - HH:MM" or "Close"`);
          }
          const [open, close] = parts;
          if (!isValidTimeFormat(open)) {
            throw new Error(`${dayName} opening hours "${open}" are invalid. Must be in HH:MM format (e.g., 09:00)`);
          }
          if (!isValidTimeFormat(close)) {
            throw new Error(`${dayName} closing hours "${close}" are invalid. Must be in HH:MM format (e.g., 17:00)`);
          }
          if (!isTimeBefore(open, close)) {
            throw new Error(`${dayName} opening hours "${open}" must be before closing hours "${close}"`);
          }
          return { open, close };
        };

        // BƯỚC 2: Check từng ngày, gặp lỗi đầu tiên là dừng luôn
        let monday, tuesday, wednesday, thursday, friday, saturday, sunday;
        try {
          monday = parseTimeSlot(values[8] || "", "Monday");
          tuesday = parseTimeSlot(values[9] || "", "Tuesday");
          wednesday = parseTimeSlot(values[10] || "", "Wednesday");
          thursday = parseTimeSlot(values[11] || "", "Thursday");
          friday = parseTimeSlot(values[12] || "", "Friday");
          saturday = parseTimeSlot(values[13] || "", "Saturday");
          sunday = parseTimeSlot(values[14] || "", "Sunday");
        } catch (timeError: any) {
          return { error: `${timeError.message}` };
        }

        // BƯỚC 3: Geocode & tạo store
        const coordinates = await getCoordinatesFromAddress(
          address.trim(),
          city.trim(),
          country.trim(),
          code.trim() || undefined
        );

        if (!coordinates) {
          console.warn(`Could not geocode address for ${storeName}`);
        }

        const timeData = {
          mondayOpen: monday.open,
          mondayClose: monday.close,
          tuesdayOpen: tuesday.open,
          tuesdayClose: tuesday.close,
          wednesdayOpen: wednesday.open,
          wednesdayClose: wednesday.close,
          thursdayOpen: thursday.open,
          thursdayClose: thursday.close,
          fridayOpen: friday.open,
          fridayClose: friday.close,
          saturdayOpen: saturday.open,
          saturdayClose: saturday.close,
          sundayOpen: sunday.open,
          sundayClose: sunday.close,
        };

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
            visibility: visibility.toLowerCase() === "visible" ? "visible" : "hidden",
            lat: coordinates?.lat || null,
            lng: coordinates?.lng || null,
            time: timeData,
          }
        });

        successCount++;

        if (i < dataLines.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (successCount === 0) {
        return { error: 'No valid data found in the CSV file.' };
      }

      return {
        success: true,
        count: successCount,
        message: `Successfully imported ${successCount} location${successCount > 1 ? 's' : ''}!`
      };

    } catch (error: any) {
      console.error("Import error:", error);
      return { error: `Error processing CSV file: ${error.message}` };
    }
  }

  if (actionType === "deleteId") {
    const id = formData.get("id") as string;
    const store = await prisma.store.findUnique({ where: { id }, select: { image: true } });
    if (store?.image) await deleteImageFromCloudinary(store.image);
    await prisma.store.delete({ where: { id } });
    return { success: true };
  }

  if (actionType === "delete") {
    const ids = formData.getAll("ids") as string[];
    const stores = await prisma.store.findMany({ where: { id: { in: ids } }, select: { id: true, image: true } });
    const deletePromises = stores.filter(store => store.image).map(store => deleteImageFromCloudinary(store.image!));
    await Promise.all(deletePromises);
    await prisma.store.deleteMany({ where: { id: { in: ids } } });
    return { success: true };
  }

  if (actionType === "updateVisibility") {
    const visibility = formData.get("visibility") as string;
    const selectedIds = JSON.parse(formData.get("selectedIds") as string);
    if (!["visible", "hidden"].includes(visibility)) return { error: "Invalid visibility value" };
    if (selectedIds.length > 0) {
      await prisma.store.updateMany({ where: { id: { in: selectedIds } }, data: { visibility } });
    }
    return { oks: true };
  }

  return { error: "Unknown action" };
}

type UIStore = Omit<Store, "createdAt" | "updatedAt"> & {
  type: string;
  createdAt: string;
  updatedAt: string;
};

export default function AllLocation() {
  const storesData = useLoaderData<UIStore[]>();
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stores, setStores] = useState<UIStore[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fetcher = useFetcher();
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedVisibility, setSelectedVisibility] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const shopify = useAppBridge();
  const [windowWidth, setWindowWidth] = useState(0);

  useEffect(() => {
    setWindowWidth(window.innerWidth);
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const message = params.get('message');
    if (message === 'deleted') {
      shopify.toast.show('Store deleted successfully!');
      window.history.replaceState({}, '', '/app');
    }
  }, []);

  useEffect(() => {
    if (fetcher.data?.success) shopify.toast.show('Stores deleted successfully!');
  }, [fetcher.data]);

  useEffect(() => {
    if (fetcher.data?.oks) shopify.toast.show('Stores updated visibility successfully!');
  }, [fetcher.data]);

  useEffect(() => { setStores(storesData); }, [storesData]);

  useEffect(() => {
    setSelectedIds(prev => {
      const newSet = new Set<string>();
      stores.forEach(s => { if (prev.has(s.id)) newSet.add(s.id); });
      return newSet;
    });
  }, [stores]);

  const filteredStores = useMemo(() => {
    return stores.filter(store => {
      const matchesSearch =
        store.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.address.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSource = selectedSources.length === 0 || selectedSources.includes(store.type);
      const matchesVisibility = !selectedVisibility || store.visibility.toLowerCase() === selectedVisibility.toLowerCase();
      return matchesSearch && matchesSource && matchesVisibility;
    });
  }, [stores, searchTerm, selectedSources, selectedVisibility]);

  const totalPages = Math.ceil(filteredStores.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentStores = filteredStores.slice(startIndex, startIndex + itemsPerPage);

  useEffect(() => { setCurrentPage(1); }, [searchTerm, selectedSources, selectedVisibility]);

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
      filteredStores.forEach(s => { allSelected ? next.delete(s.id) : next.add(s.id); });
      return next;
    });
  };

  useEffect(() => {
    if (currentPage > 1 && currentStores.length === 0) setCurrentPage(prev => prev - 1);
  }, [filteredStores, currentPage, currentStores.length]);

  const allVisibleSelected = filteredStores.length > 0 && filteredStores.every(s => selectedIds.has(s.id));
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
    setStores(prev => prev.map(s => (ids.includes(s.id) ? { ...s, visibility } : s)));
    fetcher.submit({ actionType: "updateVisibility", visibility, selectedIds: JSON.stringify(ids) }, { method: "post" });
  };

  const handleExport = () => {
    const selectedStoreList = stores.filter(s => selectedIds.has(s.id));
    const success = exportStoresToCSV(selectedStoreList as unknown as Store[], Array.from(selectedIds));
    if (success) shopify.toast.show('Stores exported successfully!');
  };

  return (
    <s-page heading="Store Locator">
      <s-stack direction="inline" justifyContent="space-between" alignItems="center">
        <h2>All Locations</h2>
        {windowWidth > 768 ? (
          <s-stack direction="inline" gap="base">
            <Import />
            <Link to="/app/addLocation">
              <s-button variant="primary" icon="plus-circle">Add Location</s-button>
            </Link>
          </s-stack>
        ) : (
          <s-stack direction="inline" justifyContent="end" gap="base">
            <Import />
            <Link to="/app/addLocation">
              <s-button variant="primary" icon="plus-circle"></s-button>
            </Link>
          </s-stack>
        )}
      </s-stack>

      <s-section padding="none">
        <s-table>
          <s-grid slot="filters" gap="small-200">
            <s-stack direction="inline" gap="small-200" justifyContent={hasChecked ? "space-between" : undefined}>
              {hasChecked && !showSearch && (
                <s-stack direction="inline" gap="base" justifyContent="space-between" alignItems="center">
                  <s-stack direction="inline" gap="small-200" justifyContent="start">
                    <s-button onClick={() => updateVisibility("visible")}>Set As Visible</s-button>
                    <s-button onClick={() => updateVisibility("hidden")}>Set As Hidden</s-button>
                    <s-button commandFor="customer-menu" icon="menu-horizontal"></s-button>
                    <s-popover id="customer-menu">
                      <s-stack direction="block">
                        <s-button variant="tertiary" onClick={handleExport}>Export CSV</s-button>
                        <s-button variant="tertiary" commandFor="deleteTrash-modal" tone="critical">Delete all stores</s-button>
                      </s-stack>
                    </s-popover>
                    <s-modal id="deleteTrash-modal" heading="Delete Location">
                      <s-text>Are you sure you want to delete {selectedIds.size} stores? This action cannot be undone.</s-text>
                      <s-button slot="secondary-actions" variant="secondary" commandFor="deleteTrash-modal" command="--hide">Cancel</s-button>
                      <s-button slot="primary-action" variant="primary" tone="critical" commandFor="deleteTrash-modal" command="--hide" onClick={() => handleDelete()}>Delete</s-button>
                    </s-modal>
                  </s-stack>
                </s-stack>
              )}
              <div style={{ flex: 1 }}>
                <s-stack direction="inline" gap="small-200" justifyContent={showSearch ? "space-between" : 'end'}>
                  {showSearch ? (
                    <div style={{ flex: 1, gap: 8, display: "flex", height: 28 }}>
                      <s-search-field
                        placeholder="Search by name, city, or address"
                        value={searchTerm}
                        onInput={(event) => { const target = event.target as any; setSearchTerm(target.value); }}
                      />
                      <s-button variant="tertiary" onClick={() => { setShowSearch(false); setSearchTerm(""); }}>Cancel</s-button>
                    </div>
                  ) : (
                    <s-button icon="search" onClick={() => setShowSearch(true)}></s-button>
                  )}
                  <s-button icon="sort" variant="secondary" accessibilityLabel="Sort" interestFor="sort-tooltip" commandFor="sort-actions" />
                  <s-tooltip id="sort-tooltip"><s-text>Sort</s-text></s-tooltip>
                  <s-popover id="sort-actions">
                    <s-stack gap="none">
                      <s-box padding="small">
                        Source
                        <s-checkbox
                          label="Manual"
                          checked={selectedSources.includes("Manual")}
                          onChange={(e: any) => {
                            const checked = e.currentTarget.checked;
                            setSelectedSources(prev =>
                              checked ? [...prev, "Manual"] : prev.filter(s => s !== "Manual")
                            );
                          }}
                        />
                        <s-checkbox
                          label="Shopify B2B"
                          checked={selectedSources.includes("Shopify B2B")}
                          onChange={(e: any) => {
                            const checked = e.currentTarget.checked;
                            setSelectedSources(prev =>
                              checked ? [...prev, "Shopify B2B"] : prev.filter(s => s !== "Shopify B2B")
                            );
                          }}
                        />
                      </s-box>
                      <s-divider />
                      <s-box padding="small">
                        <s-choice-list
                          label="Visibility"
                          name="visi"
                          values={selectedVisibility ? [selectedVisibility] : []}
                          onChange={(e) => { const target = e.currentTarget.values; setSelectedVisibility(target ? target[0] : ""); }}
                        >
                          <s-choice value="visible">Visible</s-choice>
                          <s-choice value="hidden">Hidden</s-choice>
                        </s-choice-list>
                        <s-button variant="tertiary" onClick={() => setSelectedVisibility("")}>Clear</s-button>
                      </s-box>
                    </s-stack>
                  </s-popover>
                </s-stack>
              </div>
            </s-stack>
          </s-grid>
          {filteredStores.length !== 0 ? (
            <>
              {!hasChecked ? (
                <s-table-header-row>
                  <s-table-header listSlot="primary">
                    <s-stack direction="inline" gap="base">
                      <s-checkbox checked={allVisibleSelected} onChange={selectAllVisible} />
                      StoreName
                    </s-stack>
                  </s-table-header>
                  <s-table-header listSlot="labeled">Source</s-table-header>
                  <s-table-header listSlot="labeled">Visibility</s-table-header>
                  <s-table-header listSlot="labeled">Created</s-table-header>
                  <s-table-header listSlot="labeled">Update</s-table-header>
                  <s-table-header listSlot="labeled">Actions</s-table-header>
                </s-table-header-row>
              ) : (
                <s-table-header-row>
                  <s-table-header listSlot="primary">
                    <s-stack direction="inline" gap="base">
                      <s-checkbox checked={allVisibleSelected} onChange={selectAllVisible} />
                      {checkedRowCount} selected
                    </s-stack>
                  </s-table-header>
                  <s-table-header listSlot="labeled"></s-table-header>
                  <s-table-header listSlot="labeled"></s-table-header>
                  <s-table-header listSlot="labeled"></s-table-header>
                  <s-table-header listSlot="labeled"></s-table-header>
                  <s-table-header listSlot="labeled"></s-table-header>
                </s-table-header-row>
              )}
              <s-table-body>
                {currentStores.map((store) => (
                  <s-table-row key={store.id}>
                    <s-table-cell>
                      <s-stack direction="inline" alignItems="center" gap="base">
                        <s-checkbox checked={selectedIds.has(store.id)} onChange={() => toggleSelect(store.id)} />
                        <s-thumbnail src={store.image || ''} size="small" />
                        <s-link href={`/app/editLocation/${store.id}`}>
                          <s-box>{store.storeName}</s-box>
                          <s-box>{store.address}, {store.city}, {store.region}{store.code ? `, ${store.code}` : ''}</s-box>
                        </s-link>
                      </s-stack>
                    </s-table-cell>
                    <s-table-cell>
                      <s-badge tone={store.type === "Manual" ? "info" : "caution"}>{store.type}</s-badge>
                    </s-table-cell>
                    <s-table-cell>
                      <s-badge tone={store.visibility === "visible" ? "success" : "auto"}>
                        <s-text>{store.visibility === "visible" ? "Visible" : "Hidden"}</s-text>
                      </s-badge>
                    </s-table-cell>
                    <s-table-cell>{new Date(store.createdAt).toISOString().split("T")[0]}</s-table-cell>
                    <s-table-cell>{new Date(store.updatedAt).toISOString().split("T")[0]}</s-table-cell>
                    <s-table-cell>
                      <s-stack direction="inline" alignItems="center" gap="small">
                        <s-tooltip id="deleteId">Delete</s-tooltip>
                        <s-button variant="tertiary" icon="delete" commandFor={`deleteId-modal-${store.id}`} interestFor="deleteId"></s-button>
                        <s-modal id={`deleteId-modal-${store.id}`} heading="Delete Location">
                          <s-text>Are you sure you want to delete this store? This action cannot be undone.</s-text>
                          <s-button slot="secondary-actions" variant="secondary" commandFor={`deleteId-modal-${store.id}`} command="--hide">Cancel</s-button>
                          <s-button slot="primary-action" variant="primary" tone="critical" commandFor={`deleteId-modal-${store.id}`} command="--hide" onClick={e => { e.stopPropagation(); handleDeleteTrash(store.id); }}>Delete</s-button>
                        </s-modal>
                        <s-link href={`/app/editLocation/${store.id}`}>
                          <s-tooltip id="editId">Edit</s-tooltip>
                          <s-button variant="tertiary" icon="edit" interestFor="editId"></s-button>
                        </s-link>
                      </s-stack>
                    </s-table-cell>
                  </s-table-row>
                ))}
              </s-table-body>
            </>
          ) : (
            <s-table-body>
              <s-table-row>
                <s-table-cell>
                  <s-stack alignItems="center" gap="small">
                    <h2>No filters found</h2>
                    <s-text color="subdued">Try changing the filters or search term</s-text>
                  </s-stack>
                </s-table-cell>
              </s-table-row>
            </s-table-body>
          )}
        </s-table>
        <s-stack direction="inline" justifyContent="center" gap="small-400" background="subdued" paddingBlock="small-200">
          <s-button variant="secondary" disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} icon="caret-left"></s-button>
          <s-button variant="secondary" disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => p + 1)} icon="caret-right"></s-button>
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