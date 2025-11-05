
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

export default function Header() {
  const pathname = usePathname();
  const [user, loadingAuth] = useAuthState(auth);
  const router = useRouter();
  const { toast } = useToast();
  
  const navItems = [
    { href: '/', label: 'Order Entry', public: true, admin: false },
    { href: '/admin/menu', label: 'Admin', public: false, admin: true },
    { href: '/kitchen', label: 'Kitchen Display', public: false, admin: true },
    { href: '/about', label: 'About', public: true, admin: false }
  ];

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/');
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-sm">
      <div className="container flex h-20 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/" className="flex items-center space-x-2">
             <div className="relative h-16 w-40">
                <Image
                    src="/Picsart_25-07-02_21-51-50-642 (1).png"
                    alt="The Hungry House Hub Logo"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: 'contain' }}
                    priority
                />
            </div>
          </Link>
          <nav className="hidden md:flex gap-6 items-center">
            {navItems.map((item) => {
              // Always render public links that are not admin links
              if (item.public && !item.admin) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                      pathname === item.href && "text-foreground"
                    )}
                  >
                    {item.label}
                  </Link>
                );
              }
              // For admin links, check auth state
              if (item.admin) {
                if (loadingAuth) {
                    return <Skeleton key={item.href} className="h-5 w-20" />;
                }
                if (user) {
                   return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                          pathname === item.href && "text-foreground"
                        )}
                      >
                        {item.label}
                      </Link>
                   );
                }
                // If not loading and not user, render nothing
                return null;
              }
              // Return null for any other case to be safe
              return null;
            })}
          </nav>
        </div>
        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-1">
            {loadingAuth ? (
              <Skeleton className="h-9 w-20" />
            ) : user ? (
              <Button onClick={handleLogout} variant="outline" size="sm">
                Logout
              </Button>
            ) : (
               pathname !== '/login' && (
                <Button asChild variant="default" size="sm">
                  <Link href="/login">Login / Sign Up</Link>
                </Button>
               )
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
