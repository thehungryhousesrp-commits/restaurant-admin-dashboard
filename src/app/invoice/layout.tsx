import type { Metadata } from 'next';
import { AppProvider } from '@/context/AppContext';
import '../globals.css';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'Your Invoice | Hungry House Hub',
  description: 'View your order invoice.',
};

// This is a special layout for the invoice page ONLY.
// It deliberately does NOT include the main <Header> component
// to prevent customers from navigating to other parts of the app.
export default function InvoiceLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
       <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased min-h-screen bg-background">
        <AppProvider>
            <main>{children}</main>
            <Toaster />
        </AppProvider>
      </body>
    </html>
  );
}
