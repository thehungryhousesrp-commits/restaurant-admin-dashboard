// This public layout is no longer needed as invoices are now part of the main authenticated app.
// It is being replaced with a standard RootLayout structure.
// We will move the invoice page into the main app structure.
import { AppProvider } from '@/context/AppContext';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
      <AppProvider>
        {children}
      </AppProvider>
  );
}
