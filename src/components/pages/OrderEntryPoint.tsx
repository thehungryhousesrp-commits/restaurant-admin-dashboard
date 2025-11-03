'use client';

import { useState, useCallback, useMemo, useContext } from 'react';
import { type OrderItem, type Table, type MenuItem, type Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, CheckCircle, User, Phone, ArrowLeft } from 'lucide-react';
import SelectTable from '@/components/order/SelectTable';
import OrderSummary from '@/components/order/OrderSummary';
import MenuItemCard from '@/components/menu/MenuItemCard';
import { useToast } from '@/hooks/use-toast';
import { Dialog } from '@/components/ui/dialog';
import { InvoicePreview } from '@/components/order/InvoicePreview';
import { AppContext } from '@/context/AppContext';
import { addDoc, collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardFooter, CardHeader, CardContent } from '@/components/ui/card';

const placeOrder = async (orderItems: OrderItem[], customerInfo: { name: string, phone: string }, selectedTable: Table | null, orderType: 'dine-in' | 'takeaway'): Promise<{ finalOrder: Order, docRef: any }> => {
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cgst = subtotal * 0.025;
  const sgst = subtotal * 0.025;
  const total = Math.round(subtotal + cgst + sgst);

  const newOrderData = {
    items: orderItems,
    customerInfo,
    tableId: selectedTable?.id || 'takeaway',
    tableName: selectedTable?.name || 'Takeaway',
    subtotal,
    cgst,
    sgst,
    total,
    status: 'Preparing' as const,
    createdAt: new Date().toISOString(), // Use ISO string for consistency
    updatedAt: new Date().toISOString(),
  };

  const batch = writeBatch(db);
  const newOrderRef = doc(collection(db, 'orders'));
  
  batch.set(newOrderRef, newOrderData);

  if (orderType === 'dine-in' && selectedTable) {
      const tableRef = doc(db, 'tables', selectedTable.id);
      batch.update(tableRef, { status: 'occupied' });
  }

  await batch.commit();

  return {
    finalOrder: { id: newOrderRef.id, ...newOrderData } as unknown as Order,
    docRef: newOrderRef
  };
};

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

