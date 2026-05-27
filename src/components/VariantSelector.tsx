"use client";

import type { VariantGroup } from "@/lib/types";

/* ── Smart fallback suggestions by product category ─────────────── */
const CLOTHING_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "3XL"];
const SHOE_SIZES_UK = [
  "UK 3", "UK 4", "UK 5", "UK 6", "UK 7",
  "UK 8", "UK 9", "UK 10", "UK 11", "UK 12",
];
const KIDS_SIZES = ["2-3Y", "3-4Y", "4-5Y", "5-6Y", "7-8Y", "9-10Y", "11-12Y"];
const COMMON_COLORS = [
  "Black", "White", "Navy", "Grey", "Red",
  "Blue", "Green", "Pink", "Brown", "Beige", "Yellow", "Purple",
];

type ProductHint = "clothing" | "shoes" | "kids" | "general";

function detectHint(title: string, url: string): ProductHint {
  const text = `${title} ${url}`.toLowerCase();
  if (/trainer|sneaker|shoe|boot|heel|sandal|loafer|slipper/.test(text)) return "shoes";
  if (/kids|child|baby|toddler|infant|boys?|girls?/.test(text)) return "kids";
  if (/dress|shirt|trousers|jeans|jacket|coat|top|legging|hoodie|sweater|suit/.test(text)) return "clothing";
  return "general";
}

function fallbackGroups(title: string, url: string): VariantGroup[] {
  const hint = detectHint(title, url);
  if (hint === "shoes") {
    return [
      { name: "Size", options: SHOE_SIZES_UK },
      { name: "Color", options: COMMON_COLORS },
    ];
  }
  if (hint === "kids") {
    return [
      { name: "Age / Size", options: KIDS_SIZES },
      { name: "Color", options: COMMON_COLORS },
    ];
  }
  if (hint === "clothing") {
    return [
      { name: "Size", options: CLOTHING_SIZES },
      { name: "Color", options: COMMON_COLORS },
    ];
  }
  // General — just color
  return [{ name: "Color / Style", options: COMMON_COLORS }];
}

interface VariantSelectorProps {
  groups: VariantGroup[];
  productTitle: string;
  productUrl: string;
  selected: Record<string, string>;
  onChange: (updated: Record<string, string>) => void;
}

export default function VariantSelector({
  groups,
  productTitle,
  productUrl,
  selected,
  onChange,
}: VariantSelectorProps) {
  const activeGroups = groups.length > 0
    ? groups
    : fallbackGroups(productTitle, productUrl);

  const isFallback = groups.length === 0;

  function pick(groupName: string, value: string) {
    onChange({
      ...selected,
      [groupName]: selected[groupName] === value ? "" : value,
    });
  }

  function type(groupName: string, value: string) {
    onChange({ ...selected, [groupName]: value });
  }

  return (
    <div className="space-y-4">
      {isFallback && (
        <p className="text-xs text-slate-500">
          Variant options could not be fetched automatically — select or type below.
        </p>
      )}

      {activeGroups.map((group) => {
        const currentValue = selected[group.name] ?? "";
        const showManyAsDropdown = group.options.length > 10;

        return (
          <div key={group.name}>
            <label className="mb-2 flex items-center gap-2 text-sm text-slate-300">
              {group.name}
              {currentValue && (
                <span className="rounded-full bg-[#4a7c9b]/20 px-2 py-0.5 text-xs font-medium text-[#8bb8d4]">
                  {currentValue}
                </span>
              )}
            </label>

            {showManyAsDropdown ? (
              <select
                value={currentValue}
                onChange={(e) => type(group.name, e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-4 py-2.5 text-sm text-white focus:border-[#4a7c9b] focus:outline-none focus:ring-1 focus:ring-[#4a7c9b]"
              >
                <option value="">Select {group.name}</option>
                {group.options.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : (
              <div className="flex flex-wrap gap-2">
                {group.options.map((opt) => {
                  const isSelected = currentValue === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => pick(group.name, opt)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-all ${
                        isSelected
                          ? "border-[#4a7c9b] bg-[#4a7c9b] text-white shadow-md shadow-[#4a7c9b]/30"
                          : "border-white/10 bg-white/[0.03] text-slate-300 hover:border-[#4a7c9b]/40 hover:bg-white/[0.06] hover:text-white"
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Always allow manual override */}
            {!showManyAsDropdown && (
              <input
                type="text"
                value={currentValue}
                onChange={(e) => type(group.name, e.target.value)}
                placeholder={`Type custom ${group.name.toLowerCase()}...`}
                className="mt-2 w-full rounded-lg border border-white/5 bg-black/20 px-3 py-1.5 text-xs text-slate-400 placeholder:text-slate-600 focus:border-[#4a7c9b]/50 focus:outline-none focus:text-white"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

/** Serialize selected variants into a human-readable string for storage */
export function serializeVariants(selected: Record<string, string>): string {
  return Object.entries(selected)
    .filter(([, v]) => v.trim())
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}
