import type { VariantGroup } from "./types";

export interface ProductPreview {
  url: string;
  title: string | null;
  image: string | null;
  description: string | null;
  price: string | null;
  currency: string | null;
  siteName: string | null;
  /** True when we only have a store logo/favicon, not the real product photo */
  imageIsGeneric: boolean;
  /** Variant groups parsed from the product page (Size, Color, etc.) */
  variants: VariantGroup[];
}

/* ── Variant extraction ─────────────────────────────────────────── */

function cleanVariantLabel(raw: string): string {
  return raw
    .replace(/_name$/i, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function cleanVariantValue(raw: string): string {
  return raw
    .replace(/^[^a-z0-9]+/i, "")   // strip leading separators
    .replace(/\|.+$/, "")          // strip trailing pipe values (Amazon)
    .replace(/\s+/g, " ")
    .trim();
}

function parseStringArray(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    if (Array.isArray(arr)) return arr.map(String).map(cleanVariantValue).filter(Boolean);
  } catch {}
  return [];
}

export function extractVariantsFromHtml(html: string): VariantGroup[] {
  const groups = new Map<string, Set<string>>();

  // 1. Amazon: "variationValues":{"size_name":["S","M","L"]}
  const amazonBlocks = html.matchAll(/"variationValues"\s*:\s*(\{[^}]{0,2000}\})/g);
  for (const block of amazonBlocks) {
    try {
      const obj = JSON.parse(block[1]) as Record<string, string[]>;
      for (const [key, values] of Object.entries(obj)) {
        if (!Array.isArray(values)) continue;
        const name = cleanVariantLabel(key);
        if (!name) continue;
        const cleaned = values.map(cleanVariantValue).filter(Boolean);
        if (cleaned.length > 0) {
          if (!groups.has(name)) groups.set(name, new Set());
          cleaned.forEach((v) => groups.get(name)!.add(v));
        }
      }
    } catch {}
  }

  // 2. Amazon native dropdowns: <select id="native_dropdown_selected_size_name">
  const dropdowns = html.matchAll(
    /<select[^>]+id="native_dropdown_selected_(\w+)"[^>]*>([\s\S]{0,3000}?)<\/select>/gi
  );
  for (const m of dropdowns) {
    const name = cleanVariantLabel(m[1]);
    const options = [...m[2].matchAll(/<option[^>]*>([^<]+)<\/option>/gi)]
      .map((o) => cleanVariantValue(o[1].trim()))
      .filter((v) => v && !/please select|select size|select colour/i.test(v));
    if (options.length > 0) {
      if (!groups.has(name)) groups.set(name, new Set());
      options.forEach((v) => groups.get(name)!.add(v));
    }
  }

  // 3. JSON-LD Product with additionalProperty (size / color)
  const scripts = html.matchAll(
    /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]{0,20000}?)<\/script>/gi
  );
  for (const script of scripts) {
    try {
      const data = JSON.parse(script[1].trim());
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        if (item["@type"] !== "Product") continue;
        // additionalProperty [{name:"Size",value:"M"},...]
        const props = item.additionalProperty ?? [];
        for (const p of props) {
          if (!p.name || !p.value) continue;
          const name = cleanVariantLabel(p.name);
          if (!groups.has(name)) groups.set(name, new Set());
          groups.get(name)!.add(cleanVariantValue(String(p.value)));
        }
        // Multiple offers each with a size/color description
        const rawOffers = Array.isArray(item.offers)
          ? item.offers
          : item.offers
            ? [item.offers]
            : [];
        for (const offer of rawOffers as Record<string, unknown>[]) {
          const itemOffered = offer.itemOffered as Record<string, string> | undefined;
          if (itemOffered?.name) {
            const v = cleanVariantValue(itemOffered.name);
            if (v) {
              if (!groups.has("Option")) groups.set("Option", new Set());
              groups.get("Option")!.add(v);
            }
          }
        }
      }
    } catch {}
  }

  // 4. Generic script patterns  — sizes / colors arrays in JS bundles
  const scriptBlocks = html.matchAll(/<script[^>]*>([\s\S]{0,80000}?)<\/script>/gi);
  for (const block of scriptBlocks) {
    const text = block[1];

    const sizePatterns: [RegExp, string][] = [
      [/"sizes"\s*:\s*(\[[^\]]{0,400}\])/g, "Size"],
      [/"available_sizes"\s*:\s*(\[[^\]]{0,400}\])/g, "Size"],
      [/"sizeOptions"\s*:\s*(\[[^\]]{0,400}\])/g, "Size"],
      [/"colour(?:s|Options)"\s*:\s*(\[[^\]]{0,400}\])/g, "Color"],
      [/"colors?(?:Options)?"\s*:\s*(\[[^\]]{0,400}\])/g, "Color"],
    ];

    for (const [pattern, groupName] of sizePatterns) {
      for (const match of text.matchAll(pattern)) {
        const vals = parseStringArray(match[1]);
        if (vals.length >= 2) {
          if (!groups.has(groupName)) groups.set(groupName, new Set());
          vals.forEach((v) => groups.get(groupName)!.add(v));
        }
      }
    }

    // ASOS / Nike style: "variants":[{"size":{"name":"XS"},"colour":{"name":"Black"}}]
    const variantMatch = text.match(/"variants"\s*:\s*(\[[\s\S]{0,8000}?\])\s*[,}]/);
    if (variantMatch) {
      try {
        const arr = JSON.parse(variantMatch[1]) as Record<string, Record<string, string>>[];
        for (const v of arr) {
          for (const [key, val] of Object.entries(v)) {
            if (typeof val !== "object" || !val?.name) continue;
            const name = cleanVariantLabel(key);
            if (!groups.has(name)) groups.set(name, new Set());
            groups.get(name)!.add(cleanVariantValue(val.name));
          }
        }
      } catch {}
    }
  }

  // Deduplicate and return, keeping max 40 options per group
  return [...groups.entries()]
    .filter(([, vals]) => vals.size >= 2 && vals.size <= 40)
    .map(([name, vals]) => ({ name, options: [...vals] }));
}

