type PlaceCoordinates = {
  lat: number;
  lon: number;
};

type GeocodedPlace = PlaceCoordinates & {
  label: string;
};

export type TripEstimate = {
  origin: string;
  destination: string;
  distanceKm: number;
  durationMinutes: number;
  fare: number;
  serviceFee: number;
  price: number;
  coordinates: [number, number][];
};

const SERVICE_FEE = 1;
const DEMO_PRICE_PER_KM = 2;

const NATAL_CENTER: PlaceCoordinates = { lat: -5.78, lon: -35.20 };
const NATAL_BOUNDS = { west: -35.32, south: -5.95, east: -35.12, north: -5.66 };

function normalizePlaceName(value = "") {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLocaleLowerCase("pt-BR");
}

async function geocodePlace(query: string, bias?: PlaceCoordinates): Promise<GeocodedPlace> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", query.trim());
  url.searchParams.set("limit", "5");
  url.searchParams.set("lang", "default");
  url.searchParams.set("countrycode", "br");
  url.searchParams.set("bbox", NATAL_BOUNDS.west + "," + NATAL_BOUNDS.south + "," + NATAL_BOUNDS.east + "," + NATAL_BOUNDS.north);
  url.searchParams.set("lat", String(bias?.lat ?? NATAL_CENTER.lat));
  url.searchParams.set("lon", String(bias?.lon ?? NATAL_CENTER.lon));
  url.searchParams.set("location_bias_scale", "0.1");

  const response = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error("Não foi possível localizar esse endereço.");

  const data = (await response.json()) as {
    features?: Array<{
      geometry?: { coordinates?: [number, number] };
      properties?: {
        name?: string;
        district?: string;
        city?: string;
        county?: string;
        state?: string;
        country?: string;
        countrycode?: string;
      };
    }>;
  };
  const feature = data.features?.find((result) => {
    const properties = result.properties ?? {};
    const coordinates = result.geometry?.coordinates;
    const locality = properties.city ?? properties.county;
    const inNatalBounds = Boolean(
      coordinates &&
      coordinates[0] >= NATAL_BOUNDS.west &&
      coordinates[0] <= NATAL_BOUNDS.east &&
      coordinates[1] >= NATAL_BOUNDS.south &&
      coordinates[1] <= NATAL_BOUNDS.north,
    );

    return (
      properties.countrycode?.toUpperCase() === "BR" &&
      normalizePlaceName(locality) === "natal" &&
      normalizePlaceName(properties.state) === "rio grande do norte" &&
      inNatalBounds
    );
  });
  const coordinates = feature?.geometry?.coordinates;
  if (!feature || !coordinates || coordinates.length < 2) {
    throw new Error("A simulação atende somente endereços de Natal, RN. Informe um local e seu bairro.");
  }

  const properties = feature.properties ?? {};
  const label = [...new Set([properties.name, properties.district, properties.city ?? properties.county, properties.state].filter(Boolean))]
    .join(", ") || query;

  return { label, lon: coordinates[0], lat: coordinates[1] };
}
export async function estimateTrip(origin: string, destination: string): Promise<TripEstimate> {
  const originPlace = await geocodePlace(origin);
  const destinationPlace = await geocodePlace(destination, originPlace);
  const routeUrl = new URL(
    "https://router.project-osrm.org/route/v1/driving/" +
      originPlace.lon + "," + originPlace.lat + ";" + destinationPlace.lon + "," + destinationPlace.lat,
  );
  routeUrl.searchParams.set("overview", "simplified");
  routeUrl.searchParams.set("geometries", "geojson");

  const response = await fetch(routeUrl, { signal: AbortSignal.timeout(20000) });
  if (!response.ok) throw new Error("Não foi possível calcular essa rota agora.");

  const data = (await response.json()) as {
    code?: string;
    routes?: Array<{ distance: number; duration: number; geometry?: { coordinates?: [number, number][] } }>;
  };
  const route = data.routes?.[0];
  if (data.code !== "Ok" || !route) {
    throw new Error("Não encontramos uma rota de carro entre esses locais.");
  }

  const distanceKm = route.distance / 1000;
  const fare = Math.round(distanceKm * DEMO_PRICE_PER_KM * 100) / 100;
  const price = Math.round((fare + SERVICE_FEE) * 100) / 100;

  return {
    origin: originPlace.label,
    destination: destinationPlace.label,
    distanceKm,
    durationMinutes: Math.max(1, Math.ceil(route.duration / 60)),
    fare,
    serviceFee: SERVICE_FEE,
    price,
    coordinates: route.geometry?.coordinates ?? [],
  };
}

// A small in-memory cache avoids repeating requests when demo panels reopen.
const routeCache = new Map<string, Promise<TripEstimate>>();
export function getMapRoute(origin: string, destination: string) {
  const key = JSON.stringify([origin, destination]);
  let pending = routeCache.get(key);
  if (!pending) {
    pending = estimateTrip(origin, destination).catch(error => { routeCache.delete(key); throw error; });
    if (routeCache.size >= 20) routeCache.delete(routeCache.keys().next().value!);
    routeCache.set(key, pending);
  }
  return pending;
}
