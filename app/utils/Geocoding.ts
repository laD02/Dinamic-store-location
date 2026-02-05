// app/utils/Geocoding.ts
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAP_KEY;

interface GeocodeResult {
    lat: number;
    lng: number;
}

export async function getCoordinatesFromAddress(
    address: string,
    city: string,
    region: string,
    code?: string
): Promise<GeocodeResult | null> {
    if (!GOOGLE_MAPS_API_KEY) {
        console.error("❌ GOOGLE_MAP_KEY is not set in environment variables");
        return null;
    }

    try {
        const fullAddress = [address, city, region, code]
            .filter(Boolean)
            .join(", ");

        const encodedAddress = encodeURIComponent(fullAddress);
        const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${GOOGLE_MAPS_API_KEY}`;

        const response = await fetch(url);
        const data = await response.json();
        console.log("data", data);

        // Better error logging
        if (data.status !== "OK") {
            console.error(`❌ Geocoding failed for "${fullAddress}":`, {
                status: data.status,
                error_message: data.error_message || "No error message",
            });
            return null;
        }

        if (data.results && data.results.length > 0) {
            const location = data.results[0].geometry.location;
            return {
                lat: location.lat,
                lng: location.lng,
            };
        }

        return null;

    } catch (error) {
        console.error("❌ Geocoding exception:", error);
        return null;
    }
}