// app/utils/exportCSV.ts
import { Store } from "@prisma/client";

interface StoreTime {
  mondayOpen?: string;
  mondayClose?: string;
  tuesdayOpen?: string;
  tuesdayClose?: string;
  wednesdayOpen?: string;
  wednesdayClose?: string;
  thursdayOpen?: string;
  thursdayClose?: string;
  fridayOpen?: string;
  fridayClose?: string;
  saturdayOpen?: string;
  saturdayClose?: string;
  sundayOpen?: string;
  sundayClose?: string;
}

export const exportStoresToCSV = (stores: Store[], selectedIds: string[]) => {
  const selectedStores = stores.filter(store => selectedIds.includes(store.id));

  if (selectedStores.length === 0) {
    alert("No stores selected");
    return;
  }

  const headers = [
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
    "Sunday",
  ];

  const formatHours = (open?: string, close?: string) => {
    return (open === "close" && close === "close") ? "Close" : `${open} - ${close}`;
  };

  const rows = selectedStores.map((store, index) => {
    const time = store.time as StoreTime | null;

    return [
      store.storeName,
      store.address,
      store.city,
      store.code,
      store.region || "",
      store.phone || "",
      store.url || "",
      store.visibility,
      formatHours(time?.mondayOpen, time?.mondayClose),
      formatHours(time?.tuesdayOpen, time?.tuesdayClose),
      formatHours(time?.wednesdayOpen, time?.wednesdayClose),
      formatHours(time?.thursdayOpen, time?.thursdayClose),
      formatHours(time?.fridayOpen, time?.fridayClose),
      formatHours(time?.saturdayOpen, time?.saturdayClose),
      formatHours(time?.sundayOpen, time?.sundayClose),
    ];
  });

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