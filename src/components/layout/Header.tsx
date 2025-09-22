"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';

export default function Header() {
  const pathname = usePathname();
  const { user, logout, loadingAuth } = useAppContext();
  const router = useRouter();
  const { toast } = useToast();
  
  const navItems = [
    { href: '/', label: 'Order Entry', public: true },
    { href: '/admin/menu', label: 'Admin', public: false },
  ];

  const handleLogout = async () => {
    await logout();
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
                    src="/logo.png" 
                    alt="The Hungry House Hub Logo"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    style={{ objectFit: 'contain' }}
                    priority
                />
            </div>
          </Link>
          <nav className="hidden md:flex gap-6">
            {navItems.map((item) => (
              (item.public || user) && (
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
              )
            ))}
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
                  <Link href="/login">Login</Link>
                </Button>
               )
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
