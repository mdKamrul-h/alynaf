import type { ProductPreview } from "@/lib/product-preview";
import { getStoreForUrl, storeLogoUrl } from "@/lib/constants";

interface ProductPreviewCardProps {
  preview: ProductPreview | null;
  loading?: boolean;
  error?: string | null;
  url?: string;
  manualImageUrl?: string;
  onManualImageChange?: (url: string) => void;
}

function formatPrice(price: string, currency: string | null) {
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  const symbol = currency === "GBP" ? "£" : currency === "USD" ? "$" : "";
  return `${symbol}${num.toLocaleString("en-GB", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}${symbol ? "" : ` ${currency ?? ""}`}`;
}

function StoreLogo({ url, siteName }: { url: string; siteName?: string | null }) {
  const store = getStoreForUrl(url);
  const logoSrc = store
    ? storeLogoUrl(store.domain)
    : siteName
      ? storeLogoUrl(siteName.toLowerCase().replace(/\s+/g, "") + ".com")
      : null;

  return (
    <div
      className="flex h-24 w-24 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white p-2"
      title={store?.name ?? siteName ?? "Store"}
    >
      {logoSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logoSrc}
          alt={store?.name ?? siteName ?? "Store"}
          className="h-full w-full object-contain"
          onError={(e) => {
            e.currentTarget.replaceWith(
              Object.assign(document.createElement("span"), {
                className: "text-2xl",
                textContent: "🛍️",
              })
            );
          }}
        />
      ) : (
        <span className="text-3xl">🛍️</span>
      )}
    </div>
  );
}

export default function ProductPreviewCard({
  preview,
  loading,
  error,
  url,
  manualImageUrl,
  onManualImageChange,
}: ProductPreviewCardProps) {
  if (loading) {
    return (
      <div className="flex gap-4 rounded-xl border border-[#4a7c9b]/30 bg-[#4a7c9b]/5 p-4 animate-pulse">
        <div className="h-24 w-24 shrink-0 rounded-xl bg-white/10" />
        <div className="flex-1 space-y-2.5 py-1">
          <div className="h-3 w-1/4 rounded bg-white/10" />
          <div className="h-4 w-3/4 rounded bg-white/10" />
          <div className="h-3 w-1/3 rounded bg-white/10" />
          <div className="h-3 w-1/2 rounded bg-white/10" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-200/90">
          Could not load preview — {error}. You can still submit; we&apos;ll verify the link manually.
        </div>
        {onManualImageChange && (
          <ManualImageInput value={manualImageUrl ?? ""} onChange={onManualImageChange} />
        )}
      </div>
    );
  }

  if (!preview) return null;

  const resolvedUrl = url ?? preview.url;
  const displayImage = manualImageUrl || (preview.imageIsGeneric ? null : preview.image);
  const showManualInput = onManualImageChange && !manualImageUrl && (!displayImage || preview.imageIsGeneric);

  return (
    <div className="space-y-3">
      <div className="flex gap-4 rounded-xl border border-[#4a7c9b]/30 bg-[#4a7c9b]/5 p-4">
        {/* Image or store logo fallback */}
        {displayImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={displayImage}
            alt={preview.title ?? "Product"}
            className="h-24 w-24 shrink-0 rounded-xl border border-white/10 bg-white object-contain p-1"
            onError={(e) => { e.currentTarget.style.display = "none"; }}
          />
        ) : (
          <StoreLogo url={resolvedUrl} siteName={preview.siteName} />
        )}

        {/* Details */}
        <div className="min-w-0 flex-1">
          {preview.siteName && (
            <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-[#8bb8d4]">
              {preview.siteName}
            </p>
          )}
          {preview.title && (
            <p className="line-clamp-2 text-sm font-medium leading-snug text-white">
              {preview.title}
            </p>
          )}
          {preview.price && (
            <p className="mt-1 text-base font-bold text-emerald-400">
              {formatPrice(preview.price, preview.currency)}
            </p>
          )}
          {preview.description && !preview.price && (
            <p className="mt-1 line-clamp-2 text-xs text-slate-400">
              {preview.description}
            </p>
          )}
          <a
            href={resolvedUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-xs text-[#4a7c9b] hover:underline"
          >
            View on site
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>
        </div>
      </div>

      {showManualInput && (
        <ManualImageInput
          value={manualImageUrl ?? ""}
          onChange={onManualImageChange}
          showHint
        />
      )}
    </div>
  );
}

function ManualImageInput({
  value,
  onChange,
  showHint = false,
}: {
  value: string;
  onChange: (url: string) => void;
  showHint?: boolean;
}) {
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
      {showHint && (
        <>
          <p className="mb-2 text-sm font-medium text-amber-100/90">
            Showing store logo — product photo not available automatically
          </p>
          <ol className="mb-3 list-inside list-decimal space-y-1 text-xs text-slate-400">
            <li>Open the product page and right-click the main product image</li>
            <li>Click <strong className="text-slate-300">&quot;Copy image address&quot;</strong></li>
            <li>Paste the URL below</li>
          </ol>
        </>
      )}
      <label className="mb-1.5 block text-xs font-medium text-slate-300">
        Product image URL (optional)
      </label>
      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value.trim())}
        placeholder="https://m.media-amazon.com/images/I/..."
        className="w-full rounded-lg border border-white/10 bg-black/40 px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:border-[#4a7c9b] focus:outline-none focus:ring-1 focus:ring-[#4a7c9b]"
      />
    </div>
  );
}
