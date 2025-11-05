

'use client';

import { useState, useCallback, useMemo, useContext, useRef, useEffect } from 'react';
import { type OrderItem, type Table, type MenuItem, type Order, type Restaurant } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, User, Phone, ArrowLeft, CheckCircle, Trash2 } from 'lucide-react';
import SelectTable from '@/components/order/SelectTable';
import OrderSummary from '@/components/order/OrderSummary';
import MenuItemCard from '@/components/menu/MenuItemCard';
import { useToast } from '@/hooks/use-toast';
import { Dialog } from '@/components/ui/dialog';
import { InvoicePreview } from '@/components/order/InvoicePreview';
import { AppContext } from '@/context/AppContext';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardFooter, CardHeader, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { placeOrder } from '@/lib/order';


// ===============================================================
// ANIMATION COMPONENT
// ===============================================================
interface FlyingItemProps {
  item: MenuItem;
  startRect: DOMRect;
  endRef: React.RefObject<HTMLElement>;
  onAnimationComplete: () => void;
}

const FlyingItem = ({ item, startRect, endRef, onAnimationComplete }: FlyingItemProps) => {
    const endRect = endRef.current?.getBoundingClientRect();

    if (!endRect) return null;
    
    // Animate to the top-center of the target container for a "falling in" effect
    const targetX = endRect.x + (endRect.width / 2) - (startRect.width / 2);
    const targetY = endRect.y;

    return (
        <motion.div
            className="fixed z-50"
            initial={{
                left: startRect.x,
                top: startRect.y,
                width: startRect.width,
                height: startRect.height,
                opacity: 0.7,
            }}
            animate={{
                left: targetX,
                top: targetY,
                width: startRect.width / 2,
                height: startRect.height / 2,
                opacity: 0,
                scale: 0.5,
            }}
            transition={{
                duration: 0.7,
                ease: "easeInOut",
            }}
            onAnimationComplete={onAnimationComplete}
        >
            <MenuItemCard item={item} onAnimateAndAdd={() => {}} />
        </motion.div>
    );
};


// ===============================================================
// TYPES AND STATE
// ===============================================================

type OrderType = 'dine-in' | 'takeaway';
type InProgressOrders = Record<string, { items: OrderItem[]; customerInfo: { name: string; phone: string } }>;

interface AnimatingItem {
  item: MenuItem;
  startRect: DOMRect;
  key: number;
}


const TakeawayForm = ({ onContinue }: { onContinue: (info: { name: string, phone: string }) => void }) => {
    const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });

    const handleContinue = () => {
        if (!customerInfo.name) {
            alert('Please enter a customer name.');
            return;
        }
        onContinue(customerInfo);
    };

    return (
        <div className="flex flex-col items-center justify-center h-full bg-gray-50 p-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <h2 className="text-2xl font-bold font-headline text-center">Takeaway Order</h2>
                    <p className="text-muted-foreground text-center">Enter customer details to proceed.</p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="customer-name" className="text-sm font-medium">Customer Name</label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="customer-name" placeholder="e.g., John Doe" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} className="pl-10"/>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <label htmlFor="customer-phone" className="text-sm font-medium">Customer Phone</label>
                         <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input id="customer-phone" placeholder="e.g., 9876543210" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} className="pl-10"/>
                        </div>
                    </div>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleContinue} className="w-full" size="lg">Continue to Menu</Button>
                </CardFooter>
            </Card>
        </div>
    );
};


// ===============================================================
// MAIN COMPONENT
// ===============================================================

