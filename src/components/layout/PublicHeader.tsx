
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import LogoAnimation from './LogoAnimation';

export default function PublicHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-sm">
      <div className="container flex h-20 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
            <LogoAnimation />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
             {pathname !== '/login' && (
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
