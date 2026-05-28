export interface VariantGroup {
  name: string;        // "Size", "Color", "Style"
  options: string[];   // ["S", "M", "L", "XL"] or ["Red", "Blue", "Navy"]
}

export type OrderStatus =
  | "pending"
  | "quoted"
  | "confirmed"
  | "purchased"
  | "shipped"
  | "delivered"
  | "cancelled";

export type OrderSource = "web" | "facebook" | "manual";

export interface OrderItem {
  productUrl: string;
  productName: string;
  quantity: number;
  variantNotes: string;
  imageUrl?: string;
  price?: string;
  currency?: string;
  siteName?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  items: OrderItem[];
  notes: string;
  paymentMethod: string;
  status: OrderStatus;
  quoteAmount: number | null;
  quoteCurrency: string;
  source: OrderSource;
  fbConversationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderInput {
  customerName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  items: OrderItem[];
  notes: string;
  paymentMethod: string;
  source?: OrderSource;
  fbConversationId?: string | null;
}

export type FbConversationStatus = "open" | "archived";

export type InboxChannel = "facebook" | "whatsapp";

export interface FbConversation {
  id: string;
  customerPsid: string;
  customerName: string;
  customerAvatar: string | null;
  lastMessageAt: string;
  lastMessageSnippet: string;
  unreadCount: number;
  status: FbConversationStatus;
  isLikelyOrder: boolean;
  linkedOrderNumber: string | null;
  channel: InboxChannel;
  createdAt: string;
  updatedAt: string;
}

export type FbMessageFromType = "customer" | "page";

export interface FbMessage {
  id: string;
  conversationId: string;
  fromType: FbMessageFromType;
  text: string;
  attachmentsJson: string | null;
  signalsJson: string | null;
  channel: InboxChannel;
  createdAt: string;
}

export interface MessageSignals {
  urls: string[];
  phones: string[];
  addressHints: string[];
  prices: string[];
  sizes: string[];
  isLikelyOrder: boolean;
  score: number;
  // AI-enhanced fields (present when Claude analyzed the message)
  aiSummary?: string;
  confidence?: number;
  extractedName?: string;
  extractedCity?: string;
}
