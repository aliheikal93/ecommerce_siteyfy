import fs from "node:fs";

const data = JSON.parse(fs.readFileSync(new URL("./saudi-locations-data/locations.json", import.meta.url), "utf8"));
const regions = data.regions;
const citiesByRegion = new Map();
const districtsByCity = new Map();
for (const row of data.cities) {
  if (!citiesByRegion.has(row.region_id)) citiesByRegion.set(row.region_id, []);
  citiesByRegion.get(row.region_id).push(row);
}
for (const row of data.districts) {
  if (!districtsByCity.has(row.city_id)) districtsByCity.set(row.city_id, []);
  districtsByCity.get(row.city_id).push(row);
}

export function normalizeSaudiLocation(value) {
  return String(value || "").trim().toLowerCase().normalize("NFKD")
    .replace(/[\u0300-\u036f\u064b-\u065f\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").replace(/ة/g, "ه")
    .replace(/^(?:منطقه|المنطقه|حي)\s+/, "")
    .replace(/\s+(?:region|province|dist\.?)$/i, "")
    .replace(/\s+/g, " ");
}

const regionAliases = {
  1: ["Ar Riyadh"], 2: ["Mecca", "Makkah Al Mukarramah", "Makkan"],
  3: ["Medina", "Al Madinah", "Al Madinah Al Munawwarah"],
  4: ["Al Qassim"], 5: ["Ash Sharqiyah", "Eastern"],
  8: ["Ha'il"], 10: ["Jizan"], 12: ["Al Bahah", "Al Baha"], 13: ["Al Jawf"]
};
function findLocation(rows, value, idKey, aliases = {}) {
  const text = normalizeSaudiLocation(value);
  if (!text) return null;
  return rows.find(row => String(row[idKey]) === text ||
    [row.name_ar, row.name_en, ...(aliases[row[idKey]] || [])].some(name => normalizeSaudiLocation(name) === text)) || null;
}
function options(rows, idKey) {
  return rows.map(row => ({ id: row[idKey], name_ar: row.name_ar, name_en: row.name_en }))
    .sort((a, b) => a.name_ar.localeCompare(b.name_ar, "ar"));
}

// Read-only reference suggestions. Free-text checkout values are not constrained to this snapshot.
export function saudiLocationOptions({ kind = "regions", region = "", city = "" } = {}) {
  if (kind === "regions") return { items: options(regions, "region_id"), parent: null };
  if (!["cities", "districts"].includes(kind)) {
    const error = new Error("INVALID_ADDRESS_LOOKUP_KIND"); error.status = 400; throw error;
  }
  const selectedRegion = findLocation(regions, region, "region_id", regionAliases);
  if (!selectedRegion) return { items: [], parent: null, required_parent: "province" };
  const cities = citiesByRegion.get(selectedRegion.region_id) || [];
  if (kind === "cities") return { items: options(cities, "city_id"), parent: { region: selectedRegion.name_ar } };
  const selectedCity = findLocation(cities, city, "city_id");
  if (!selectedCity) return { items: [], parent: { region: selectedRegion.name_ar }, required_parent: "city" };
  return { items: options(districtsByCity.get(selectedCity.city_id) || [], "district_id"),
    parent: { region: selectedRegion.name_ar, city: selectedCity.name_ar } };
}
