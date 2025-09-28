
"use client";

import { useState } from "react";
import { type OrderItem, type CustomerInfo, type Order } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { PlusCircle, MinusCircle, Trash2, ShoppingCart, Loader2 } from "lucide-react";
import { useAppContext } from "@/context/AppContext";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { InvoicePreview } from "./InvoicePreview";
import { ErrorPopup } from "@/components/ui/ErrorPopup";

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
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({ name: '', phone: '' });
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [popupVisible, setPopupVisible] = useState(false);

  const subtotal = currentOrder.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cgst = subtotal * 0.025;
  const sgst = subtotal * 0.025;
  const total = subtotal + cgst + sgst;

  const validatePhoneNumber = (phone: string): boolean => {
    const trimmedPhone = phone.trim();
    if (!/^[6-9]\d{9}$/.test(trimmedPhone)) return false;
    if (/^(\d)\1{9}$/.test(trimmedPhone)) return false;
    if (/(\d)\1{4,}/.test(trimmedPhone)) return false;
    if ("0123456789".includes(trimmedPhone) || "9876543210".includes(trimmedPhone)) return false;
    return true;
  };

  const validateCustomerName = (name: string): boolean => {
    const trimmedName = name.trim();
    if (trimmedName.length < 3) return false;
    if (!/^[a-zA-Z\s]+$/.test(trimmedName)) return false;
    if (/([a-zA-Z])\1{2,}/.test(trimmedName)) return false;
    if (!/[aeiou]/i.test(trimmedName)) return false;
    return true;
  };

  const handlePlaceOrder = async () => {
    if (currentOrder.length === 0) {
      setErrorMsg("Cannot place an empty order.");
      setPopupVisible(true);
      return;
    }
    if (!validateCustomerName(customerInfo.name)) {
      setErrorMsg("Please enter a valid name (at least 3 letters).");
      setPopupVisible(true);
      return;
    }
    if (!validatePhoneNumber(customerInfo.phone)) {
      setErrorMsg("Please enter a valid 10-digit Indian mobile number.");
      setPopupVisible(true);
      return;
    }

    setIsPlacingOrder(true);
    try {
      const newOrder = await placeOrder(currentOrder, customerInfo);
      setPlacedOrder(newOrder);
    } catch (error) {
      setErrorMsg("Failed to place order. Please try again.");
      setPopupVisible(true);
    } finally {
      setIsPlacingOrder(false);
    }
  };
  
  const handleDialogClose = (open: boolean) => {
    if(!open) {
      onClearOrder();
      setCustomerInfo({ name: '', phone: '' });
      setPlacedOrder(null);
    }
  }

  return (
    <>
      <ErrorPopup
        visible={popupVisible}
        message={errorMsg}
        onClose={() => setPopupVisible(false)}
      />
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
                <Label htmlFor="phoneNumber">Phone Number</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={customerInfo.phone}
                  maxLength={10}
                  onChange={(e) => setCustomerInfo({ ...customerInfo, phone: e.target.value.replace(/[^\d]/g, '') })}
                />
              </div>
              <Separator />
              <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                {currentOrder.map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <div className="flex-grow">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">₹{item.price.toFixed(2)}</p>
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
              <div className="w-full space-y-1 text-sm mb-4">
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">CGST (2.5%)</span>
                      <span>₹{cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-muted-foreground">SGST (2.5%)</span>
                      <span>₹{sgst.toFixed(2)}</span>
                  </div>
              </div>
              <div className="w-full flex justify-between font-bold text-lg mb-4">
                  <span>Total</span>
                  <span>₹{Math.round(total).toFixed(2)}</span>
              </div>
              <Dialog onOpenChange={handleDialogClose}>
                  <DialogTrigger asChild>
                      <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" onClick={handlePlaceOrder} disabled={isPlacingOrder}>
                          {isPlacingOrder && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Place Order & Generate Invoice
                      </Button>
                  </DialogTrigger>
                  {placedOrder && <InvoicePreview order={placedOrder} />}
              </Dialog>
          </CardFooter>
        )}
      </Card>
    </>
  );
}
