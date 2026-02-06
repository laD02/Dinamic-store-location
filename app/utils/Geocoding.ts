// app/utils/Geocoding.ts

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
    try {
        const fullAddress = [address, city, region, code]
            .filter(Boolean)
            .join(", ");

        // Sử dụng Places API (New) - Text Search
        const url = `https://places.googleapis.com/v1/places:searchText`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': process.env.GOOGLE_MAP_KEY || '',
                'X-Goog-FieldMask': 'places.location,places.displayName'
            },
            body: JSON.stringify({
                textQuery: fullAddress
            })
        });

        if (!response.ok) {
            console.error(`❌ API request failed:`, response.status, response.statusText);
            return null;
        }

        const data = await response.json();

        // Places API (New) trả về places array
        if (data.places && data.places.length > 0) {
            const location = data.places[0].location;
            return {
                lat: location.latitude,
                lng: location.longitude,
            };
        }

        console.warn(`⚠️ No results found for "${fullAddress}"`);
        return null;

    } catch (error) {
        console.error("❌ Geocoding exception:", error);
        return null;
    }
}