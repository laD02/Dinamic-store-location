// app/utils/exportCSV.ts
import { Store } from "@prisma/client";

export const exportStoresToCSV = (stores: Store[], selectedIds: string[]) => {
  const selectedStores = stores.filter(store => selectedIds.includes(store.id));

  if (selectedStores.length === 0) {
    alert("No stores selected");
    return;
  }

  const headers = [
    "No",
    "Store Name",
    "Address",
    "City",
    "Zip Code",
    "Country",
    "Phone",
    "Website",
    "Added",
    "Updated"
  ];

  const rows = selectedStores.map((store, index) => [
    index + 1,
    store.storeName,
    store.address,
    store.city,
    store.code,
    store.region,
    store.phone,
    store.url,
    new Date(store.createdAt).toLocaleString(),
    new Date(store.updatedAt).toLocaleString()
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `stores_export_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return true;
};