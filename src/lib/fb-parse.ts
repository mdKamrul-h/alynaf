import type { MessageSignals } from "./types";

const UK_RETAIL_DOMAINS = [
  "amazon.co.uk", "johnlewis.com", "harrods.com", "selfridges.com",
  "asos.com", "adidas.co.uk", "nike.com", "boots.com", "superdrug.com",
  "argos.co.uk", "farfetch.com", "marksandspencer.com", "tedbaker.com",
  "net-a-porter.com", "ebay.co.uk", "next.co.uk", "primark.com",
  "zara.com", "hm.com", "river-island.com", "newlook.com",
];

function isUkRetailUrl(href: string): boolean {
  try {
    const host = new URL(href).hostname.replace(/^www\./, "");
    return UK_RETAIL_DOMAINS.some((d) => host === d || host.endsWith(`.${d}`));
  } catch {
    return false;
  }
}

export function parseMessageSignals(text: string): MessageSignals {
  const urls: string[] = [];
  const phones: string[] = [];
  const addressHints: string[] = [];
  const prices: string[] = [];
  const sizes: string[] = [];

  // URLs
  for (const m of text.matchAll(/https?:\/\/[^\s<>"]+/gi)) {
    try {
      new URL(m[0]);
      urls.push(m[0]);
    } catch {
      // skip malformed
    }
  }

  // BD phone numbers (+880 or 0) followed by 1[3-9] + 8 digits
  for (const m of text.matchAll(/(\+?880|0)1[3-9]\d{8}/g)) {
    phones.push(m[0]);
  }

  // Address hints
  const addressPatterns = [
    /\bdeliver\s+to\b/i,
    /\baddress\b/i,
    /\bhouse\s*(?:no\.?|#|:)?\s*\d/i,
    /\broad\s*(?:no\.?|#|:)/i,
    /\bflat\s*(?:no\.?|#|:)?\s*\d/i,
    /\bdhaka\b/i, /\bchittagong\b/i, /\bsylhet\b/i, /\bkhulna\b/i,
    /\brajshahi\b/i, /\bcomilla\b/i, /\bnarayanganj\b/i,
    /\bgulshan\b/i, /\bdhanmondi\b/i, /\bmirpur\b/i,
    /\buttara\b/i, /\bmohammadpur\b/i, /\bbadda\b/i,
    /\bwari\b/i, /\bkhilgaon\b/i,
  ];
  for (const pat of addressPatterns) {
    const m = text.match(pat);
    if (m) addressHints.push(m[0]);
  }

  // Prices — £ or BDT/tk/taka
  for (const m of text.matchAll(/£\s?\d[\d,]*(?:\.\d{1,2})?|BDT\s?\d[\d,]+|\d[\d,]+\s?(?:tk|taka)/gi)) {
    prices.push(m[0]);
  }

  // Sizes
  for (const m of text.matchAll(/(?:size|sz)\s*[:=]?\s*([SMLX]{1,3}L?|\d{1,2}(?:\.\d)?(?:\s?(?:UK|EU|US))?)/gi)) {
    sizes.push(m[0]);
  }

  // Score: retail URL = 30pts, any URL = 20pts, phone = 15pts, address = 10pts, price = 10pts, size = 5pts
  let score = 0;
  for (const url of urls) score += isUkRetailUrl(url) ? 30 : 20;
  score += phones.length * 15;
  score += addressHints.length * 10;
  score += prices.length * 10;
  score += sizes.length * 5;
  score = Math.min(100, score);

  const isLikelyOrder = urls.length > 0 || phones.length + addressHints.length >= 2;

  return { urls, phones, addressHints, prices, sizes, isLikelyOrder, score };
}
