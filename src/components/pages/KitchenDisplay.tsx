
"use client";

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, CheckCircle2, Clock, Flame, Utensils, BarChart2, Server, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

// ============================================================================
// DEMO DATA (This would come from your real-time database)
// ============================================================================
const initialDemoOrders = [
  {
    id: 'KOT-001',
    tableName: 'Table 5',
    createdAt: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
    items: [
      { id: 'item-1', name: 'Margherita Pizza', quantity: 1, prepared: false, station: 'Pizza' },
      { id: 'item-2', name: 'Pasta Carbonara', quantity: 2, prepared: true, station: 'Pasta' },
      { id: 'item-3', name: 'Classic Burger', quantity: 1, prepared: false, station: 'Grill' },
    ],
  },
  {
    id: 'KOT-002',
    tableName: 'Takeaway',
    createdAt: new Date(Date.now() - 7 * 60 * 1000), // 7 minutes ago
    items: [
        { id: 'item-2a', name: 'Pasta Carbonara', quantity: 1, prepared: false, station: 'Pasta' },
        { id: 'item-4', name: 'BBQ Chicken Wings', quantity: 1, prepared: false, station: 'Fryer' },
    ],
  },
  {
    id: 'KOT-003',
    tableName: 'Table 2',
    createdAt: new Date(Date.now() - 12 * 60 * 1000), // 12 minutes ago
    items: [
        { id: 'item-5', name: 'Spicy Arrabbiata', quantity: 1, prepared: true, station: 'Pasta' },
    ],
  },
];

type DemoOrder = typeof initialDemoOrders[0];
type DemoItem = DemoOrder['items'][0];

