export function extractAmazonAsin(url: string): string | null {
  const patterns = [
    /\/dp\/([A-Z0-9]{10})/i,
    /\/gp\/product\/([A-Z0-9]{10})/i,
    /\/gp\/aw\/d\/([A-Z0-9]{10})/i,
    /\/exec\/obidos\/ASIN\/([A-Z0-9]{10})/i,
    /[?&]asin=([A-Z0-9]{10})/i,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1].toUpperCase();
  }
  return null;
}

export function isAmazonUrl(url: string): boolean {
  try {
    return new URL(url).hostname.includes("amazon.");
  } catch {
    return false;
  }
}

export function isGenericProductImage(imageUrl: string | null): boolean {
  if (!imageUrl) return true;

  const lower = imageUrl.toLowerCase();

  const genericPatterns = [
    "google.com/s2/favicons",
    "/favicon",
    "shoppingportal/logo",
    "/logo.",
    "/logos/",
    "sprite",
    "spacer",
    "transparent",
    "1x1",
    "pixel.",
    "placeholder",
    "no-image",
    "noimage",
    "default-product",
  ];

  if (genericPatterns.some((p) => lower.includes(p))) return true;

  // Amazon brand logo (not product photo)
  if (
    lower.includes("amazon") &&
    (lower.includes("/g/") || lower.includes("logo") || lower.includes("_ttd_"))
  ) {
    return true;
  }

  // Real Amazon product images live under /images/I/ or /images/P/
  if (lower.includes("media-amazon.com") || lower.includes("ssl-images-amazon.com")) {
    if (lower.includes("/images/i/") || lower.includes("/images/p/")) {
      return false;
    }
    return true;
  }

  return false;
}

export function extractProductImagesFromHtml(html: string): string[] {
  const found = new Set<string>();

  const patterns = [
    /"hiRes"\s*:\s*"(https:\\\/\\\/[^"]+)"/g,
    /"large"\s*:\s*"(https:\\\/\\\/[^"]+)"/g,
    /"landingImage"\s*:\s*"(https:\\\/\\\/[^"]+)"/g,
    /data-a-dynamic-image="(\{[^"]+\})"/g,
    /"(https:\\\/\\\/m\.media-amazon\.com\\\/images\\\/I\\\/[^"]+)"/g,
    /"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/g,
    /"(https:\/\/images-[a-z-]+\.ssl-images-amazon\.com\/images\/I\/[^"]+)"/g,
    /property="og:image"\s+content="([^"]+)"/gi,
    /content="([^"]+)"\s+property="og:image"/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      let raw = match[1];

      if (raw.startsWith("{")) {
        try {
          const decoded = raw.replace(/&quot;/g, '"').replace(/\\"/g, '"');
          const urls = decoded.match(/https:\\\/\\\/[^"\\]+/g) ?? [];
          for (const u of urls) {
            found.add(u.replace(/\\\//g, "/"));
          }
        } catch {
          continue;
        }
      } else {
        found.add(raw.replace(/\\u002F/g, "/").replace(/\\\//g, "/"));
      }
    }
  }

  return [...found].filter((url) => !isGenericProductImage(url));
}

export async function fetchAmazonPageHtml(asin: string): Promise<string | null> {
  const urls = [
    `https://www.amazon.co.uk/dp/${asin}`,
    `https://m.amazon.co.uk/dp/${asin}`,
  ];

  const userAgents = [
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  ];

  for (const pageUrl of urls) {
    for (const ua of userAgents) {
      try {
        const res = await fetch(pageUrl, {
          headers: {
            "User-Agent": ua,
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-GB,en;q=0.9",
          },
          signal: AbortSignal.timeout(10000),
          redirect: "follow",
        });
        if (res.ok) {
          const html = await res.text();
          if (html.length > 5000) return html;
        }
      } catch {
        continue;
      }
    }
  }
  return null;
}

export async function fetchBookCoverFromGoogleBooks(
  title: string
): Promise<string | null> {
  const cleaned = title
    .replace(/\b(ebook|kindle|paperback|hardcover|book|author|bestselling|women|men)\b/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  const queries = new Set<string>();
  if (cleaned.length >= 4) queries.add(cleaned);

  const stopWords = new Set([
    "women", "men", "bestselling", "author", "ebook", "kindle",
    "paperback", "hardcover", "book", "the", "and", "for", "from",
  ]);
  const tokens = title
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stopWords.has(w));
  if (tokens.length >= 2) {
    queries.add(tokens.join(" "));
    queries.add(tokens.slice(-2).join(" "));
  }

  for (const query of queries) {
    if (query.length < 4) continue;
    const cover = await searchGoogleBooks(query);
    if (cover) return cover;
  }

  return null;
}

async function searchGoogleBooks(query: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=1`,
      { signal: AbortSignal.timeout(8000) }
    );
    if (!res.ok) return null;

    const data = await res.json();
    const imageLinks = data.items?.[0]?.volumeInfo?.imageLinks;
    if (!imageLinks) return null;

    const cover =
      imageLinks.extraLarge ??
      imageLinks.large ??
      imageLinks.medium ??
      imageLinks.thumbnail ??
      imageLinks.smallThumbnail;

    if (!cover) return null;

    return cover.replace("http://", "https://").replace("&zoom=1", "&zoom=2");
  } catch {
    return null;
  }
}

export async function resolveAmazonProductImage(
  url: string,
  title: string | null
): Promise<string | null> {
  const asin = extractAmazonAsin(url);
  if (!asin) return null;

  const html = await fetchAmazonPageHtml(asin);
  if (html) {
    const images = extractProductImagesFromHtml(html);
    if (images.length > 0) return images[0];
  }

  const isBook =
    /ebook|kindle|book|paperback|hardcover|audible/i.test(url) ||
    /ebook|kindle|book|author/i.test(title ?? "");

  if (isBook && title) {
    const cover = await fetchBookCoverFromGoogleBooks(title);
    if (cover) return cover;
  }

  return null;
}
