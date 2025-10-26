
import Header from "@/components/layout/Header";
import OrderEntryPoint from "@/components/pages/OrderEntryPoint";

export default function Home() {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <OrderEntryPoint />
      </main>
    </div>
  );
}
