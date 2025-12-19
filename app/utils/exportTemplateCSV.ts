// app/utils/downloadTemplate.ts
export const downloadCSVTemplate = () => {
  const headers = [
    "LocationName",
    "Address1",
    "Address2",
    "City",
    "State",
    "Zipcode",
    "PhoneNumber",
    "Website",
    "Sunday_Hours",
    "Monday_Hours",
    "Tuesday_Hours",
    "Wednesday_Hours",
    "Thursday_Hours",
    "Friday_Hours",
    "Saturday_Hours"
  ];

  // Thêm 1 row mẫu để user biết format
  const exampleRow = [
    "Example Store",
    "123 Main St",
    "Suite 100",
    "New York",
    "NY",
    "10001",
    "555-1234",
    "https://example.com",
    "9:00-17:00",
    "9:00-17:00",
    "9:00-17:00",
    "9:00-17:00",
    "9:00-17:00",
    "9:00-17:00",
    "10:00-16:00"
  ];

  const csvContent = [headers, exampleRow]
    .map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "storelocationstemplate.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url); // Cleanup
};