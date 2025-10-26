
// This is a special layout for public-facing pages like the invoice.
// It deliberately does NOT include the main <Header> component
// to prevent customers from navigating to other parts of the app.
export default function PublicLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <main>{children}</main>;
}
