// app/utils/geocode.server.ts

import prisma from "app/db.server";

// In-memory cache
const memoryCache = new Map<string, { lat: number; lng: number }>();

/**
 * Normalize địa chỉ để làm cache key
 */
function normalizeAddress(address: string): string {
  return address.toLowerCase().trim();
}

/**
 * Gọi Nominatim API
 */
async function callNominatimAPI(address: string) {
  const encodedAddress = encodeURIComponent(address);
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "MyApp/1.0 (lehoang10112002@gmail.com)",
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

    return null;
  } catch (error) {
    // console.error("Nominatim API error:", error);
    return null;
  }
}

/**
 * Main function với cache check
 */
export async function getLatLngFromAddress(address: string) {
  const normalizedAddress = normalizeAddress(address);

  // 1. Check memory cache
  if (memoryCache.has(normalizedAddress)) {
    // console.log("✅ Cache HIT (memory):", normalizedAddress);
    return memoryCache.get(normalizedAddress)!;
  }

  // 2. Check DB cache
  try {
    const cached = await prisma.geocodeCache.findUnique({
      where: { address: normalizedAddress },
    });

    if (cached) {
      // console.log("✅ Cache HIT (database):", normalizedAddress);
      
      // Update hitCount
      await prisma.geocodeCache.update({
        where: { id: cached.id },
        data: { hitCount: { increment: 1 } },
      });

      const location = { lat: cached.lat, lng: cached.lng };
      
      // Add to memory cache
      memoryCache.set(normalizedAddress, location);
      
      return location;
    }
  } catch (error) {
    console.error("Error reading cache:", error);
  }

  // 3. Cache miss → Call API
  // console.log("❌ Cache MISS, calling API:", normalizedAddress);
  const location = await callNominatimAPI(address);

  // 4. Save to cache if success
  if (location) {
    try {
      // Save to memory
      memoryCache.set(normalizedAddress, location);
      
      // Save to DB
      await prisma.geocodeCache.upsert({
        where: { address: normalizedAddress },
        update: { lat: location.lat, lng: location.lng, updatedAt: new Date() },
        create: { address: normalizedAddress, lat: location.lat, lng: location.lng },
      });
      
      // console.log("💾 Saved to cache:", normalizedAddress);
    } catch (error) {
      // console.error("Failed to save cache:", error);
    }
  }

  return location;
}