"use client";

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Order } from "@/lib/types";
import { Download, Mail, MessageCircle, Printer } from "lucide-react";
import Image from "next/image";
import { ScrollArea } from "@/components/ui/scroll-area";

interface InvoicePreviewProps {
  order: Order;
}

export function InvoicePreview({ order }: InvoicePreviewProps) {
  const roundOff = order.total - (order.subtotal + order.cgst + order.sgst);

  return (
    <DialogContent className="sm:max-w-md p-0 flex flex-col max-h-[90vh]">
      <DialogHeader className="p-6 pb-2">
        <div className="flex flex-col items-center gap-2 text-center">
            <Image 
                src="https://i.ibb.co/j7YWcvy/Picsart-25-07-02-21-51-50-642-1.png" 
                alt="The Hungry House Hub Logo"
                width={60}
                height={60}
            />
            <div className="space-y-0.5">
              <DialogTitle className="font-headline text-2xl">The Hungry House</DialogTitle>
              <p className="text-xs text-muted-foreground">
                62/A Netaji Subhas Avenue, Serampore, Hooghly, 712201
              </p>
              <p className="text-xs text-muted-foreground">
                Ph: 6289472216 | Email: thehungryhouse.srp@gmail.com
              </p>
            </div>
        </div>
      </DialogHeader>
      
      <ScrollArea className="flex-1 px-6">
        <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                    <h3 className="font-semibold mb-1">Billed To</h3>
                    <p className="font-medium">{order.customerInfo.name}</p>
                    <p className="text-muted-foreground">{order.customerInfo.phone}</p>
                </div>
                <div className="text-right space-y-0.5">
                    <p><span className="font-semibold">Invoice #:</span> {order.id.slice(-6).toUpperCase()}</p>
                    <p><span className="font-semibold">Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                    <p><span className="font-semibold">Time:</span> {new Date(order.createdAt).toLocaleTimeString()}</p>
                </div>
            </div>

            <Separator />
            
            <h2 className="text-lg font-bold text-center font-headline tracking-wider">E-BILL</h2>

            <Table className="text-xs">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-1/2 h-8">Item</TableHead>
                  <TableHead className="text-center h-8">Qty</TableHead>
                  <TableHead className="text-right h-8">Rate</TableHead>
                  <TableHead className="text-right h-8">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((item) => (
                  <TableRow key={item.id} className="h-8">
                    <TableCell className="font-medium py-1">{item.name}</TableCell>
                    <TableCell className="text-center py-1">{item.quantity}</TableCell>
                    <TableCell className="text-right py-1">₹{item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right py-1">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            
            <Separator />
            
            <div className="flex justify-end">
                <div className="w-full max-w-[200px] space-y-1 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span>₹{order.subtotal.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">CGST @ 2.5%</span>
                        <span>₹{order.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">SGST @ 2.5%</span>
                        <span>₹{order.sgst.toFixed(2)}</span>
                    </div>
                    {roundOff !== 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Round Off</span>
                        <span>{roundOff > 0 ? '+' : '-'}₹{Math.abs(roundOff).toFixed(2)}</span>
                      </div>
                    )}
                    <Separator className="my-1"/>
                    <div className="flex justify-between font-bold text-base">
                        <span>Total</span>
                        <span>₹{order.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>
        </div>
      </ScrollArea>
      
      <DialogFooter className="p-6 pt-4 border-t bg-background">
        <div className="w-full text-center">
            <h4 className="font-semibold font-headline text-base">Thank you for choosing us!</h4>
            <p className="text-xs text-muted-foreground">Please Visit Again</p>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
