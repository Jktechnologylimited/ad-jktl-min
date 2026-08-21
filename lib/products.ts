// Central place for desk-product display metadata. Any product not listed
// here still renders correctly via the fallback (derived label + rotating
// color) -- adding a new desk product to the business never requires a
// code change here or anywhere that imports this.
export interface ProductMeta { label: string; color: string; }

export const PRODUCT_META: Record<string, ProductMeta> = {
  schooldesk:       { label: "SchoolDesk",       color: "#10B981" },
  faithdesk:        { label: "FaithDesk",        color: "#8B5CF6" },
  detaildesk:       { label: "DetailDesk",       color: "#F59E0B" },
  insurancedesk:    { label: "InsuranceDesk",    color: "#2563EB" },
  constructiondesk: { label: "ConstructionDesk", color: "#EA580C" },
  gasstationdesk:   { label: "GasStationDesk",   color: "#DC2626" },
  businessdesk:     { label: "BusinessDesk",     color: "#7C3AED" },
};

const FALLBACK_COLORS = ["#60A5FA", "#34D399", "#F472B6", "#FBBF24", "#22D3EE", "#A78BFA"];

// Deterministic fallback for any product key not in PRODUCT_META, so an 8th
// (or 20th) desk product added later still renders sensibly with zero code
// changes here.
export function productMeta(productKey: string): ProductMeta {
  if (PRODUCT_META[productKey]) return PRODUCT_META[productKey];
  const label = productKey
    .replace(/desk$/i, "Desk")
    .replace(/^./, c => c.toUpperCase());
  let hash = 0;
  for (let i = 0; i < productKey.length; i++) hash = (hash * 31 + productKey.charCodeAt(i)) % FALLBACK_COLORS.length;
  return { label, color: FALLBACK_COLORS[hash] };
}
