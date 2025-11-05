import PublicHeader from "@/components/layout/PublicHeader";

// This is a special layout for public-facing pages like the invoice.
// It deliberately does NOT include the main <AppProvider> or internal components
// to ensure it's lightweight and separate from the main app.
export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <PublicHeader />
      <main>{children}</main>
    </>
  );
}
