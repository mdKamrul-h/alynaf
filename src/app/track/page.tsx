import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import TrackForm from "@/components/TrackForm";

export const metadata = {
  title: "Track Order | AlyNaf",
  description: "Track your AlyNaf order from UK purchase to delivery in Bangladesh.",
};

export default function TrackPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#0a0a0a] py-12 text-white">
        <div className="mx-auto max-w-xl px-4 sm:px-6">
          <div className="mb-10 text-center">
            <h1 className="text-3xl font-bold">Track Your Order</h1>
            <p className="mt-3 text-slate-400">
              Enter your order number and phone to see the latest status.
            </p>
          </div>

          <TrackForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
