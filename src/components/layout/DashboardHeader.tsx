
"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '@/lib/firebase';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { useContext, useState } from 'react';
import { AppContext } from '@/context/AppContext';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuGroup } from '@/components/ui/dropdown-menu';
import { Building, ChevronDown, LogOut, PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import CreateRestaurantForm from '../onboarding/CreateRestaurantForm';
import { doc, updateDoc } from 'firebase/firestore';


export default function DashboardHeader() {
  const pathname = usePathname();
  const [user, loadingAuth] = useAuthState(auth);
  const { appUser, restaurants, activeRestaurant, switchRestaurant } = useContext(AppContext);
  const router = useRouter();
  const { toast } = useToast();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const navItems = [
    { href: '/order-entry', label: 'Order Entry' },
    { href: '/admin/menu', label: 'Admin' },
    { href: '/kitchen', label: 'Kitchen Display' },
    { href: '/about', label: 'About' }
  ];

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
    router.push('/');
  };

  const handleSwitchRestaurant = async (restaurantId: string) => {
    if (appUser) {
      try {
        await updateDoc(doc(db, 'users', appUser.uid), {
          activeRestaurantId: restaurantId,
        });
        // The AppContext will automatically update the state
        toast({ title: "Switched Outlet", description: `You are now managing a new outlet.`});
      } catch (error) {
        toast({ title: "Error", description: "Could not switch outlets.", variant: 'destructive'});
        console.error("Error switching restaurant:", error);
      }
    }
  };


  return (
    <header className="sticky top-0 z-40 w-full border-b bg-card/80 backdrop-blur-sm">
      <div className="container flex h-20 items-center space-x-4 sm:justify-between sm:space-x-0">
        <div className="flex gap-6 md:gap-10">
          <Link href="/order-entry" className="flex items-center space-x-2">
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
          <nav className="hidden md:flex gap-6 items-center">
            {navItems.map((item) => (
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
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <nav className="flex items-center space-x-2">
            {loadingAuth || !appUser ? (
              <Skeleton className="h-9 w-24 rounded-md" />
            ) : user ? (
              <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline">
                      <Building className="mr-2 h-4 w-4" />
                      <span className='truncate max-w-[150px]'>{activeRestaurant?.name ?? 'Select Outlet'}</span>
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuLabel>
                      Signed in as {appUser.displayName}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuGroup>
                       <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">My Outlets</DropdownMenuLabel>
                        {restaurants.map(r => (
                          <DropdownMenuItem key={r.id} onClick={() => handleSwitchRestaurant(r.id)} disabled={r.id === activeRestaurant?.id}>
                            {r.name}
                          </DropdownMenuItem>
                        ))}
                    </DropdownMenuGroup>
                    <DropdownMenuSeparator />
                    <DialogTrigger asChild>
                        <DropdownMenuItem>
                          <PlusCircle className="mr-2 h-4 w-4" />
                          <span>Create New Outlet</span>
                        </DropdownMenuItem>
                    </DialogTrigger>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create a New Restaurant Outlet</DialogTitle>
                    </DialogHeader>
                    <CreateRestaurantForm user={user} onFormSubmit={() => setIsCreateOpen(false)} />
                </DialogContent>
              </Dialog>
            ) : (
               <Button asChild variant="default" size="sm">
                  <Link href="/login">Login</Link>
                </Button>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
