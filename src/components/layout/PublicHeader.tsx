
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import Image from 'next/image';

export default function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-sm">
      <div className="container flex h-20 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
             <div className="relative h-16 w-40">
                <Image
                    src="/Picsart_25-07-02_21-51-50-642 (1).png"
                    alt="Reskot Logo"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: 'contain' }}
                    priority
                />
            </div>
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
             {pathname !== '/login' && pathname !== '/signup' && (
                <Button asChild variant="outline" size="sm">
                  <Link href="/login">Login</Link>
                </Button>
             )}
             {pathname !== '/signup' && (
                <Button asChild variant="default" size="sm">
                  <Link href="/signup">Sign Up</Link>
                </Button>
             )}
          </nav>
        </div>
      </div>
    </header>
  );
}
