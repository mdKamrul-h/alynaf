export const SITE = {
  name: "AlyNaf",
  tagline: "Attaining the Unthought",
  headline: "UK Brands at Your Doorstep in BD",
  description:
    "Pre-order through AlyNaf from almost any UK website — Amazon, eBay, Adidas, Argos, Harrods, Selfridges, Boots, Superdrug, Gucci, LV, Farfetch, John Lewis, and more. We shop, ship, and deliver to Bangladesh.",
  established: 2019,
  email: "alynaf2019@gmail.com",
  phone: "01991-198339",
  whatsapp: "+8801991198339",
  whatsappDisplay: "+880 1991-198339",
  facebook: "https://www.facebook.com/alynafukbd",
  messenger: "https://m.me/alynafukbd",
  fbHandle: "alynafukbd",
  fbFollowers: 65,
  fbPosts: 751,
} as const;

export interface StoreInfo {
  name: string;
  domain: string;
  /** Local SVG file in /public/logos/ (without extension) */
  logoFile: string;
  /** Override domain used for Clearbit logo lookup (fallback only) */
  logoDomain?: string;
  category: string;
  description: string;
  color: string;
  featured: boolean;
}

export const STORES: StoreInfo[] = [
  {
    name: "Amazon UK",
    domain: "amazon.co.uk",
    logoFile: "amazon",
    logoDomain: "amazon.com",
    category: "Everything",
    description: "Electronics, books, fashion, home & more",
    color: "#FF9900",
    featured: true,
  },
  {
    name: "John Lewis",
    domain: "johnlewis.com",
    logoFile: "johnlewis",
    category: "Department Store",
    description: "Premium homeware, fashion & electronics",
    color: "#007B5E",
    featured: true,
  },
  {
    name: "Harrods",
    domain: "harrods.com",
    logoFile: "harrods",
    category: "Luxury",
    description: "World-famous luxury department store",
    color: "#8B6914",
    featured: true,
  },
  {
    name: "Selfridges",
    domain: "selfridges.com",
    logoFile: "selfridges",
    category: "Luxury",
    description: "Iconic luxury fashion & lifestyle",
    color: "#F5D400",
    featured: true,
  },
  {
    name: "ASOS",
    domain: "asos.com",
    logoFile: "asos",
    category: "Fashion",
    description: "Trending fashion for all styles",
    color: "#2D2D2D",
    featured: true,
  },
  {
    name: "Adidas",
    domain: "adidas.co.uk",
    logoFile: "adidas",
    logoDomain: "adidas.com",
    category: "Sports & Fashion",
    description: "Trainers, sportswear & accessories",
    color: "#000000",
    featured: true,
  },
  {
    name: "Nike",
    domain: "nike.com",
    logoFile: "nike",
    category: "Sports & Fashion",
    description: "Iconic trainers, apparel & gear",
    color: "#111111",
    featured: true,
  },
  {
    name: "Boots",
    domain: "boots.com",
    logoFile: "boots",
    category: "Beauty & Health",
    description: "Skincare, makeup, health products",
    color: "#00539C",
    featured: true,
  },
  {
    name: "Superdrug",
    domain: "superdrug.com",
    logoFile: "superdrug",
    category: "Beauty & Health",
    description: "Beauty, fragrance & wellness",
    color: "#E5007D",
    featured: false,
  },
  {
    name: "Argos",
    domain: "argos.co.uk",
    logoFile: "argos",
    logoDomain: "argos.co.uk",
    category: "Home & Electronics",
    description: "Home appliances, toys & technology",
    color: "#E62400",
    featured: false,
  },
  {
    name: "Farfetch",
    domain: "farfetch.com",
    logoFile: "farfetch",
    category: "Luxury Fashion",
    description: "Designer brands from boutiques worldwide",
    color: "#1D1D1B",
    featured: false,
  },
  {
    name: "Marks & Spencer",
    domain: "marksandspencer.com",
    logoFile: "marksandspencer",
    logoDomain: "marksandspencer.com",
    category: "Fashion & Food",
    description: "Quality clothing, food & homeware",
    color: "#000000",
    featured: false,
  },
  {
    name: "Ted Baker",
    domain: "tedbaker.com",
    logoFile: "tedbaker",
    category: "Fashion",
    description: "Contemporary British fashion brand",
    color: "#1A1A1A",
    featured: false,
  },
  {
    name: "Net-A-Porter",
    domain: "net-a-porter.com",
    logoFile: "netaporter",
    logoDomain: "net-a-porter.com",
    category: "Luxury Fashion",
    description: "Ultra-luxury designer fashion",
    color: "#1A1A1A",
    featured: false,
  },
  {
    name: "eBay UK",
    domain: "ebay.co.uk",
    logoFile: "ebay",
    logoDomain: "ebay.com",
    category: "Everything",
    description: "Marketplace with millions of products",
    color: "#E53238",
    featured: false,
  },
];

