import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OrderForm from "@/components/OrderForm";
import WhatsAppButton from "@/components/WhatsAppButton";

export const metadata = {
  title: "Place Order | AlyNaf",
  description: "Submit your UK product link and get a quote delivered to Bangladesh.",
};

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string }>;
}) {
  const { url } = await searchParams;

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[var(--bg)] py-12 text-white">
        <div className="mx-auto max-w-2xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <div className="sec-label mb-4">New Order</div>
            <h1 className="text-3xl font-black tracking-tight">Place Your Order</h1>
            <p className="mt-3 text-[var(--muted2)]">
              Paste any UK product link — we&apos;ll give you a full quote within 24 hours.
            </p>
          </div>

          <OrderForm prefillUrl={url} />

          <div className="mt-10 card-flat p-6 text-center">
            <p className="mb-3 text-sm text-[var(--muted2)]">
              Prefer to order via WhatsApp? Send us the link directly.
            </p>
            <WhatsAppButton message="Hi AlyNaf! I'd like to place an order. Here is my product link:" />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
