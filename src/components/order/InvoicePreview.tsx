"use client";

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Order } from "@/lib/types";
import Logo from "@/components/icons/Logo";
import { Download, Mail, MessageCircle } from "lucide-react";
import Image from "next/image";

interface InvoicePreviewProps {
  order: Order;
}

export function InvoicePreview({ order }: InvoicePreviewProps) {
  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <div className="flex items-center gap-4">
            <Logo className="h-10 w-10 text-primary" />
            <div>
                <DialogTitle className="font-headline text-2xl">Invoice</DialogTitle>
                <DialogDescription>Order ID: {order.id}</DialogDescription>
            </div>
        </div>
      </DialogHeader>
      
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-2 gap-4">
            <div>
                <h3 className="font-semibold mb-2">Billed To:</h3>
                <p className="text-sm text-muted-foreground">{order.customerInfo.name}</p>
                <p className="text-sm text-muted-foreground">Phone: {order.customerInfo.phone}</p>
            </div>
            <div className="text-right">
                <h3 className="font-semibold mb-2">Invoice Date:</h3>
                <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
            </div>
        </div>

        <Separator />

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Item</TableHead>
              <TableHead className="text-center">Quantity</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.name}</TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <Separator />
        
        <div className="flex justify-end">
            <div className="w-full max-w-xs space-y-2">
                <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₹{order.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{order.total.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <Separator />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <h4 className="font-semibold">Scan to Pay</h4>
            <p className="text-xs text-muted-foreground">Use any UPI app</p>
            <Image 
              data-ai-hint="qr code"
              src="https://picsum.photos/seed/qrcode/100/100" 
              alt="QR Code for payment"
              width={100}
              height={100}
              className="mt-2 rounded-md"
            />
          </div>
          <div className="flex flex-col gap-2">
             <h4 className="font-semibold text-center sm:text-right">Thank you for your business!</h4>
             <p className="text-xs text-muted-foreground text-center sm:text-right">Please find your invoice details above.</p>
          </div>
        </div>
      </div>
      
      <DialogFooter className="gap-2 sm:justify-end">
        <Button variant="outline" disabled><Download className="mr-2 h-4 w-4" />Download PDF</Button>
        <Button variant="outline" disabled><Mail className="mr-2 h-4 w-4" />Email</Button>
        <Button variant="outline" disabled><MessageCircle className="mr-2 h-4 w-4" />WhatsApp</Button>
      </DialogFooter>
    </DialogContent>
  );
}