export interface Category {
  name: string;
  emoji: string;
  description: string;
  examples: string[];
  color: string;
}

export const CATEGORIES: Category[] = [
  {
    name: "Fashion & Clothing",
    emoji: "👗",
    description: "Branded clothes, shoes, bags & accessories",
    examples: ["Nike Trainers", "Gucci Bags", "ASOS Dresses"],
    color: "from-pink-500/20 to-rose-500/10",
  },
  {
    name: "Electronics & Tech",
    emoji: "💻",
    description: "Gadgets, phones, laptops & smart devices",
    examples: ["Apple AirPods", "Dyson Vacuums", "Smart Watches"],
    color: "from-blue-500/20 to-cyan-500/10",
  },
  {
    name: "Beauty & Skincare",
    emoji: "✨",
    description: "Premium skincare, makeup & fragrances",
    examples: ["Charlotte Tilbury", "La Mer", "Chanel Perfume"],
    color: "from-purple-500/20 to-violet-500/10",
  },
  {
    name: "Luxury & Designer",
    emoji: "💎",
    description: "Harrods, LV, Gucci, Selfridges & more",
    examples: ["Louis Vuitton", "Burberry Scarf", "Hermes"],
    color: "from-amber-500/20 to-yellow-500/10",
  },
  {
    name: "Home & Living",
    emoji: "🏡",
    description: "Kitchen, décor, furniture & appliances",
    examples: ["Dyson Fan", "Le Creuset", "Smeg Kettle"],
    color: "from-emerald-500/20 to-teal-500/10",
  },
  {
    name: "Books & Stationery",
    emoji: "📚",
    description: "Books, planners, art supplies & more",
    examples: ["Kindle Books", "Leuchtturm Notebooks", "Crayola"],
    color: "from-orange-500/20 to-amber-500/10",
  },
  {
    name: "Sports & Fitness",
    emoji: "🏋️",
    description: "Gym gear, outdoor wear & sports equipment",
    examples: ["Lululemon", "Adidas Running", "Gymshark"],
    color: "from-lime-500/20 to-green-500/10",
  },
  {
    name: "Kids & Toys",
    emoji: "🧸",
    description: "Educational toys, games & baby products",
    examples: ["Lego Sets", "Fisher-Price", "Peppa Pig Toys"],
    color: "from-sky-500/20 to-blue-500/10",
  },
];

export const HOW_IT_WORKS = [
  {
    step: 1,
    title: "Find your product",
    description:
      "Browse any UK online store — Amazon, Harrods, Adidas, and thousands more.",
    icon: "search",
  },
  {
    step: 2,
    title: "Submit your order",
    description:
      "Paste the product link on our site with size, color, and quantity details.",
    icon: "link",
  },
  {
    step: 3,
    title: "Get a quote & pay",
    description:
      "We send you a full price including product, service fee, and shipping to BD.",
    icon: "quote",
  },
  {
    step: 4,
    title: "Receive at home",
    description:
      "We purchase, ship from the UK, and deliver to your doorstep in Bangladesh.",
    icon: "delivery",
  },
] as const;

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: "Pending Review",
  quoted: "Quote Sent",
  confirmed: "Payment Confirmed",
  purchased: "Purchased in UK",
  shipped: "Shipped to BD",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const PAYMENT_METHODS = [
  "bKash",
  "Nagad",
  "Bank Transfer",
  "Rocket",
  "Other",
] as const;

export const TESTIMONIALS = [
  {
    name: "Nadia Rahman",
    city: "Dhaka",
    text: "Got my Charlotte Tilbury skincare from Boots — original, sealed, delivered in 3 weeks. Absolutely love AlyNaf!",
    rating: 5,
    product: "Charlotte Tilbury Magic Cream",
  },
  {
    name: "Rafiqul Islam",
    city: "Chittagong",
    text: "Ordered Nike Air Max from the UK. Saved a ton compared to Dhaka prices. Arrived perfectly packaged.",
    rating: 5,
    product: "Nike Air Max 90",
  },
  {
    name: "Tasnim Akter",
    city: "Sylhet",
    text: "AlyNaf got me a Harrods gift hamper for my mum. Communication was top-notch and delivery was smooth.",
    rating: 5,
    product: "Harrods Gift Hamper",
  },
];

/** Returns the Clearbit Logo URL for a given domain */
export function storeLogoUrl(domain: string): string {
  return `https://logo.clearbit.com/${domain}`;
}

/** Returns the store info for a URL, or null */
export function getStoreForUrl(url: string): StoreInfo | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "");
    return (
      STORES.find(
        (s) => hostname === s.domain || hostname.endsWith(`.${s.domain}`)
      ) ?? null
    );
  } catch {
    return null;
  }
}
