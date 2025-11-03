'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { type OrderItem, type Table, type MenuItem, type Category, type Order } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Search, CheckCircle, XCircle } from 'lucide-react';
import SelectTable from '@/components/order/SelectTable';
import OrderSummary from '@/components/order/OrderSummary';
import MenuItemCard from '@/components/menu/MenuItemCard';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { InvoicePreview } from '@/components/order/InvoicePreview';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { cn } from '@/lib/utils';
import { placeOrder } from '@/lib/order';

export default function OrderEntryPoint() {
  // ===========================================================================
  // State Management
  // ===========================================================================
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
  // Data Fetching
  // ===========================================================================
  const [menuItemsSnapshot, menuLoading] = useCollection(collection(db, 'menuItems'));
  const [categoriesSnapshot, categoriesLoading] = useCollection(collection(db, 'categories'));

  // Sanitize and memoize data to prevent re-renders
  const { menuItems, categories } = useMemo(() => {
    const categoriesData = (categoriesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []) as Category[];
    const categoryIds = new Set(categoriesData.map(c => c.id));
    
    const menuItemsData = (menuItemsSnapshot?.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || 'Unnamed Item',
        price: data.price || 0,
        category: data.category || 'uncategorized',
        description: data.description || '',
        isAvailable: typeof data.isAvailable === 'boolean' ? data.isAvailable : true,
        isVeg: typeof data.isVeg === 'boolean' ? data.isVeg : false,
      } as MenuItem;
    }) || []).filter(item => categoryIds.has(item.category)); // Only show items with a valid category

    return { menuItems: menuItemsData, categories: categoriesData };
  }, [menuItemsSnapshot, categoriesSnapshot]);

  // ===========================================================================
  // Memoized Filtering
  // ===========================================================================
  const filteredMenuItems = useMemo(() => {
    return menuItems
      .filter(item => activeCategory === 'all' || item.category === activeCategory)
      .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
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
        const orderPayload = placeOrder(currentOrder, customerInfo, selectedTable!); 
        const docRef = await addDoc(collection(db, 'orders'), orderPayload);

        if (orderType === 'dine-in' && selectedTable) {
            const tableRef = doc(db, 'tables', selectedTable.id);
            const batch = writeBatch(db);
            batch.update(tableRef, { status: 'occupied' });
            await batch.commit();
        }

        const finalOrder = { ...orderPayload, id: docRef.id, createdAt: new Date().toISOString() } as Order;
        setLastPlacedOrder(finalOrder);
        setIsInvoiceOpen(true);
        handleClearOrder();
        toast({
            title: "Order Placed Successfully!",
            description: `Order ID: ${docRef.id.slice(-6).toUpperCase()}`,
            className: "bg-green-100 border-green-300 text-green-800",
        });
    } catch (error) {
        console.error("Error placing order: ", error);
        toast({ title: "Failed to place order", description: "An error occurred while saving the order.", variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }, [selectedTable, currentOrder, customerInfo, toast, handleClearOrder, orderType]);
  
  useEffect(() => {
    if (orderType === 'takeaway') {
      setSelectedTable(null);
    }
  }, [orderType]);


  // ===========================================================================
  // Render Logic
  // ===========================================================================
  return (
    <div className="h-[calc(100vh-5rem)] flex flex-col bg-gray-50 font-sans">
      
      {/* Main Content Grid */}
      <div className="flex-1 grid grid-cols-12 overflow-hidden">
        
        {/* Left: Category Sidebar (Col 1-2) */}
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
                  {[...Array(5)].map((_, i) => <div key={i} className="h-8 bg-gray-200 rounded animate-pulse" />)}
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

        {/* Middle: Menu Items (Col 3-8) */}
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
          
          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4">
            {menuLoading ? (
              [...Array(8)].map((_, i) => (
                  <div key={i} className="h-32 bg-gray-200 rounded-lg animate-pulse" />
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
        
        {/* Right: Order Panel (Col 9-12) */}
        <aside className="col-span-3 bg-white border-l flex flex-col">
            <div className="p-4 border-b">
                 <h2 className="text-xl font-bold font-headline">Current Order</h2>
                 {orderType === 'dine-in' && selectedTable && (
                     <div className="text-sm text-muted-foreground flex items-center justify-between">
                         <span>Building order for table: <span className="font-bold text-primary">{selectedTable.name}</span></span>
                         <button onClick={() => setSelectedTable(null)} className="text-xs text-red-500 hover:underline">Change Table</button>
                     </div>
                 )}
                 {orderType === 'takeaway' && (
                      <div className="text-sm text-muted-foreground">
                         Building order for <span className="font-bold text-primary">Takeaway</span>
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

            <div className="p-4 border-t bg-gray-50 space-y-4">
              <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => setOrderType('dine-in')} variant={orderType === 'dine-in' ? 'default' : 'outline'}>Dine-In</Button>
                  <Button onClick={() => setOrderType('takeaway')} variant={orderType === 'takeaway' ? 'default' : 'outline'}>Takeaway</Button>
              </div>

              {orderType === 'takeaway' && (
                  <div className="space-y-2">
                      <Input placeholder="Customer Name" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                      <Input placeholder="Customer Phone (optional)" value={customerInfo.phone} onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})} />
                  </div>
              )}

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
