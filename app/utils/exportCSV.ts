// app/utils/exportCSV.ts
import { Store } from "@prisma/client";

export const exportStoresToCSV = (stores: Store[], selectedRow: boolean[]) => {
  const selectedStores = stores.filter((_, index) => selectedRow[index]);
  if (selectedStores.length === 0) return alert("No stores selected");

  const headers = [
    "No",
    "Store Name",
    "Source",
    "Map Marker",
    "Tags",
    "Visibility",
    "Address",
    "City",
    "State",
    "Code",
    "Added",
    "Updated"
  ];

  const rows = selectedStores.map((store, index) => [
    index + 1,
    store.storeName,
    store.source,
    "Map Marker", // Hoặc bỏ trống nếu không cần
    "",           // Tags nếu có
    store.visibility,
    store.address,
    store.city,
    store.state,
    store.code,
    new Date(store.createdAt).toLocaleString(),
    new Date(store.updatedAt).toLocaleString()
  ]);

  const csvContent =
    [headers, ...rows]
      .map((row) => row.map((v) => `"${v}"`).join(","))
      .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", "stores.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
