// app/routes/app.allLocations.tsx
import {
  ActionFunctionArgs,
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
import { getCoordinatesFromAddress } from "../utils/Geocoding";
import { getEffectiveLevel } from "../utils/plan.server";
import { UIStore } from "app/component/allLocation/types";
import LocationPageHeader from "app/component/allLocation/LocationPageHeader";
import LocationTableFilters from "app/component/allLocation/LocationTableFilters";
import LocationTableHeader from "app/component/allLocation/LocationTableHeader";
import LocationTableRow from "app/component/allLocation/LocationTableRow";
import BannerUpgrade from "app/component/BannerUpgrade";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await authenticate.admin(request);
  const shop = session?.shop;

  const level = await getEffectiveLevel(shop);
  const connections = level === 'plus'
    ? await prisma.shopConnection.findMany({ where: { targetShop: shop } })
    : [];

  const sourceShops = connections.map(c => c.sourceShop)

  const stores = await prisma.store.findMany({
    where: {
      OR: [
        { shop },
        { shop: { in: sourceShops } }
      ]
    },
    select: {
      id: true,
      shop: true,
      storeName: true,
      region: true,
      address: true,
      city: true,
      state: true,
      code: true,
      phone: true,
      image: true,
      url: true,
      visibility: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return {
    stores: stores.map((s: any) => ({
      ...s,
      type: s.shop === shop ? "Manual" : "Shopify B2B",
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
    level: level
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const actionType = formData.get("actionType");

  if (actionType === "import") {
    const { session } = await authenticate.admin(request);
    const shop = session?.shop;

    const level = await getEffectiveLevel(shop);
    const [locationCount] = await Promise.all([
      prisma.store.count({ where: { shop } })
    ]);
    let limit = 10;
    if (level === 'advanced') limit = 500;
    if (level === 'plus') limit = 1000000;

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

      let successCount = 0;
      const storesToCreate: any[] = [];
      const dataLines = lines.slice(1).filter(line => line.trim());

      // Parse all lines first to validate structure and data types
      const validatedRows: any[] = [];
      for (let i = 0; i < dataLines.length; i++) {
        const line = dataLines[i];
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
          return { error: `Row ${i + 1} does not have enough columns.` };
        }

        const storeName = values[0] || "";
        const address = values[1] || "";
        const city = values[2] || "";
        const code = values[3] || "";
        const country = values[4] || "";
        const phone = values[5] || "";
        const website = values[6] || "";
        const visibility = (values[7] || "hidden").toLowerCase() === "visible" ? "visible" : "hidden";

        if (!storeName.trim()) return { error: `Store Name is required at row ${i + 1}` };
        if (!address.trim()) return { error: `Address is required at row ${i + 1}` };
        if (!city.trim()) return { error: `City is required at row ${i + 1}` };
        if (!country.trim()) return { error: `Country is required at row ${i + 1}` };

        const schedule: any = {};
        try {
          schedule.monday = parseTimeSlot(values[8] || "", "Monday");
          schedule.tuesday = parseTimeSlot(values[9] || "", "Tuesday");
          schedule.wednesday = parseTimeSlot(values[10] || "", "Wednesday");
          schedule.thursday = parseTimeSlot(values[11] || "", "Thursday");
          schedule.friday = parseTimeSlot(values[12] || "", "Friday");
          schedule.saturday = parseTimeSlot(values[13] || "", "Saturday");
          schedule.sunday = parseTimeSlot(values[14] || "", "Sunday");
        } catch (timeError: any) {
          return { error: `Row ${i + 1}: ${timeError.message}` };
        }

        validatedRows.push({
          storeName, address, city, code, country, phone, website, visibility, schedule
        });
      }

      // Process geocoding in chunks to optimize speed while respecting rate limits
      const CHUNK_SIZE = 5;
      for (let i = 0; i < validatedRows.length; i += CHUNK_SIZE) {
        const chunk = validatedRows.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(async (row) => {
          const coordinates = await getCoordinatesFromAddress(
            row.address.trim(),
            row.city.trim(),
            row.country.trim(),
            row.code.trim() || undefined
          );

          const timeData = {
            mondayOpen: row.schedule.monday.open,
            mondayClose: row.schedule.monday.close,
            tuesdayOpen: row.schedule.tuesday.open,
            tuesdayClose: row.schedule.tuesday.close,
            wednesdayOpen: row.schedule.wednesday.open,
            wednesdayClose: row.schedule.wednesday.close,
            thursdayOpen: row.schedule.thursday.open,
            thursdayClose: row.schedule.thursday.close,
            fridayOpen: row.schedule.friday.open,
            fridayClose: row.schedule.friday.close,
            saturdayOpen: row.schedule.saturday.open,
            saturdayClose: row.schedule.saturday.close,
            sundayOpen: row.schedule.sunday.open,
            sundayClose: row.schedule.sunday.close,
          };

          storesToCreate.push({
            shop: shop || "",
            storeName: row.storeName.trim(),
            address: row.address.trim(),
            city: row.city.trim(),
            state: "",
            code: row.code.trim(),
            region: row.country.trim(),
            phone: row.phone.trim(),
            image: "",
            url: row.website.trim(),
            directions: "",
            visibility: row.visibility,
            lat: coordinates?.lat || null,
            lng: coordinates?.lng || null,
            time: timeData,
          });
        }));
      }

      // Bulk insert all stores
      if (storesToCreate.length > 0) {
        if (locationCount + storesToCreate.length > limit) {
          return { error: `Your current plan (${level.toUpperCase()}) only allows up to ${limit === 1000000 ? 'unlimited' : limit} locations. Importing ${storesToCreate.length} locations would exceed this limit. Please upgrade.` };
        }
        await prisma.store.createMany({
          data: storesToCreate
        });
        successCount = storesToCreate.length;
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



export default function AllLocation() {
  const { stores: storesData, level } = useLoaderData() as { stores: UIStore[], level: string };
  const [showSearch, setShowSearch] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [stores, setStores] = useState<UIStore[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const fetcher = useFetcher();
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedVisibility, setSelectedVisibility] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
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
      <LocationPageHeader windowWidth={windowWidth} level={level} />
      {level === 'basic' && (
        <BannerUpgrade currentLevel={level} requiredLevel="advanced" featureName="Import/Export CSV" />
      )}

      <s-section padding="none">
        <s-table>
          <LocationTableFilters
            hasChecked={hasChecked}
            showSearch={showSearch}
            searchTerm={searchTerm}
            selectedSources={selectedSources}
            selectedVisibility={selectedVisibility}
            selectedIds={selectedIds}
            onUpdateVisibility={updateVisibility}
            onExport={handleExport}
            onDelete={handleDelete}
            onSearchToggle={setShowSearch}
            onSearchChange={setSearchTerm}
            onSourceChange={setSelectedSources}
            onVisibilityChange={setSelectedVisibility}
            level={level}
          />
          {filteredStores.length !== 0 ? (
            <>
              <LocationTableHeader
                hasChecked={hasChecked}
                allVisibleSelected={allVisibleSelected}
                checkedRowCount={checkedRowCount}
                onSelectAll={selectAllVisible}
              />
              <s-table-body>
                {currentStores.map((store) => (
                  <LocationTableRow
                    key={store.id}
                    store={store}
                    isSelected={selectedIds.has(store.id)}
                    onToggleSelect={toggleSelect}
                    onDelete={handleDeleteTrash}
                  />
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
          Learn more about <span style={{ color: 'blue' }}><s-link href="">Locations section</s-link></span>
        </s-text>
      </s-stack>
    </s-page>
  );
}