import {
  extractProductImagesFromHtml,
  isAmazonUrl,
  isGenericProductImage,
  resolveAmazonProductImage,
} from "./product-images";

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) =>
      String.fromCharCode(parseInt(hex, 16))
    )
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)));
}

function getMetaContent(html: string, property: string): string | null {
  const patterns = [
    new RegExp(
      `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
      "i"
    ),
    new RegExp(
      `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1].trim());
  }
  return null;
}

function getTitleTag(html: string): string | null {
  const match = html.match(/<title[^>]*>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : null;
}

function extractJsonLd(html: string): {
  title?: string;
  image?: string;
  price?: string;
  currency?: string;
  description?: string;
} | null {
  const scripts = html.match(
    /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  );
  if (!scripts) return null;

  for (const script of scripts) {
    const jsonMatch = script.match(/>([\s\S]*?)<\/script>/i);
    if (!jsonMatch?.[1]) continue;

    try {
      const data = JSON.parse(jsonMatch[1].trim());
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        if (item["@type"] !== "Product" && !item.offers) continue;

        const offers = item.offers ?? item.Offer;
        const offer = Array.isArray(offers) ? offers[0] : offers;
        let image: string | undefined;

        if (typeof item.image === "string") image = item.image;
        else if (Array.isArray(item.image)) image = item.image[0];
        else if (item.image?.url) image = item.image.url;

        return {
          title: item.name,
          image,
          description: item.description,
          price: offer?.price != null ? String(offer.price) : undefined,
          currency: offer?.priceCurrency ?? "GBP",
        };
      }
    } catch {
      continue;
    }
  }
  return null;
}