export default function OrderEntryPoint() {
  const { menuItems, categories, menuLoading, categoriesLoading } = useContext(AppContext);
  
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '' });
  const [orderType, setOrderType] = useState<'dine-in' | 'takeaway'>('dine-in');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);
  const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
  
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { toast } = useToast();

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

  const handleAddItem = useCallback((item: MenuItem) => {
    setCurrentOrder(prev => {
      const existing = prev.find(o => o.itemId === item.id);
      if (existing) {
        return prev.map(o =>
          o.itemId === item.id ? { ...o, quantity: o.quantity + 1, total: (o.quantity + 1) * o.price } : o
        );
      }
      return [...prev, {
        itemId: item.id,
        name: item.name,
        quantity: 1,
        price: item.price,
        total: item.price,
        specialInstructions: '',
      }];
    });
  }, []);

  const handleUpdateOrder = useCallback((updatedItems: OrderItem[]) => {
    setCurrentOrder(updatedItems);
  }, []);

  const resetOrderState = useCallback(() => {
    setCurrentOrder([]);
    setSelectedTable(null);
    setCustomerInfo({ name: '', phone: '' });
    // Keep orderType as is for the next order
  }, []);

  const handleBackToSelection = () => {
    if (currentOrder.length > 0) {
      if (confirm('You have items in the current order. Are you sure you want to go back? The current order will be cleared.')) {
        resetOrderState();
      }
    } else {
        resetOrderState();
    }
  }

  const handlePlaceOrder = useCallback(async () => {
    if (currentOrder.length === 0) {
        toast({ title: "Empty Order", description: "Please add items to the order.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    
    try {
        const finalCustomerInfo = orderType === 'takeaway' ? customerInfo : { name: `Table: ${selectedTable?.name}`, phone: ''};
        const newOrderData = await placeOrder(currentOrder, finalCustomerInfo, selectedTable, orderType);
        
        setLastPlacedOrder(newOrderData.finalOrder);
        setIsInvoiceOpen(true);
        resetOrderState();
        
        toast({
            title: "Order Placed Successfully!",
            description: `Order ID: ${newOrderData.docRef.id.slice(-6).toUpperCase()}`,
            className: "bg-green-100 border-green-300 text-green-800",
        });
    } catch (error) {
        console.error("Error placing order: ", error);
        toast({ title: "Failed to place order", description: "An error occurred.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }, [selectedTable, currentOrder, customerInfo, toast, resetOrderState, orderType]);
  
  const showMenu = (orderType === 'dine-in' && selectedTable) || (orderType === 'takeaway' && customerInfo.name);

  // Initial Step: Select Order Type
  if (!showMenu) {
      return (
          <div className="h-[calc(100vh-5rem)] flex flex-col bg-gray-50 font-sans">
              <div className="p-4 border-b bg-white">
                  <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                      <Button onClick={() => setOrderType('dine-in')} variant={orderType === 'dine-in' ? 'default' : 'outline'} size="lg">Dine-In</Button>
                      <Button onClick={() => setOrderType('takeaway')} variant={orderType === 'takeaway' ? 'default' : 'outline'} size="lg">Takeaway</Button>
                  </div>
              </div>
              <div className="flex-1">
                {orderType === 'dine-in' ? (
                     <div className="p-4"><SelectTable onTableSelect={setSelectedTable} selectedTable={selectedTable} /></div>
                ) : (
                    <TakeawayForm onContinue={(info) => setCustomerInfo(info)} />
                )}
              </div>
          </div>
      )
  }
  
  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col bg-gray-50 font-sans">
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        
        <aside className="col-span-2 bg-white border-r flex flex-col">
          <h2 className="p-3 text-sm font-semibold tracking-tight border-b text-gray-600">Categories</h2>
          <nav className="p-2">
            <button onClick={() => setActiveCategory('all')} className={cn("w-full text-left p-3 rounded-md font-medium transition-colors text-sm", activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100')}>
              All Items
            </button>
            {categoriesLoading ? (
              <div className="space-y-2 p-2">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 rounded" />)}</div>
            ) : (
              categories.map(cat => (
                <button key={cat.id} onClick={() => setActiveCategory(cat.id)} className={cn("w-full text-left p-3 rounded-md font-medium transition-colors text-sm", activeCategory === cat.id ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100')}>
                  {cat.name}
                </button>
              ))
            )}
          </nav>
        </aside>

        <main className="col-span-7 flex flex-col p-4 overflow-hidden">
          <div className="flex items-center mb-4 gap-4">
              <h1 className="text-2xl font-bold font-headline tracking-tight">Select Items</h1>
              <div className="relative flex-grow max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search menu items..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10"/>
              </div>
          </div>
          
          <div className="flex-grow grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 overflow-y-auto pr-2 pb-4">
            {menuLoading ? (
               [...Array(12)].map((_, i) => (
                <Card key={i} className="overflow-hidden flex flex-col transition-all duration-300">
                    <CardHeader className="flex-grow p-3 pb-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2 mt-2" /></CardHeader>
                    <CardFooter className="p-3 pt-2 mt-auto flex justify-between items-center"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-8 w-1/3" /></CardFooter>
                </Card>
              ))
            ) : filteredMenuItems.length > 0 ? (
              filteredMenuItems.map(item => (
                <MenuItemCard key={item.id} item={item} onAddToOrder={handleAddItem} />
              ))
            ) : (
                <div className="col-span-full flex flex-col items-center justify-center text-center text-muted-foreground bg-gray-100 rounded-lg py-12">
                    <p className="font-medium">No items found.</p>
                    <p className="text-sm">Try clearing your search or selecting another category.</p>
                </div>
            )}
          </div>
        </main>
        
        <aside className="col-span-3 bg-white border-l flex flex-col">
          <div className="p-4 border-b space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold font-headline">Current Order</h2>
                <Button variant="ghost" size="sm" onClick={handleBackToSelection} className="flex items-center gap-1 text-xs">
                    <ArrowLeft className="h-3 w-3" /> Back
                </Button>
              </div>

               {orderType === 'dine-in' && selectedTable && (
                  <div className="text-sm font-medium text-primary p-2 bg-primary/10 rounded-md">
                      Dine-In for Table: <span className="font-bold">{selectedTable.name}</span>
                  </div>
              )}

               {orderType === 'takeaway' && customerInfo.name && (
                  <div className="text-sm font-medium text-primary p-2 bg-primary/10 rounded-md">
                     Takeaway for: <span className="font-bold">{customerInfo.name}</span>
                  </div>
              )}

              <Button onClick={handlePlaceOrder} disabled={isSubmitting || currentOrder.length === 0} className="w-full" size="lg">
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                  {isSubmitting ? 'Placing Order...' : 'Place Order & Generate Invoice'}
              </Button>
          </div>

          <div className="flex-1 flex flex-col p-4 overflow-hidden">
              <OrderSummary items={currentOrder} onUpdateItems={handleUpdateOrder} onClearOrder={resetOrderState} />
          </div>
        </aside>
      </div>

      <Dialog open={isInvoiceOpen} onOpenChange={(isOpen) => { if(!isOpen) setLastPlacedOrder(null); setIsInvoiceOpen(isOpen);}}>
        {lastPlacedOrder && (
          <InvoicePreview order={lastPlacedOrder} />
        )}
      </Dialog>
    </div>
  );
}
