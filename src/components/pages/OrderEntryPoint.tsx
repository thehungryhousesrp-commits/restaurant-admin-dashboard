'use client';

import { useState, useCallback, useMemo, useContext } from 'react';
import { type OrderItem, type Table, type MenuItem, type Category, type Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, CheckCircle } from 'lucide-react';
import SelectTable from '@/components/order/SelectTable';
import OrderSummary from '@/components/order/OrderSummary';
import MenuItemCard from '@/components/menu/MenuItemCard';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { InvoicePreview } from '@/components/order/InvoicePreview';
import { AppContext } from '@/context/AppContext';
import { addDoc, collection, doc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardFooter, CardHeader } from '@/components/ui/card';

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

export default function OrderEntryPoint() {
  // ===========================================================================
  // State and Context
  // ===========================================================================
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

  // ===========================================================================
  // Memoized Filtering
  // ===========================================================================
  const filteredMenuItems = useMemo(() => {
    let items = menuItems;

    // Filter by selected category
    if (activeCategory !== 'all') {
      items = items.filter(item => item.category === activeCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      items = items.filter(item => 
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return items;
  }, [menuItems, activeCategory, searchQuery]);

  // ===========================================================================
  // Callbacks
  // ===========================================================================
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

  const handleClearOrder = useCallback(() => {
    setCurrentOrder([]);
    setSelectedTable(null);
    setCustomerInfo({ name: '', phone: '' });
  }, []);

  const handlePlaceOrder = useCallback(async () => {
    if (orderType === 'dine-in' && !selectedTable) {
        toast({ title: "Select a Table", description: "Please select a table for the dine-in order.", variant: "destructive" });
        return;
    }
    if (currentOrder.length === 0) {
        toast({ title: "Empty Order", description: "Please add items to the order before placing it.", variant: "destructive" });
        return;
    }

    setIsSubmitting(true);
    
    try {
        const newOrderData = await placeOrder(currentOrder, customerInfo, selectedTable, orderType);
        
        setLastPlacedOrder(newOrderData.finalOrder);
        setIsInvoiceOpen(true);
        handleClearOrder();
        
        toast({
            title: "Order Placed Successfully!",
            description: `Order ID: ${newOrderData.docRef.id.slice(-6).toUpperCase()}`,
            className: "bg-green-100 border-green-300 text-green-800",
        });
    } catch (error) {
        console.error("Error placing order: ", error);
        toast({ title: "Failed to place order", description: "An error occurred while saving the order.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }, [selectedTable, currentOrder, customerInfo, toast, handleClearOrder, orderType]);
  
  // ===========================================================================
  // Render Logic
  // ===========================================================================
  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col bg-gray-50 font-sans">
      
      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        
        {/* Left: Category Sidebar */}
        <aside className="col-span-2 bg-white border-r flex flex-col">
          <h2 className="p-3 text-sm font-semibold tracking-tight border-b text-gray-600">Categories</h2>
          <nav className="p-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={cn(
                "w-full text-left p-3 rounded-md font-medium transition-colors text-sm",
                activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'
              )}
            >
              All Items
            </button>
            {categoriesLoading ? (
              <div className="space-y-2 p-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 rounded" />)}
              </div>
            ) : (
              categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "w-full text-left p-3 rounded-md font-medium transition-colors text-sm",
                    activeCategory === cat.id ? 'bg-primary text-primary-foreground' : 'hover:bg-gray-100'
                  )}
                >
                  {cat.name}
                </button>
              ))
            )}
          </nav>
        </aside>

        {/* Middle: Menu Items */}
        <main className="col-span-7 flex flex-col p-4 overflow-hidden">
          <div className="flex items-center mb-4 gap-4">
              <h1 className="text-2xl font-bold font-headline tracking-tight">Select Items</h1>
              <div className="relative flex-grow max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                      placeholder="Search menu items..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10"
                  />
              </div>
          </div>
          
          <div className="flex-grow grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 overflow-y-auto pr-2 pb-4">
            {menuLoading ? (
               [...Array(12)].map((_, i) => (
                <Card key={i} className="overflow-hidden flex flex-col transition-all duration-300">
                    <CardHeader className="flex-grow p-3 pb-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2 mt-2" />
                    </CardHeader>
                    <CardFooter className="p-3 pt-2 mt-auto flex justify-between items-center">
                        <Skeleton className="h-5 w-1/4" />
                        <Skeleton className="h-8 w-1/3" />
                    </CardFooter>
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
        
        {/* Right: Order Panel */}
        <aside className="col-span-3 bg-white border-l flex flex-col">
          <div className="p-4 border-b space-y-4">
              <h2 className="text-xl font-bold font-headline">Current Order</h2>
              
              <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => setOrderType('dine-in')} variant={orderType === 'dine-in' ? 'default' : 'outline'}>Dine-In</Button>
                  <Button onClick={() => setOrderType('takeaway')} variant={orderType === 'takeaway' ? 'default' : 'outline'}>Takeaway</Button>
              </div>

              {orderType === 'dine-in' && selectedTable && (
                  <div className="text-sm text-muted-foreground flex items-center justify-between">
                      <span>Table: <span className="font-bold text-primary">{selectedTable.name}</span></span>
                      <button onClick={() => setSelectedTable(null)} className="text-xs text-red-500 hover:underline">Change</button>
                  </div>
              )}

              {orderType === 'takeaway' && (
                  <div className="space-y-2">
                      <Input placeholder="Customer Name" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                      <Input placeholder="Customer Phone (optional)" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                  </div>
              )}
          </div>

          <div className="flex-1 flex flex-col p-4 overflow-hidden">
              {!selectedTable && orderType === 'dine-in' ? (
                  <SelectTable onTableSelect={setSelectedTable} selectedTable={selectedTable} />
              ) : (
                  <OrderSummary items={currentOrder} onUpdateItems={handleUpdateOrder} onClearOrder={handleClearOrder} />
              )}
          </div>

          <div className="p-4 border-t bg-gray-50">
              <Button
                  onClick={handlePlaceOrder}
                  disabled={isSubmitting || (orderType === 'dine-in' && !selectedTable) || currentOrder.length === 0}
                  className="w-full"
                  size="lg"
              >
                  {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                  <CheckCircle className="mr-2 h-4 w-4" />
                  )}
                  {isSubmitting ? 'Placing Order...' : 'Place Order & Generate Invoice'}
              </Button>
          </div>
        </aside>
      </div>

      {/* Invoice Dialog */}
      <Dialog open={isInvoiceOpen} onOpenChange={setIsInvoiceOpen}>
        {lastPlacedOrder && (
          <InvoicePreview order={lastPlacedOrder} />
        )}
      </Dialog>
    </div>
  );
}
