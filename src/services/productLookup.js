/**
 * Product Lookup Service
 * Calls the backend /api/lookup/:barcode which proxies Open Food Facts.
 * This avoids CORS issues — browser → backend → Open Food Facts.
 * Free, no API key required.
 */

import api from "./api";

// ─── Category mapper (kept identical to original) ─────────────────────────────
const mapCategory = (categories = "") => {
  const lower = categories.toLowerCase();

  if (
    lower.includes("beverage") ||
    lower.includes("drink") ||
    lower.includes("juice") ||
    lower.includes("water") ||
    lower.includes("milk") ||
    lower.includes("food") ||
    lower.includes("snack") ||
    lower.includes("cereal") ||
    lower.includes("dairy") ||
    lower.includes("meat") ||
    lower.includes("bread") ||
    lower.includes("sauce")
  ) return "Food & Beverages";

  if (
    lower.includes("medicine") ||
    lower.includes("pharma") ||
    lower.includes("drug") ||
    lower.includes("supplement") ||
    lower.includes("vitamin") ||
    lower.includes("tablet") ||
    lower.includes("capsule")
  ) return "Pharmaceuticals";

  if (
    lower.includes("cosmetic") ||
    lower.includes("beauty") ||
    lower.includes("shampoo") ||
    lower.includes("cream") ||
    lower.includes("lotion") ||
    lower.includes("soap") ||
    lower.includes("perfume") ||
    lower.includes("makeup")
  ) return "Cosmetics & Personal Care";

  if (
    lower.includes("clean") ||
    lower.includes("detergent") ||
    lower.includes("disinfect") ||
    lower.includes("bleach") ||
    lower.includes("wash")
  ) return "Cleaning Products";

  if (
    lower.includes("electronic") ||
    lower.includes("battery") ||
    lower.includes("cable") ||
    lower.includes("device")
  ) return "Electronics";

  return "Other";
};

// ─── Main lookup function ──────────────────────────────────────────────────────
/**
 * Lookup product by barcode via backend proxy.
 * Returns the same shape as the original so no other files need changing.
 * @param {string} barcode
 * @returns {{ found, productName, category, notes, imageUrl, rawData }}
 */
export const lookupBarcode = async (barcode) => {
  // Strip non-digit characters (some scanners append extra text like "(EAN-13)")
  const clean = String(barcode).replace(/\D/g, "");

  if (!clean || clean.length < 4) return { found: false };

  try {
    const { data } = await api.get(`/lookup/${clean}`);

    // Backend returns 404 with { found: false } when product not in OFF
    if (!data.found) return { found: false };

    const brand      = data.brand      || "";
    const quantity   = data.quantity   || "";
    const categories = data.raw?.categories || "";
    const imageUrl   = data.imageUrl   || "";

    // Re-run the richer local category mapper using the raw categories string
    const category = mapCategory(categories) !== "Other"
      ? mapCategory(categories)
      : data.category || "Other";

    // Build notes string (same format as original)
    const notesParts = [];
    if (brand)    notesParts.push(`Brand: ${brand}`);
    if (quantity) notesParts.push(`Pack size: ${quantity}`);

    // Reconstruct productName with brand prefix logic (same as original)
    const rawName = data.name || "";
    const productName = rawName
      ? (brand && !rawName.toLowerCase().includes(brand.toLowerCase()))
        ? `${brand} ${rawName}`
        : rawName
      : "";

    return {
      found: true,
      productName,
      category,
      notes: notesParts.join(" | "),
      imageUrl,
      rawData: { brand, quantity, categories },
    };

  } catch (err) {
    if (err.response?.status === 404) return { found: false };
    console.error("[productLookup] Error:", err.message);
    return { found: false };
  }
};