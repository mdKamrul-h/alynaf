import type { OrderItem } from "@/lib/types";
import { getStoreForUrl, storeLogoUrl } from "@/lib/constants";

function formatItemPrice(price: string, currency?: string) {
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : "";
  return `${symbol}${num.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function OrderItemCard({ item }: { item: OrderItem }) {
  const store = getStoreForUrl(item.productUrl);
  const logoSrc = store
    ? storeLogoUrl(store.domain)
    : item.siteName
      ? storeLogoUrl(item.siteName.toLowerCase().replace(/\s+/g, "") + ".com")
      : null;

  const displayImage = item.imageUrl && !item.imageUrl.includes("google.com/s2/favicons")
    ? item.imageUrl
    : null;

  return (
    <div className="flex gap-3 rounded-xl border border-white/5 bg-black/20 p-3 text-sm">
      {displayImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={displayImage}
          alt={item.productName || "Product"}
          className="h-16 w-16 shrink-0 rounded-lg border border-white/10 bg-white object-contain p-0.5"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      ) : logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc}
          alt={store?.name ?? item.siteName ?? "Store"}
          className="h-16 w-16 shrink-0 rounded-lg border border-white/10 bg-white object-contain p-2"
          onError={(e) => { e.currentTarget.style.display = "none"; }}
        />
      ) : (
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-2xl">
          🛍️
        </div>
      )}

      <div className="min-w-0 flex-1">
        {(store?.name ?? item.siteName) && (
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#8bb8d4]">
            {store?.name ?? item.siteName}
          </p>
        )}
        <p className="font-medium text-white">
          {item.productName || "Product"} <span className="text-slate-500">× {item.quantity}</span>
        </p>
        {item.price && (
          <p className="text-sm font-semibold text-emerald-400">
            {formatItemPrice(item.price, item.currency)}
          </p>
        )}
        {item.variantNotes && (
          <p className="text-xs text-slate-400">{item.variantNotes}</p>
        )}
        <a
          href={item.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs text-[#4a7c9b] hover:underline"
        >
          View product
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
        </a>
      </div>
    </div>
  );
}