function extractPriceFromHtml(html: string): { price: string; currency: string } | null {
  const jsonLd = extractJsonLd(html);
  if (jsonLd?.price) {
    return { price: jsonLd.price, currency: jsonLd.currency ?? "GBP" };
  }

  const gbpMatch = html.match(/£\s*([\d,]+(?:\.\d{2})?)/);
  if (gbpMatch) {
    return { price: gbpMatch[1].replace(/,/g, ""), currency: "GBP" };
  }

  return null;
}

function resolveUrl(base: string, relative: string): string {
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

function getSiteLabel(hostname: string): string {
  const domain = hostname.replace(/^www\./, "");
  const known: Record<string, string> = {
    "amazon.co.uk": "Amazon UK",
    "ebay.co.uk": "eBay UK",
    "johnlewis.com": "John Lewis",
    "boots.com": "Boots",
    "argos.co.uk": "Argos",
    "selfridges.com": "Selfridges",
    "harrods.com": "Harrods",
    "adidas.co.uk": "Adidas",
    "farfetch.com": "Farfetch",
  };
  return known[domain] ?? domain.split(".")[0].replace(/-/g, " ");
}

function titleFromUrlPath(url: string): string | null {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/").filter(Boolean);

    const dpIndex = parts.indexOf("dp");
    if (dpIndex > 0 && parsed.hostname.includes("amazon")) {
      return parts[dpIndex - 1]
        .replace(/-/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase());
    }

    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (/^\d+$/.test(part) || part.length < 3) continue;
      if (["product", "p", "item", "dp", "gp"].includes(part)) continue;
      if (part.includes("-") || part.length > 8) {
        return part
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase());
      }
    }
  } catch {
    return null;
  }
  return null;
}

function isGenericTitle(title: string | null, hostname: string): boolean {
  if (!title) return true;
  const lower = title.toLowerCase();
  const generic = [
    "page not found",
    "amazon.co.uk",
    "amazon uk",
    "ebay",
    "404",
    "access denied",
  ];
  if (generic.some((g) => lower.includes(g))) return true;
  if (lower === getSiteLabel(hostname).toLowerCase()) return true;
  return title.length < 4;
}

async function fetchDirect(url: string): Promise<ProductPreview | null> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-GB,en;q=0.9",
    },
    signal: AbortSignal.timeout(10000),
    redirect: "follow",
  });

  if (!response.ok) return null;

  const html = await response.text();
  const parsed = new URL(url);
  const jsonLd = extractJsonLd(html);

  const title =
    getMetaContent(html, "og:title") ??
    getMetaContent(html, "twitter:title") ??
    jsonLd?.title ??
    getTitleTag(html);

  const htmlImages = extractProductImagesFromHtml(html);
  let image: string | null =
    htmlImages[0] ??
    getMetaContent(html, "og:image") ??
    getMetaContent(html, "twitter:image") ??
    jsonLd?.image ??
    null;

  if (image) image = resolveUrl(url, image);
  if (isGenericProductImage(image)) image = null;

  const description =
    getMetaContent(html, "og:description") ??
    getMetaContent(html, "twitter:description") ??
    jsonLd?.description ??
    getMetaContent(html, "description");

  const siteName =
    getMetaContent(html, "og:site_name") ?? getSiteLabel(parsed.hostname);

  const priceInfo = extractPriceFromHtml(html);
  const variants = extractVariantsFromHtml(html);

  if (!title && !image) return null;

  return {
    url,
    title,
    image,
    description,
    price: priceInfo?.price ?? null,
    currency: priceInfo?.currency ?? null,
    siteName,
    imageIsGeneric: !image,
    variants,
  };
}

