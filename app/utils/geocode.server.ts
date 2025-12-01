export async function getLatLngFromAddress(address: string) {
  const encodedAddress = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`;

  console.log("🔍 Fetching geocode for:", address);
  console.log("🌐 URL:", url);

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "MyApp/1.0 (lehoang10112002@gmail.com)", // Nominatim yêu cầu header này
      },
    });

    const data = await res.json();

    if (data && data.length > 0) {
      const location = data[0];
      return {
        lat: parseFloat(location.lat),
        lng: parseFloat(location.lon),
      };
    }

    console.error("❌ Geocoding failed: No results found");
    return null;
  } catch (error) {
    console.error("❌ Geocoding request failed:", error);
    return null;
  }
}