export default function OrderEntryPoint() {
  const { menuItems, categories, restaurantId, menuLoading, categoriesLoading, activeRestaurant } = useContext(AppContext);
  
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [takeawayCustomer, setTakeawayCustomer] = useState<{name: string, phone: string} | null>(null);
  const [orderType, setOrderType] = useState<OrderType>('dine-in');

  const [inProgressOrders, setInProgressOrders] = useState<InProgressOrders>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [animatingItem, setAnimatingItem] = useState<AnimatingItem | null>(null);
  const orderSummaryListRef = useRef<HTMLDivElement>(null);


  const { toast } = useToast();

  const activeKey = orderType === 'dine-in' ? selectedTable?.id : (takeawayCustomer ? 'takeaway' : null);
  
  const currentOrder = useMemo(() => {
    return activeKey ? inProgressOrders[activeKey]?.items ?? [] : [];
  }, [activeKey, inProgressOrders]);

  const currentCustomerInfo = useMemo(() => {
    return activeKey ? inProgressOrders[activeKey]?.customerInfo ?? { name: '', phone: '' } : { name: '', phone: '' };
  }, [activeKey, inProgressOrders]);
  
  useEffect(() => {
    if (orderType === 'takeaway' && takeawayCustomer) {
      if (!inProgressOrders['takeaway']) {
        setInProgressOrders(prev => ({
          ...prev,
          takeaway: { items: [], customerInfo: takeawayCustomer }
        }));
      }
    }
  }, [orderType, takeawayCustomer, inProgressOrders]);


  const handleSelectTable = (table: Table) => {
    setSelectedTable(table);
    if (!inProgressOrders[table.id]) {
      setInProgressOrders(prev => ({
        ...prev,
        [table.id]: { items: [], customerInfo: { name: '', phone: '' } }
      }));
    }
  };

  const handleUpdateOrder = useCallback((updatedItems: OrderItem[]) => {
    if (!activeKey) return;
    setInProgressOrders(prev => ({
      ...prev,
      [activeKey]: { ...(prev[activeKey] || { items: [], customerInfo: {name: '', phone: ''}}), items: updatedItems },
    }));
  }, [activeKey]);
  
  const handleUpdateCustomerInfo = useCallback((info: { name: string; phone: string }) => {
    if (!activeKey) return;
    setInProgressOrders(prev => ({
      ...prev,
      [activeKey]: { ...(prev[activeKey] || { items: [] }), customerInfo: info },
    }));
  }, [activeKey]);

  const filteredMenuItems = useMemo(() => {
    let items = menuItems;
    if (activeCategory !== 'all') {
      items = items.filter(item => item.category === activeCategory);
    }
    if (searchQuery) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return items;
  }, [menuItems, activeCategory, searchQuery]);

  const handleAnimateAndAdd = useCallback((item: MenuItem, startRect: DOMRect) => {
      if (!activeKey) return;

      // Trigger the animation
      setAnimatingItem({ item, startRect, key: Date.now() });

      // Defer the actual state update for the order
      setTimeout(() => {
          setInProgressOrders(prev => {
              const existingOrder = prev[activeKey] || { items: [], customerInfo: { name: '', phone: '' } };
              const existingItem = existingOrder.items.find(o => o.itemId === item.id);

              let newItems: OrderItem[];
              if (existingItem) {
                  newItems = existingOrder.items.map(o =>
                      o.itemId === item.id ? { ...o, quantity: o.quantity + 1, total: (o.quantity + 1) * o.price } : o
                  );
              } else {
                  newItems = [...existingOrder.items, {
                      itemId: item.id, name: item.name, quantity: 1, price: item.price, total: item.price, specialInstructions: '',
                  }];
              }
              return { ...prev, [activeKey]: { ...existingOrder, items: newItems } };
          });
      }, 100); // Small delay to let animation start
  }, [activeKey]);
  
  const resetCurrentOrderState = useCallback(() => {
    if (!activeKey) return;
    setInProgressOrders(prev => {
        const newOrders = { ...prev };
        if (newOrders[activeKey].items.length === 0) {
           delete newOrders[activeKey];
        } else {
            // If order has items, we just go back, don't clear it.
        }
        return newOrders;
    });
    // Also reset the selection state
    setSelectedTable(null);
    setTakeawayCustomer(null);
  }, [activeKey]);
  
  const handlePlaceOrder = useCallback(async () => {
    if (!activeKey || !restaurantId || currentOrder.length === 0) {
        toast({ title: "Empty Order", description: "Please add items to the order.", variant: "destructive" });
        return;
    }

    if (!currentCustomerInfo.name || !currentCustomerInfo.phone) {
        toast({ title: "Missing Information", description: "Please enter customer name and phone number.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    
    try {
        const finalCustomerInfo = {
            name: currentCustomerInfo.name,
            phone: currentCustomerInfo.phone
        };

        const { finalOrder } = await placeOrder(restaurantId, currentOrder, finalCustomerInfo, selectedTable);
        
        setLastPlacedOrder(finalOrder);
        setIsInvoiceOpen(true);
        
        toast({
            title: "Order Placed Successfully!",
            description: `Order ID: ${finalOrder.id.slice(-6).toUpperCase()}`,
            className: "bg-green-100 border-green-300 text-green-800",
        });
    } catch (error) {
        console.error("Error placing order: ", error);
        toast({ title: "Failed to place order", description: "An error occurred.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }, [activeKey, currentOrder, currentCustomerInfo, selectedTable, orderType, toast, restaurantId]);
  
  const onInvoiceDialogClose = (isOpen: boolean) => {
    setIsInvoiceOpen(isOpen);
    if (!isOpen && activeKey) {
        // Clear the specific completed order from in-progress state
        setInProgressOrders(prev => {
            const newOrders = { ...prev };
            delete newOrders[activeKey];
            return newOrders;
        });
        setSelectedTable(null);
        setTakeawayCustomer(null);
        setLastPlacedOrder(null);
    }
  };

  const handleCancelOrder = useCallback(() => {
    if (activeKey && confirm('Are you sure you want to clear this entire order? All items and customer details will be removed.')) {
      setInProgressOrders(prev => {
            const newOrders = { ...prev };
            delete newOrders[activeKey];
            return newOrders;
        });
      toast({ title: 'Order Cleared', description: 'All fields have been reset.', variant: 'destructive' });
    }
  }, [activeKey, toast]);

  const showMenu = (orderType === 'dine-in' && selectedTable) || (orderType === 'takeaway' && takeawayCustomer);

  const canPlaceOrder = currentOrder.length > 0 && !!currentCustomerInfo.name && !!currentCustomerInfo.phone;

  if (!showMenu) {
      return (
          <div className="h-[calc(100vh-5rem)] flex flex-col bg-gray-50 font-sans">
              <div className="p-4 border-b bg-white shadow-sm">
                  <h2 className="text-xl font-bold font-headline text-center mb-3">1. Select an Order Type</h2>
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                      <Button onClick={() => setOrderType('dine-in')} variant={orderType === 'dine-in' ? 'default' : 'outline'} size="lg">Dine-In</Button>
                      <Button onClick={() => setOrderType('takeaway')} variant={orderType === 'takeaway' ? 'default' : 'outline'} size="lg">Takeaway</Button>
                  </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {orderType === 'dine-in' ? (
                     <div className="p-4 sm:p-6">
                        <h3 className="text-lg font-semibold mb-3">2. Select a Table</h3>
                        <SelectTable onTableSelect={handleSelectTable} selectedTable={selectedTable} inProgressOrders={inProgressOrders}/>
                     </div>
                ) : (
                    <TakeawayForm onContinue={(info) => {
                        setTakeawayCustomer(info);
                    }} />
                )}
              </div>
          </div>
      )
  }
  
  return (
    <div className="h-[calc(100vh-5rem)] flex bg-gray-50 font-sans overflow-hidden">
      
       <AnimatePresence>
            {animatingItem && (
                <FlyingItem
                    key={animatingItem.key}
                    item={animatingItem.item}
                    startRect={animatingItem.startRect}
                    endRef={orderSummaryListRef}
                    onAnimationComplete={() => setAnimatingItem(null)}
                />
            )}
        </AnimatePresence>


      {/* Left Panel: Categories */}
      <aside className="w-[240px] flex-shrink-0 bg-white border-r flex flex-col">
        <h2 className="p-4 text-lg font-semibold tracking-tight border-b text-gray-700 shrink-0">Categories</h2>
        <ScrollArea className="flex-1">
          <nav className="p-2">
            <button onClick={() => setActiveCategory('all')} className={cn("w-full text-left p-3 rounded-md font-medium transition-colors text-sm", activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100')}>
              All Items
            </button>
            {categoriesLoading ? (
              <div className="space-y-2 p-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
            ) : (
              categories.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={cn("w-full text-left p-3 rounded-md font-medium transition-colors text-sm", activeCategory === cat.id ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100')}>
                  {cat.name}
                </button>
              ))
            )}
          </nav>
        </ScrollArea>
      </aside>

      {/* Center Panel: Menu Items */}
      <main className="flex-1 flex flex-col p-4">
        <div className="flex items-center mb-4 gap-4 shrink-0">
            <h1 className="text-2xl font-bold font-headline tracking-tight">Select Items</h1>
            <div className="relative flex-grow max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search menu items..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10"/>
            </div>
        </div>
        <ScrollArea className="flex-1">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 pr-4 pb-4">
            {menuLoading ? (
               [...Array(18)].map((_, i) => (
                <Card key={i} className="overflow-hidden flex flex-col">
                    <CardHeader className="flex-grow p-3 pb-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2 mt-2" /></CardHeader>
                    <CardFooter className="p-3 pt-2 mt-auto flex justify-between items-center"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-8 w-1/3" /></CardFooter>
                </Card>
              ))
            ) : filteredMenuItems.length > 0 ? (
              filteredMenuItems.map(item => (
                <MenuItemCard key={item.id} item={item} onAnimateAndAdd={handleAnimateAndAdd} />
              ))
            ) : (
                <div className="col-span-full flex flex-col items-center justify-center text-center text-muted-foreground bg-gray-100 rounded-lg py-12">
                    <p className="font-medium">No items found.</p>
                    <p className="text-sm">Try clearing your search or selecting another category.</p>
                </div>
            )}
          </div>
        </ScrollArea>
      </main>
      
      {/* Right Panel: Current Order */}
      <aside className="w-[380px] flex-shrink-0 bg-white border-l flex flex-col">
        <div className="p-4 border-b shrink-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold font-headline">Current Order</h2>
              <Button variant="ghost" size="sm" onClick={resetCurrentOrderState} className="flex items-center gap-1 text-xs">
                  <ArrowLeft className="h-3 w-3" /> Back
              </Button>
            </div>

             {orderType === 'dine-in' && selectedTable && (
                <div className="text-sm font-medium text-primary p-2 bg-primary/10 rounded-md mb-4">
                    Dine-In for Table: <span className="font-bold">{selectedTable.name}</span>
                </div>
            )}

             {orderType === 'takeaway' && takeawayCustomer && (
                <div className="text-sm font-medium text-primary p-2 bg-primary/10 rounded-md mb-4">
                   Takeaway for: <span className="font-bold">{takeawayCustomer.name}</span>
                </div>
            )}

            <div className="space-y-3 mb-4">
                <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="customer-name" placeholder="Customer Name *" value={currentCustomerInfo.name} onChange={e => handleUpdateCustomerInfo({ ...currentCustomerInfo, name: e.target.value })} className="pl-10 h-9 text-sm"/>
                </div>
                <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="customer-phone" placeholder="Customer Phone *" value={currentCustomerInfo.phone} onChange={e => handleUpdateCustomerInfo({ ...currentCustomerInfo, phone: e.target.value })} className="pl-10 h-9 text-sm"/>
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
               <Button onClick={handlePlaceOrder} disabled={isSubmitting || !canPlaceOrder} className="w-full" size="lg" style={{backgroundColor: '#10B981'}}>
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  {isSubmitting ? 'Placing...' : 'Place Order'}
               </Button>
               <Button onClick={handleCancelOrder} variant="destructive" size="lg" disabled={isSubmitting || currentOrder.length === 0}>
                  <Trash2 className="mr-2 h-4 w-4" /> Cancel
               </Button>
            </div>
        </div>

        <div className="p-4 flex-grow min-h-0">
            <OrderSummary ref={orderSummaryListRef} orderItems={currentOrder} onUpdateOrder={handleUpdateOrder} />
        </div>
      </aside>

      <Dialog open={isInvoiceOpen} onOpenChange={onInvoiceDialogClose}>
        {lastPlacedOrder && (
          <InvoicePreview order={lastPlacedOrder} />
        )}
      </Dialog>
    </div>
  );
}