async function fetchMicrolink(url: string): Promise<ProductPreview | null> {
  const response = await fetch(
    `https://api.microlink.io?url=${encodeURIComponent(url)}`,
    { signal: AbortSignal.timeout(12000) }
  );

  if (!response.ok) return null;

  const json = await response.json();
  if (json.status !== "success" || !json.data) return null;

  const data = json.data;
  const imageObj = data.image;
  let image =
    typeof imageObj === "string" ? imageObj : (imageObj?.url ?? null);

  if (isGenericProductImage(image)) image = null;

  const priceObj = data.price;
  const price =
    typeof priceObj === "number" || typeof priceObj === "string"
      ? String(priceObj)
      : priceObj?.amount != null
        ? String(priceObj.amount)
        : null;

  const title = data.title ?? null;
  if (!title && !image) return null;

  const parsed = new URL(url);

  return {
    url,
    title,
    image,
    description: data.description ?? null,
    price,
    currency: priceObj?.currency ?? data.currency ?? "GBP",
    siteName: data.publisher ?? getSiteLabel(parsed.hostname),
    imageIsGeneric: !image,
    variants: [],
  };
}

async function fetchMicrolinkScreenshot(url: string): Promise<string | null> {
  const res = await fetch(
    `https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&meta=false`,
    { signal: AbortSignal.timeout(15000) }
  );
  if (!res.ok) return null;
  const json = await res.json();
  const screenshotUrl = json?.data?.screenshot?.url;
  return typeof screenshotUrl === "string" ? screenshotUrl : null;
}

function finalizePreview(
  url: string,
  partial: Omit<ProductPreview, "imageIsGeneric" | "variants"> & {
    imageIsGeneric?: boolean;
    variants?: VariantGroup[];
  }
): ProductPreview {
  const parsed = new URL(url);
  const pathTitle = titleFromUrlPath(url);
  const usePathTitle =
    isGenericTitle(partial.title, parsed.hostname) && pathTitle;

  const title = usePathTitle
    ? pathTitle
    : (partial.title ?? pathTitle ?? `Product from ${getSiteLabel(parsed.hostname)}`);

  const image = isGenericProductImage(partial.image) ? null : partial.image;

  return {
    ...partial,
    title,
    image,
    siteName: partial.siteName ?? getSiteLabel(parsed.hostname),
    imageIsGeneric: !image,
    variants: partial.variants ?? [],
  };
}

export async function fetchProductPreview(url: string): Promise<ProductPreview> {
  const parsed = new URL(url);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Invalid URL protocol");
  }

  let preview: ProductPreview | null = null;

  try {
    const direct = await fetchDirect(url);
    if (direct) preview = finalizePreview(url, direct);
  } catch {
    preview = null;
  }

  if (!preview || preview.imageIsGeneric) {
    try {
      const micro = await fetchMicrolink(url);
      if (micro) {
        const merged = finalizePreview(url, {
          ...preview,
          ...micro,
          title: preview?.title ?? micro.title,
          image: micro.image ?? preview?.image ?? null,
          price: preview?.price ?? micro.price,
          variants: preview?.variants?.length ? preview.variants : (micro.variants ?? []),
        });
        if (!preview || (merged.image && preview.imageIsGeneric)) {
          preview = merged;
        }
      }
    } catch {
      // continue
    }
  }

  if (preview && preview.imageIsGeneric && isAmazonUrl(url)) {
    const amazonImage = await resolveAmazonProductImage(url, preview.title);
    if (amazonImage && !isGenericProductImage(amazonImage)) {
      preview = { ...preview, image: amazonImage, imageIsGeneric: false };
    }
  }

  // Last resort: Microlink screenshot of the product page
  if (preview && preview.imageIsGeneric) {
    try {
      const screenshotUrl = await fetchMicrolinkScreenshot(url);
      if (screenshotUrl) {
        preview = { ...preview, image: screenshotUrl, imageIsGeneric: false };
      }
    } catch {
      // continue
    }
  }

  if (preview) return preview;

  const pathTitle = titleFromUrlPath(url);
  const siteName = getSiteLabel(parsed.hostname);

  return {
    url,
    title: pathTitle ?? `Product from ${siteName}`,
    image: null,
    description: null,
    price: null,
    currency: null,
    siteName,
    imageIsGeneric: true,
    variants: [],
  };
}
