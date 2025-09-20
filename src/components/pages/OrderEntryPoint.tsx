"use client";

import { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { type MenuItem, type OrderItem } from '@/lib/types';
import MenuItemCard from '@/components/menu/MenuItemCard';
import OrderSummary from '@/components/order/OrderSummary';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";

export default function OrderEntryPoint() {
  const { menuItems, categories, loading } = useAppContext();
  const { toast } = useToast();
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

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

  const filteredMenuItems = useMemo(() => {
    return menuItems
      .filter(item => activeCategory === 'all' || item.category === activeCategory)
      .filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [menuItems, activeCategory, searchQuery]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left Column: Menu */}
        <div className="lg:w-2/3">
          <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline tracking-tight">Menu</h1>
                <p className="text-muted-foreground">Select items to build an order.</p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search for a dish..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full sm:w-auto overflow-x-auto">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  {categories.map(cat => (
                    <TabsTrigger key={cat.id} value={cat.id}>{cat.name}</TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-40 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
                  {filteredMenuItems.map((item) => (
                    <MenuItemCard key={item.id} item={item} onAddToOrder={handleAddToOrder} />
                  ))}
                </div>
            )}
             { !loading && filteredMenuItems.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                    <p className="text-lg font-semibold">No items found</p>
                    <p>Try adjusting your search or category filter.</p>
                </div>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="lg:w-1/3">
          <OrderSummary 
            currentOrder={currentOrder}
            onUpdateQuantity={handleUpdateQuantity}
            onRemoveItem={handleRemoveItem}
            onClearOrder={handleClearOrder}
          />
        </div>
      </div>
    </div>
  );
}
