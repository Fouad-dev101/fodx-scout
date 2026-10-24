import { env } from "../../config/env.js";
import { logger } from "../../logging/logger.js";
import type { DiscoveryCategory, DiscoverySearchInput, DiscoveredBusinessPreview } from "@fodx/shared";

const CATEGORY_TAGS: Record<DiscoveryCategory, string[]> = {
  restaurant: ['amenity=restaurant', 'amenity=fast_food'],
  cafe: ['amenity=cafe'],
  hotel: ['tourism=hotel'],
  riad: ['tourism=guest_house'],
  gym: ['leisure=fitness_centre'],
  fitness_center: ['leisure=fitness_centre', 'amenity=gym'],
  hair_salon: ['shop=hairdresser', 'shop=beauty'],
  barbershop: ['shop=hairdresser'],
  dentist: ['amenity=dentist', 'healthcare=dentist'],
  medical_clinic: ['amenity=clinic', 'amenity=doctors', 'healthcare=clinic'],
  retail: ['shop=convenience', 'shop=clothes', 'shop=supermarket'],
  car_rental: ['amenity=car_rental'],
  real_estate: ['office=estate_agent'],
  travel_agency: ['shop=travel_agency', 'office=travel_agent'],
  training_center: ['amenity=training', 'office=educational_institution'],
};

export interface OsmResult {
  sourceId: string;
  name: string;
  category: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  lat: number | null;
  lon: number | null;
  phone: string | null;
  email: string | null;
  websiteUrl: string | null;
  sourceUrl: string | null;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

interface OverpassResponse { elements: OverpassElement[] }

const geocodeCache = new Map<string, { lat: number; lon: number }>();

async function geocodeCity(city: string, country: string): Promise<{ lat: number; lon: number } | null> {
  const key = `${city.toLowerCase()},${country.toLowerCase()}`;
  const cached = geocodeCache.get(key);
  if (cached) return cached;

  // Hardcoded fallback for Al Hoceima to guarantee fast dev testing
  if (city.toLowerCase() === "al hoceima") {
    return { lat: 35.2516, lon: -3.9372 };
  }

  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", `${city}, ${country}`);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "FODX-Scout/0.1 (local dev)" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return null;
    const arr = (await res.json()) as Array<{ lat: string; lon: string }>;
    const first = arr[0];
    if (!first) return null;
    const pos = { lat: parseFloat(first.lat), lon: parseFloat(first.lon) };
    geocodeCache.set(key, pos);
    return pos;
  } catch (err) {
    logger.warn("geocode.failed", { city, error: String(err) });
    return null;
  }
}

function buildQuery(input: DiscoverySearchInput, center: { lat: number; lon: number }): string {
  const filters: string[] = [];
  
  // Convert radius (meters) to a bounding box
  const latDelta = input.radiusMeters / 111320;
  const lonDelta = input.radiusMeters / (111320 * Math.cos(center.lat * Math.PI / 180));
  
  // south, west, north, east
  const bbox = `${center.lat - latDelta},${center.lon - lonDelta},${center.lat + latDelta},${center.lon + lonDelta}`;

  for (const cat of input.categories) {
    for (const tag of CATEGORY_TAGS[cat] ?? []) {
      const [k, v] = tag.split("=");
      filters.push(`node["${k}"="${v}"](${bbox});`);
      filters.push(`way["${k}"="${v}"](${bbox});`);
    }
  }
  
  // 'out center' is incredibly fast
  return `[out:json][timeout:25];(${filters.join("")});out center ${input.maxResults};`;
}

function normalizeCategory(tags: Record<string, string>, requested: DiscoveryCategory[]): string {
  const checks: Record<string, DiscoveryCategory[]> = {
    "amenity=restaurant": ["restaurant"], "amenity=fast_food": ["restaurant"],
    "amenity=cafe": ["cafe"], "tourism=hotel": ["hotel"], "tourism=guest_house": ["riad"],
    "leisure=fitness_centre": ["gym", "fitness_center"], "amenity=gym": ["gym", "fitness_center"],
    "shop=hairdresser": ["hair_salon", "barbershop"], "shop=beauty": ["hair_salon"],
    "amenity=dentist": ["dentist"], "healthcare=dentist": ["dentist"],
    "amenity=clinic": ["medical_clinic"], "amenity=doctors": ["medical_clinic"],
    "healthcare=clinic": ["medical_clinic"],
    "shop=convenience": ["retail"], "shop=clothes": ["retail"], "shop=supermarket": ["retail"],
    "amenity=car_rental": ["car_rental"],
    "office=estate_agent": ["real_estate"],
    "shop=travel_agency": ["travel_agency"], "office=travel_agent": ["travel_agency"],
    "amenity=training": ["training_center"], "office=educational_institution": ["training_center"],
  };
  for (const [tagString, cats] of Object.entries(checks)) {
    const [k, v] = tagString.split("=");
    if (tags[k as string] === v) {
      const match = cats.find((c) => requested.includes(c));
      if (match) return match;
    }
  }
  return requested[0] ?? "other";
}

export async function discoverFromOsm(input: DiscoverySearchInput): Promise<{
  results: DiscoveredBusinessPreview[];
  warnings: string[];
}> {
  const warnings: string[] = [];
  const center = await geocodeCity(input.city, input.country);
  
  if (!center) {
    throw new Error(`Could not geocode "${input.city}, ${input.country}" via Nominatim.`);
  }

  const query = buildQuery(input, center);
  
  const res = await fetch(env.OVERPASS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": "FODX-Scout/0.1 (local dev)",
    },
    body: new URLSearchParams({ data: query }).toString(),
    signal: AbortSignal.timeout(60000), // Give it a generous 60 seconds
  });

  if (!res.ok) throw new Error(`Overpass returned ${res.status}`);
  const data = (await res.json()) as OverpassResponse;

  const results: DiscoveredBusinessPreview[] = [];
  const seen = new Set<string>();
  for (const el of data.elements ?? []) {
    const tags = el.tags ?? {};
    const name = tags.name ?? tags["name:fr"] ?? tags["name:ar"];
    if (!name) continue;
    const lat = el.lat ?? el.center?.lat ?? null;
    const lon = el.lon ?? el.center?.lon ?? null;
    const sourceId = `${el.type}/${el.id}`;
    if (seen.has(sourceId)) continue;
    seen.add(sourceId);
    const address = [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" ") || null;
    results.push({
      sourceId,
      name,
      category: normalizeCategory(tags, input.categories),
      address,
      city: tags["addr:city"] ?? input.city,
      country: tags["addr:country"] ?? input.country,
      lat, lon,
      phone: tags.phone ?? tags["contact:phone"] ?? null,
      email: tags.email ?? tags["contact:email"] ?? null,
      websiteUrl: tags.website ?? tags["contact:website"] ?? null,
      source: "osm",
      sourceUrl: `https://www.openstreetmap.org/${el.type}/${el.id}`,
    });
  }
  if (results.length === 0) {
    warnings.push("No matching businesses found in OpenStreetMap for these criteria.");
  }
  return { results: results.slice(0, input.maxResults), warnings };
}