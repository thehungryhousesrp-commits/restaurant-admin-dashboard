"use client";

import { useState } from "react";
import { type OrderItem, type CustomerInfo, type Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, MinusCircle, Trash2, ShoppingCart } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { InvoicePreview } from "./InvoicePreview";
import { useToast } from "@/hooks/use-toast";

interface OrderSummaryProps {
  currentOrder: OrderItem[];
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearOrder: () => void;
}

export default function OrderSummary({
  currentOrder,
  onUpdateQuantity,
  onRemoveItem,
  onClearOrder
}: OrderSummaryProps) {
  const { placeOrder } = useAppContext();
  const { toast } = useToast();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ name: '', table: '' });
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);

  const total = currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handlePlaceOrder = () => {
    if (currentOrder.length === 0) {
      toast({ title: "Cannot place an empty order.", variant: "destructive" });
      return;
    }
    if (!customerInfo.name || !customerInfo.table) {
      toast({ title: "Please enter customer and table name.", variant: "destructive" });
      return;
    }
    const newOrder = placeOrder(currentOrder, customerInfo);
    setPlacedOrder(newOrder);
    toast({ title: "Order Placed Successfully!", description: `Order ID: ${newOrder.id}`, variant: "default" });
  };
  
  const handleDialogClose = (open: boolean) => {
    if(!open) {
      onClearOrder();
      setCustomerInfo({ name: '', table: '' });
      setPlacedOrder(null);
    }
  }

  return (
    <Card className="sticky top-20 h-[calc(100vh-6rem)] flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <ShoppingCart />
          Current Order
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto">
        {currentOrder.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
            <ShoppingCart className="h-16 w-16 mb-4" />
            <p>Your order is empty</p>
            <p className="text-sm">Add items from the menu to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customerName">Customer Name</Label>
              <Input
                id="customerName"
                placeholder="e.g. John Doe"
                value={customerInfo.name}
                onChange={(e) => setCustomerInfo({ ...customerInfo, name: e.target.value })}
              />
            </div>
             <div className="space-y-2">
              <Label htmlFor="tableNumber">Table Number</Label>
              <Input
                id="tableNumber"
                placeholder="e.g. Table 5"
                value={customerInfo.table}
                onChange={(e) => setCustomerInfo({ ...customerInfo, table: e.target.value })}
              />
            </div>
            <Separator />
            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {currentOrder.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <div className="flex-grow">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">${item.price.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}>
                      <MinusCircle className="h-4 w-4" />
                    </Button>
                    <span className="w-6 text-center">{item.quantity}</span>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}>
                      <PlusCircle className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => onRemoveItem(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
      {currentOrder.length > 0 && (
        <CardFooter className="flex-col !p-4 border-t">
            <div className="w-full flex justify-between font-bold text-lg mb-4">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
            </div>
            <Dialog onOpenChange={handleDialogClose}>
                <DialogTrigger asChild>
                    <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handlePlaceOrder} disabled={!customerInfo.name || !customerInfo.table}>
                        Place Order & Generate Invoice
                    </Button>
                </DialogTrigger>
                {placedOrder && <InvoicePreview order={placedOrder} />}
            </Dialog>
        </CardFooter>
      )}
    </Card>
  );
}
