export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return d * 1000;
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): string => {
  const d = getDistance(lat1, lon1, lat2, lon2) / 1000;

  if (d < 1) {
    return `${Math.round(d * 1000)} m away`;
  }
  return `${d.toFixed(1)} km away`;
};

const deg2rad = (deg: number): number => {
  return deg * (Math.PI / 180);
};

export interface AddressComponents {
  road?: string;
  house_number?: string;
  suburb?: string;
  neighbourhood?: string;
  city?: string;
  town?: string;
  village?: string;
  state?: string;
  postcode?: string;
  country?: string;
  [key: string]: string | undefined;
}

export interface GeocodeResult {
  display_name: string;
  address: AddressComponents;
  lat: string;
  lon: string;
}

export const reverseGeocode = async (lat: number, lng: number): Promise<GeocodeResult> => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
          'User-Agent': 'gridpe-clone/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Geocoding error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.error) {
      throw new Error(data.error);
    }

    return {
      display_name: data.display_name,
      address: data.address,
      lat: data.lat,
      lon: data.lon
    };
  } catch (error) {
    console.error("Reverse geocoding failed:", error);
    throw error;
  }
};

export const forwardGeocode = async (query: string, userLat?: number, userLng?: number): Promise<GeocodeResult[]> => {
    try {
        let url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=10&addressdetails=1&countrycodes=in`;

        if (userLat !== undefined && userLng !== undefined) {
            const delta = 0.5;
            const viewbox = `${userLng - delta},${userLat + delta},${userLng + delta},${userLat - delta}`;
            url += `&viewbox=${viewbox}&bounded=0`;
        }

        const response = await fetch(url, {
            headers: {
                'User-Agent': 'gridpe-clone/1.0',
            },
        });

        if (!response.ok) {
            throw new Error(`Geocoding search error: ${response.statusText}`);
        }

        let data: GeocodeResult[] = await response.json();

        if (userLat !== undefined && userLng !== undefined) {
            data = data.sort((a, b) => {
                const distA = getDistance(userLat, userLng, parseFloat(a.lat), parseFloat(a.lon));
                const distB = getDistance(userLat, userLng, parseFloat(b.lat), parseFloat(b.lon));
                return distA - distB;
            });
        }

        return data;
    } catch (error) {
        console.error("Forward geocoding failed:", error);
        return [];
    }
}