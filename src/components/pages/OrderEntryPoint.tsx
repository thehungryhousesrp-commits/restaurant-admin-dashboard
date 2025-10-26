
"use client";

import { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { type MenuItem, type OrderItem, type Table, type Order } from '@/lib/types';
import MenuItemCard from '@/components/menu/MenuItemCard';
import OrderSummary from '@/components/order/OrderSummary';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Search, RotateCcw } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import SelectTable from '../order/SelectTable';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

export default function OrderEntryPoint() {
  const { menuItems, categories, loading, updateTableStatus, orders } = useAppContext();
  const { toast } = useToast();
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  const handleAddToOrder = (item: MenuItem) => {
    setCurrentOrder(prevOrder => {
      const existingItem = prevOrder.find(orderItem => orderItem.id === item.id);
      if (existingItem) {
        return prevOrder.map(orderItem =>
          orderItem.id === item.id
            ? { ...orderItem, quantity: orderItem.quantity + 1 }
            : orderItem
        );
      }
      return [...prevOrder, { ...item, quantity: 1 }];
    });
    toast({ title: `Added ${item.name} to order.` });
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity === 0) {
      handleRemoveItem(itemId);
      return;
    }
    setCurrentOrder(prevOrder =>
      prevOrder.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setCurrentOrder(prevOrder => prevOrder.filter(item => item.id !== itemId));
  };
  
  const handleClearOrder = () => {
    setCurrentOrder([]);
  };

  const handleSelectTable = (table: Table) => {
    if (table.status === 'available') {
      setSelectedTable(table);
      updateTableStatus(table.id, 'occupied');
      toast({ title: `Table "${table.name}" selected`, description: "You can now start adding items to the order." });
    } else {
      // Find the most recent active order for this table
      const activeOrder = orders
        .filter(o => o.tableId === table.id && o.status !== 'Billed' && o.status !== 'Completed')
        .sort((a, b) => b.createdAt - a.createdAt)[0];

      if (activeOrder) {
        const loadedOrderItems: OrderItem[] = activeOrder.items.map(orderItem => {
          const menuItem = menuItems.find(mi => mi.id === orderItem.itemId);
          return {
            ...menuItem!,
            quantity: orderItem.quantity,
          };
        }).filter(item => item.id); // Filter out any items that couldn't be found

        setCurrentOrder(loadedOrderItems);
        toast({ title: `Editing order for table "${table.name}"`, description: `${loadedOrderItems.length} items loaded.` });
      } else {
        toast({ title: `No active order for table "${table.name}"`, description: "Starting a new order.", variant: 'default' });
        setCurrentOrder([]);
      }
       setSelectedTable(table);
    }
  };

  const handleResetTable = () => {
    if (selectedTable) {
        // Only mark as available if no KOT has been generated yet for this session.
        // A more robust system would check the server, but this is a good client-side guard.
        const activeOrderForTable = orders.find(o => o.tableId === selectedTable.id && o.status !== 'Billed' && o.status !== 'Completed');
        if (!activeOrderForTable) {
            updateTableStatus(selectedTable.id, 'available');
        }
    }
    setSelectedTable(null);
    handleClearOrder();
  };

  const filteredMenuItems = useMemo(() => {
    return menuItems
      .filter(item => activeCategory === 'all' || item.category === activeCategory)
      .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [menuItems, activeCategory, searchQuery]);
  
  if (!selectedTable) {
    return <SelectTable onSelectTable={handleSelectTable} />;
  }

  return (
    <div className="flex h-[calc(100vh-5rem)] bg-gray-100 dark:bg-gray-900">
      {/* Column 1: Categories */}
      <div className="w-56 bg-card border-r flex flex-col">
        <h2 className="p-4 text-lg font-semibold border-b">Categories</h2>
        <div className="flex-grow overflow-y-auto">
          <nav className="p-2">
            <button
                onClick={() => setActiveCategory('all')}
                className={cn(
                    "w-full text-left p-3 rounded-md font-medium transition-colors",
                    activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                )}
            >
                All Items
            </button>
            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={cn(
                        "w-full text-left p-3 rounded-md font-medium transition-colors mt-1",
                        activeCategory === cat.id ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                    )}
                >
                    {cat.name}
                </button>
            ))}
          </nav>
        </div>
      </div>
      
      {/* Column 2: Menu Items */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden">
        <div className="flex justify-between items-start mb-4">
            <div>
                <h1 className="text-2xl font-bold font-headline tracking-tight">Select Items</h1>
                <p className="text-muted-foreground">Building order for table: <span className="font-bold text-primary">{selectedTable.name}</span></p>
            </div>
            <Button variant="outline" onClick={handleResetTable}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Change Table
            </Button>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search for a dish..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {loading ? (
          <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
            <div className="flex-grow grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto pr-2 pb-4">
              {filteredMenuItems.map((item) => (
                <MenuItemCard key={item.id} item={item} onAddToOrder={handleAddToOrder} />
              ))}
               { !loading && filteredMenuItems.length === 0 && (
                  <div className="col-span-full text-center py-16 text-muted-foreground">
                      <p className="text-lg font-semibold">No items found</p>
                      <p>Try adjusting your search or category filter.</p>
                  </div>
              )}
            </div>
        )}
      </div>

      {/* Column 3: Order Summary */}
      <div className="w-96 border-l bg-card">
          <OrderSummary 
            currentOrder={currentOrder}
            selectedTable={selectedTable}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearOrder={handleClearOrder}
            onOrderPlaced={handleResetTable}
          />
      </div>
    </div>
  );
}