// ============================================================================
// KITCHEN ORDER CARD COMPONENT
// ============================================================================
const KitchenOrderCard = ({ order, onToggleItem, onBumpOrder }: { order: DemoOrder; onToggleItem: (orderId: string, itemId: string) => void; onBumpOrder: (orderId: string) => void; }) => {
    const [timeAgo, setTimeAgo] = useState('');
    const [totalSeconds, setTotalSeconds] = useState(0);

    useEffect(() => {
        const updateTimer = () => {
            const seconds = Math.floor((Date.now() - new Date(order.createdAt).getTime()) / 1000);
            setTotalSeconds(seconds);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            setTimeAgo(`${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`);
        };
        updateTimer();
        const timer = setInterval(updateTimer, 1000);
        return () => clearInterval(timer);
    }, [order.createdAt]);
    
    const timerColor = 
        totalSeconds > 600 ? 'bg-red-500 text-white' : // Over 10 mins
        totalSeconds > 300 ? 'bg-yellow-400 text-black' : // Over 5 mins
        'bg-green-500 text-white';

    const allItemsPrepared = order.items.every(item => item.prepared);

    return (
        <Card className="flex flex-col border-2 border-gray-200/80 shadow-lg bg-card rounded-xl overflow-hidden h-[450px]">
            <CardHeader className="flex-row items-center justify-between space-y-0 p-3 bg-card-foreground text-card">
                <CardTitle className="text-xl font-bold font-headline">{order.tableName}</CardTitle>
                <div className={cn("text-sm font-bold flex items-center gap-2 rounded-md px-2 py-1", timerColor)}>
                    <Clock className="h-4 w-4" />
                    <span>{timeAgo}</span>
                </div>
            </CardHeader>
            <CardContent className="p-0 flex-grow overflow-y-auto">
                <ul className="divide-y">
                    {order.items.map((item) => (
                        <li 
                            key={item.id}
                            onClick={() => onToggleItem(order.id, item.id)}
                            className={cn(
                                "p-3 cursor-pointer transition-colors",
                                item.prepared ? 'bg-green-100/50 text-muted-foreground line-through' : 'hover:bg-blue-50/50'
                            )}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className={cn("font-bold text-lg", item.prepared ? "text-green-600" : "text-primary")}>{item.quantity}x</span>
                                    <span className="font-semibold text-base">{item.name}</span>
                                </div>
                                {item.prepared && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                            </div>
                            {item.station && (
                                <Badge variant="secondary" className="mt-2 text-xs">
                                  <Server className="h-3 w-3 mr-1.5"/> Station: {item.station}
                                </Badge>
                            )}
                        </li>
                    ))}
                </ul>
            </CardContent>
            <div className="p-3 mt-auto border-t">
                <Button 
                    className="w-full" 
                    disabled={!allItemsPrepared} 
                    onClick={() => onBumpOrder(order.id)}
                    variant="secondary"
                    size="lg"
                >
                    <Check className="mr-2 h-5 w-5"/>
                    Bump to Expo
                </Button>
            </div>
        </Card>
    );
};

// ============================================================================
// SUMMARY VIEW COMPONENT
// ============================================================================
const SummaryView = ({ orders }: { orders: DemoOrder[] }) => {
    const itemSummary = orders.flatMap(o => o.items.filter(i => !i.prepared))
        .reduce((acc, item) => {
            if (!acc[item.name]) {
                acc[item.name] = 0;
            }
            acc[item.name] += item.quantity;
            return acc;
        }, {} as Record<string, number>);

    const sortedItems = Object.entries(itemSummary).sort((a, b) => b[1] - a[1]);

    if (sortedItems.length === 0) {
        return (
             <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-8 text-center">
                <Utensils className="h-24 w-24 mb-4 text-green-500" />
                <h2 className="text-2xl font-bold">All Items Prepared!</h2>
                <p>The summary view is clear. New items will appear here as orders come in.</p>
            </div>
        )
    }

    return (
        <Card className="max-w-2xl mx-auto">
            <CardHeader>
                <CardTitle className="text-2xl font-headline flex items-center gap-3">
                    <Flame className="text-primary"/>
                    <span>Kitchen Summary</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">
                    This view consolidates all items from active orders, helping chefs prioritize preparation by item type across all tickets.
                </p>
                <ul className="space-y-3">
                    {sortedItems.map(([name, quantity]) => (
                        <li key={name} className="flex justify-between items-center p-3 bg-secondary/20 rounded-lg">
                            <span className="text-lg font-semibold">{name}</span>
                            <span className="text-xl font-bold text-primary">{quantity}</span>
                        </li>
                    ))}
                </ul>
            </CardContent>
        </Card>
    );
}

// ============================================================================
// MAIN KITCHEN DISPLAY COMPONENT
// ============================================================================
export default function KitchenDisplay() {
    const [orders, setOrders] = useState<DemoOrder[]>(initialDemoOrders);

    const handleToggleItem = (orderId: string, itemId: string) => {
        setOrders(prevOrders => prevOrders.map(order => 
            order.id === orderId 
                ? { ...order, items: order.items.map(item => 
                    item.id === itemId ? { ...item, prepared: !item.prepared } : item
                )}
                : order
        ));
    };
    
    const handleBumpOrder = (orderId: string) => {
         setOrders(prevOrders => prevOrders.filter(order => order.id !== orderId));
    };

    const DemoBanner = () => (
        <div className="relative flex overflow-x-hidden bg-yellow-400 text-yellow-900 font-semibold shadow-md">
            <div className="animate-marquee whitespace-nowrap py-2 flex items-center">
                <AlertTriangle className="h-5 w-5 mx-4 shrink-0" />
                <span className="text-sm">
                    This is a demo screen created for demonstration purposes only. This system is not live yet. Refer to the 'About Developer' page for more info.
                </span>
                <AlertTriangle className="h-5 w-5 mx-4 shrink-0" />
                <span className="text-sm">
                    This is a demo screen created for demonstration purposes only. This system is not live yet. Refer to the 'About Developer' page for more info.
                </span>
            </div>
            <div className="absolute top-0 animate-marquee2 whitespace-nowrap py-2 flex items-center">
                 <AlertTriangle className="h-5 w-5 mx-4 shrink-0" />
                <span className="text-sm">
                    This is a demo screen created for demonstration purposes only. This system is not live yet. Refer to the 'About Developer' page for more info.
                </span>
                <AlertTriangle className="h-5 w-5 mx-4 shrink-0" />
                <span className="text-sm">
                    This is a demo screen created for demonstration purposes only. This system is not live yet. Refer to the 'About Developer' page for more info.
                </span>
            </div>
        </div>
    );

    if (orders.length === 0) {
        return (
            <div className="bg-gray-50 min-h-[calc(100vh-5rem)]">
                <DemoBanner />
                <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-muted-foreground p-8 text-center">
                    <CheckCircle2 className="h-28 w-28 mb-6 text-green-500" />
                    <h2 className="text-3xl font-bold font-headline">All Orders Fulfilled!</h2>
                    <p className="max-w-xl mt-2">This is a live demonstration of a modern Kitchen Display System (KDS). New orders would appear here in real-time. Below are the elite features this demo showcases.</p>
                    <Separator className="my-8 w-1/2" />
                    
                    <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold mb-3 flex items-center gap-3"><BarChart2 className="text-primary"/><span>Real-Time Analytics & Reporting</span></h3>
                            <p className="text-gray-600">A live KDS connects to a reporting dashboard, giving managers instant insights into kitchen performance. This is crucial for optimizing operations and reducing wait times.</p>
                            <Card>
                                <CardContent className="p-4 space-y-3">
                                    <div className="flex justify-between text-sm"><span>Avg. Ticket Time:</span><span className="font-bold">7m 32s</span></div>
                                    <div className="flex justify-between text-sm"><span>Items per Hour:</span><span className="font-bold">128</span></div>
                                    <div className="flex justify-between text-sm"><span>Busiest Station:</span><span className="font-bold">Pasta</span></div>
                                </CardContent>
                            </Card>
                        </div>
                        <div className="space-y-4">
                            <h3 className="text-xl font-semibold mb-3 flex items-center gap-3"><Server className="text-primary"/><span>Advanced KDS Features</span></h3>
                            <ul className="text-gray-600 space-y-3">
                            <li className="flex items-start gap-3"><Check className="h-5 w-5 text-green-500 mt-1 shrink-0"/><div><span className="font-semibold">Station Routing:</span> Items are automatically routed to the correct kitchen station (Grill, Fryer, Pizza), improving workflow.</div></li>
                            <li className="flex items-start gap-3"><Check className="h-5 w-5 text-green-500 mt-1 shrink-0"/><div><span className="font-semibold">Order Pacing:</span> To prevent overload, the system can intelligently pace orders sent to the kitchen during peak hours.</div></li>
                            <li className="flex items-start gap-3"><Check className="h-5 w-5 text-green-500 mt-1 shrink-0"/><div><span className="font-semibold">Expo Screen Integration:</span> 'Bumping' an order sends it to an Expo screen for final quality check and coordination before it's delivered to the customer.</div></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 min-h-[calc(100vh-5rem)]">
            <DemoBanner />
            <div className="p-4 sm:p-6 lg:p-8">
                <h1 className="text-4xl font-bold font-headline tracking-tight mb-6 text-center">Live Kitchen Order Display</h1>
                
                <Tabs defaultValue="tickets" className="w-full">
                    <TabsList className="grid w-full max-w-lg mx-auto grid-cols-2 mb-6">
                        <TabsTrigger value="tickets">Tickets View</TabsTrigger>
                        <TabsTrigger value="summary">Summary View</TabsTrigger>
                    </TabsList>

                    <TabsContent value="tickets">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {orders.map(order => (
                                <KitchenOrderCard key={order.id} order={order} onToggleItem={handleToggleItem} onBumpOrder={handleBumpOrder} />
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="summary">
                        <SummaryView orders={orders} />
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

    

    