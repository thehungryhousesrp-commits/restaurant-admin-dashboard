"use client";

import { useState, useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { type Order } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChefHat, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';

const KitchenOrderCard = ({ order, onUpdateStatus }: { order: Order; onUpdateStatus: (id: string, status: Order['status']) => void; }) => {
    const [timeAgo, setTimeAgo] = useState(() => formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }));

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeAgo(formatDistanceToNow(new Date(order.createdAt), { addSuffix: true }));
        }, 1000 * 60); // Update every minute
        return () => clearInterval(timer);
    }, [order.createdAt]);
    
    return (
        <Card className="flex flex-col bg-slate-50 dark:bg-slate-900/50 border-yellow-500/50">
            <CardHeader className="flex-row items-center justify-between space-y-0 p-4 bg-slate-100 dark:bg-slate-800/60 rounded-t-lg">
                <CardTitle className="text-lg font-bold">{order.tableName || 'Takeaway'}</CardTitle>
                <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>{timeAgo}</span>
                </div>
            </CardHeader>
            <CardContent className="p-4 flex-grow space-y-3 overflow-y-auto">
                {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center text-base">
                        <span className="font-medium">{item.name}</span>
                        <span className="font-bold text-lg">x {item.quantity}</span>
                    </div>
                ))}
            </CardContent>
            <CardFooter className="p-4 border-t">
                <Button className="w-full bg-green-600 hover:bg-green-700" onClick={() => onUpdateStatus(order.id, 'Completed')}>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Mark as Ready
                </Button>
            </CardFooter>
        </Card>
    );
};

export default function KitchenDisplay() {
    const { orders, updateOrderStatus } = useAppContext();
    const { toast } = useToast();

    const activeOrders = orders.filter(order => order.status === 'Preparing');
    
    const handleUpdateStatus = (id: string, status: Order['status']) => {
        updateOrderStatus(id, status);
        toast({
            title: "Order Status Updated",
            description: `The order has been marked as ${status}.`
        });
    };

    if (activeOrders.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-muted-foreground">
                <ChefHat className="h-24 w-24 mb-4" />
                <h2 className="text-2xl font-bold">All Orders Prepared!</h2>
                <p>New KOTs will appear here as they are generated.</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold font-headline tracking-tight mb-6">Active Kitchen Orders</h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {activeOrders.map(order => (
                    <KitchenOrderCard key={order.id} order={order} onUpdateStatus={handleUpdateStatus} />
                ))}
            </div>
        </div>
    );
}
