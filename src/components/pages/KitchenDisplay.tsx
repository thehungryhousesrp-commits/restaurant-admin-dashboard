
"use client";

import { useState, useEffect, useContext } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { AppContext } from '@/context/AppContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, CheckCircle2, Clock, Flame, Utensils, BarChart2, Server, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { type Order, type OrderItem } from '@/lib/types';
import { Skeleton } from '../ui/skeleton';


// ============================================================================
// KITCHEN ORDER CARD COMPONENT
// ============================================================================
const KitchenOrderCard = ({ order, onToggleItem, onBumpOrder }: { order: Order; onToggleItem: (orderId: string, itemId: string) => void; onBumpOrder: (orderId: string) => void; }) => {
    const [timeAgo, setTimeAgo] = useState('');
    const [totalSeconds, setTotalSeconds] = useState(0);

    useEffect(() => {
        const orderTimestamp = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
        const updateTimer = () => {
            const seconds = Math.floor((Date.now() - orderTimestamp.getTime()) / 1000);
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

    // An item is considered "prepared" if its ID is in the preparedItems array.
    const isItemPrepared = (item: OrderItem) => order.preparedItems?.includes(item.itemId);
    const allItemsPrepared = order.items.every(isItemPrepared);

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
                            key={item.itemId}
                            onClick={() => onToggleItem(order.id, item.itemId)}
                            className={cn(
                                "p-3 cursor-pointer transition-colors",
                                isItemPrepared(item) ? 'bg-green-100/50 text-muted-foreground line-through' : 'hover:bg-blue-50/50'
                            )}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <span className={cn("font-bold text-lg", isItemPrepared(item) ? "text-green-600" : "text-primary")}>{item.quantity}x</span>
                                    <span className="font-semibold text-base">{item.name}</span>
                                </div>
                                {isItemPrepared(item) && <CheckCircle2 className="h-6 w-6 text-green-500" />}
                            </div>
                            {item.specialInstructions && (
                                <Badge variant="outline" className="mt-2 text-xs">
                                  Note: {item.specialInstructions}
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
                    Mark as Completed
                </Button>
            </div>
        </Card>
    );
};

// ============================================================================
// SUMMARY VIEW COMPONENT
// ============================================================================
const SummaryView = ({ orders }: { orders: Order[] }) => {
    const itemSummary = orders.flatMap(o => o.items.filter(i => !o.preparedItems?.includes(i.itemId)))
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
                    <span>Live Kitchen Summary</span>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground mb-4">
                    This is a consolidated list of all unprepared items from active orders.
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
    const { restaurantId } = useContext(AppContext);
    
    // Query for orders that are in 'Preparing' status
    const [ordersSnapshot, loading, error] = useCollection(
        restaurantId ? query(collection(db, `restaurants/${restaurantId}/orders`), where('status', '==', 'Preparing')) : null
    );

    const orders = ordersSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Order)) || [];

    const handleToggleItem = async (orderId: string, itemId: string) => {
        if (!restaurantId) return;
        const orderRef = doc(db, `restaurants/${restaurantId}/orders`, orderId);
        const order = orders.find(o => o.id === orderId);
        if (!order) return;

        const isPrepared = order.preparedItems?.includes(itemId);
        
        await updateDoc(orderRef, {
            preparedItems: isPrepared ? arrayRemove(itemId) : arrayUnion(itemId)
        });
    };
    
    const handleBumpOrder = async (orderId: string) => {
        if (!restaurantId) return;
        const orderRef = doc(db, `restaurants/${restaurantId}/orders`, orderId);
        await updateDoc(orderRef, {
            status: 'Completed',
            updatedAt: new Date(),
        });
    };

    if (!restaurantId) {
         return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-muted-foreground p-8 text-center">
                <AlertTriangle className="h-24 w-24 mb-4 text-yellow-500" />
                <h2 className="text-2xl font-bold">No Active Restaurant</h2>
                <p>Please select an active restaurant from the header to see the kitchen display.</p>
            </div>
        )
    }
    
    if (loading) {
        return (
             <div className="p-4 sm:p-6 lg:p-8">
                <h1 className="text-4xl font-bold font-headline tracking-tight mb-6 text-center">Live Kitchen Order Display</h1>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {[...Array(4)].map((_, i) => (
                        <Card key={i} className="h-[450px]"><CardHeader><Skeleton className="h-8 w-3/4"/></CardHeader><CardContent className="space-y-2"><Skeleton className="h-6 w-full"/><Skeleton className="h-6 w-5/6"/><Skeleton className="h-6 w-full"/></CardContent></Card>
                    ))}
                </div>
            </div>
        )
    }
    
    if (error) {
        return (
             <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-destructive-foreground bg-destructive p-8 text-center">
                <AlertTriangle className="h-24 w-24 mb-4" />
                <h2 className="text-2xl font-bold">Error Loading Orders</h2>
                <p>{error.message}</p>
            </div>
        )
    }

    if (orders.length === 0) {
        return (
            <div className="bg-gray-50 min-h-[calc(100vh-5rem)]">
                <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-muted-foreground p-8 text-center">
                    <CheckCircle2 className="h-28 w-28 mb-6 text-green-500" />
                    <h2 className="text-3xl font-bold font-headline">All Orders Fulfilled!</h2>
                    <p className="max-w-xl mt-2">The kitchen is clear. New orders will appear here in real-time as they are placed.</p>
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
                            <li className="flex items-start gap-3"><Check className="h-5 w-5 text-green-500 mt-1 shrink-0"/><div><span className="font-semibold">Station Routing:</span> Items can be automatically routed to the correct kitchen station (Grill, Fryer, Pizza), improving workflow.</div></li>
                            <li className="flex items-start gap-3"><Check className="h-5 w-5 text-green-500 mt-1 shrink-0"/><div><span className="font-semibold">Order Pacing:</span> To prevent overload, the system can intelligently pace orders sent to the kitchen during peak hours.</div></li>
                            <li className="flex items-start gap-3"><Check className="h-5 w-5 text-green-500 mt-1 shrink-0"/><div><span className="font-semibold">Expo Screen Integration:</span> 'Bumping' an order can send it to an Expo screen for final quality check and coordination.</div></li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gray-100 dark:bg-black min-h-[calc(100vh-5rem)]">
            <div className="p-4 sm:p-6 lg:p-8">
                <h1 className="text-4xl font-bold font-headline tracking-tight mb-6 text-center">Live Kitchen Order Display</h1>
                
                <Tabs defaultValue="tickets" className="w-full">
                    <TabsList className="grid w-full max-w-lg mx-auto grid-cols-2 mb-6">
                        <TabsTrigger value="tickets">Tickets View ({orders.length})</TabsTrigger>
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

    