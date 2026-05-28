import { NextRequest, NextResponse } from "next/server";
import { createOrder, updateOrderStatus } from "@/lib/orders";
import type { CreateOrderInput, OrderStatus } from "@/lib/types";

function requireAdmin(request: NextRequest): boolean {
  return (
    request.headers.get("x-admin-key") ===
    (process.env.ADMIN_KEY ?? "alynaf-admin")
  );
}

interface MockOrder {
  input: CreateOrderInput;
  status: OrderStatus;
  quoteAmount?: number;
}

const MOCK_ORDERS: MockOrder[] = [
  {
    input: {
      customerName: "Nadia Akter",
      phone: "01712345678",
      email: "nadia@example.com",
      address: "House 12, Road 7, Sector 7",
      city: "Uttara, Dhaka",
      paymentMethod: "bKash",
      source: "facebook",
      notes: "Please wrap carefully",
      items: [
        {
          productUrl: "https://www.asos.com/pimki/pimki-ribbed-knit-midi-dress/prd/204567891",
          siteName: "ASOS",
          productName: "Pimki Ribbed Knit Midi Dress",
          variantNotes: "Size 10, Black",
          price: "£28.99",
          currency: "GBP",
          quantity: 1,
        },
      ],
    },
    status: "pending",
  },
  {
    input: {
      customerName: "Rafiqul Hasan",
      phone: "01891234567",
      email: "rafiq@example.com",
      address: "House 5, Agrabad Commercial Area",
      city: "Chittagong",
      paymentMethod: "Nagad",
      source: "facebook",
      notes: "",
      items: [
        {
          productUrl: "https://www.amazon.co.uk/Nike-Air-Max-270/dp/B08XYZ12345",
          siteName: "Amazon UK",
          productName: "Nike Air Max 270",
          variantNotes: "UK Size 9, White/Black",
          price: "£89.99",
          currency: "GBP",
          quantity: 1,
        },
      ],
    },
    status: "quoted",
    quoteAmount: 13500,
  },
  {
    input: {
      customerName: "Tasmin Begum",
      phone: "01756789012",
      email: "tasmin@example.com",
      address: "Flat 4B, Banani DOHS",
      city: "Dhaka",
      paymentMethod: "Bank Transfer",
      source: "web",
      notes: "Birthday gift, please add gift wrapping",
      items: [
        {
          productUrl: "https://www.harrods.com/en-gb/beauty/skincare/la-mer/the-moisturizing-cream",
          siteName: "Harrods",
          productName: "La Mer The Moisturizing Cream",
          variantNotes: "60ml",
          price: "£145.00",
          currency: "GBP",
          quantity: 1,
        },
      ],
    },
    status: "confirmed",
  },
  {
    input: {
      customerName: "Karim Uddin",
      phone: "01611234567",
      email: "",
      address: "House 23, Dhanmondi Road 8",
      city: "Dhaka",
      paymentMethod: "bKash",
      source: "web",
      notes: "",
      items: [
        {
          productUrl: "https://www.johnlewis.com/dyson-v15-detect-vacuum/p12345",
          siteName: "John Lewis",
          productName: "Dyson V15 Detect Cordless Vacuum",
          variantNotes: "",
          price: "£599.00",
          currency: "GBP",
          quantity: 1,
        },
      ],
    },
    status: "purchased",
    quoteAmount: 89000,
  },
  {
    input: {
      customerName: "Sabrina Islam",
      phone: "01987654321",
      email: "sabrina@example.com",
      address: "Holding 33, Gulshan 2",
      city: "Dhaka",
      paymentMethod: "bKash",
      source: "web",
      notes: "Urgent, needed for wedding",
      items: [
        {
          productUrl: "https://www.boots.com/no7-beauty/skincare",
          siteName: "Boots",
          productName: "No7 Future Renew Serum",
          variantNotes: "50ml",
          price: "£34.95",
          currency: "GBP",
          quantity: 2,
        },
        {
          productUrl: "https://www.boots.com/charlotte-tilbury/magic-cream",
          siteName: "Boots",
          productName: "Charlotte Tilbury Magic Cream",
          variantNotes: "50ml",
          price: "£82.00",
          currency: "GBP",
          quantity: 1,
        },
      ],
    },
    status: "shipped",
    quoteAmount: 17400,
  },
  {
    input: {
      customerName: "Mahmud Rahman",
      phone: "01312345678",
      email: "mahmud@example.com",
      address: "Village: Osmanpur, Upazila: Sylhet Sadar",
      city: "Sylhet",
      paymentMethod: "bKash",
      source: "manual",
      notes: "Phone order, customer called directly",
      items: [
        {
          productUrl: "https://www.next.co.uk/g/mens-coats",
          siteName: "Next",
          productName: "Next Shower Resistant Hooded Puffer Jacket",
          variantNotes: "Size L, Navy",
          price: "£65.00",
          currency: "GBP",
          quantity: 1,
        },
      ],
    },
    status: "delivered",
    quoteAmount: 9700,
  },
  {
    input: {
      customerName: "Farhana Khanam",
      phone: "01456789012",
      email: "farhana@example.com",
      address: "House 7A, Bashundhara R/A, Block D",
      city: "Dhaka",
      paymentMethod: "Nagad",
      source: "facebook",
      notes: "",
      items: [
        {
          productUrl: "https://www.selfridges.com/GB/en/cat/gucci-gg-marmont-mini",
          siteName: "Selfridges",
          productName: "Gucci GG Marmont Mini Bag",
          variantNotes: "Black",
          price: "£1,150.00",
          currency: "GBP",
          quantity: 1,
        },
      ],
    },
    status: "cancelled",
  },
];

export async function POST(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not available in production" }, { status: 403 });
  }

  if (!requireAdmin(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const created: string[] = [];
  for (const mock of MOCK_ORDERS) {
    const order = await createOrder(mock.input);
    if (mock.status !== "pending") {
      await updateOrderStatus(order.orderNumber, mock.status, mock.quoteAmount);
    }
    created.push(order.orderNumber);
  }

  return NextResponse.json({ loaded: created.length, orders: created });
}
