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
import { Download, Mail, MessageCircle } from "lucide-react";
import Image from "next/image";

interface InvoicePreviewProps {
  order: Order;
}

export function InvoicePreview({ order }: InvoicePreviewProps) {
  const roundOff = order.total - (order.subtotal + order.cgst + order.sgst);

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <div className="flex flex-col items-center gap-4 text-center">
            <Image 
                src="https://i.ibb.co/j7YWcvy/Picsart-25-07-02-21-51-50-642-1.png" 
                alt="The Hungry House Hub Logo"
                width={80}
                height={80}
            />
            <div className="space-y-1">
              <DialogTitle className="font-headline text-3xl">The Hungry House</DialogTitle>
              <p className="text-sm text-muted-foreground">
                62/A Netaji Subhas Avenue, Serampore, Hooghly, 712201
              </p>
              <p className="text-xs text-muted-foreground">
                Ph: 6289472216 | Email: thehungryhouse.srp@gmail.com
              </p>
            </div>
        </div>
      </DialogHeader>
      
      <div className="grid gap-6 py-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
                <h3 className="font-semibold mb-2 text-base">Billed To</h3>
                <p className="font-medium">{order.customerInfo.name}</p>
                <p className="text-muted-foreground">{order.customerInfo.phone}</p>
            </div>
            <div className="text-right space-y-1">
                <p><span className="font-semibold">Invoice #:</span> {order.id.slice(-6).toUpperCase()}</p>
                <p><span className="font-semibold">Date:</span> {new Date(order.createdAt).toLocaleDateString()}</p>
                <p><span className="font-semibold">Time:</span> {new Date(order.createdAt).toLocaleTimeString()}</p>
            </div>
        </div>

        <Separator />
        
        <h2 className="text-xl font-bold text-center font-headline tracking-wider">E-BILL</h2>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-1/2">Item</TableHead>
              <TableHead className="text-center">Qty</TableHead>
              <TableHead className="text-right">Rate</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {order.items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="text-center">{item.quantity}</TableCell>
                <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                <TableCell className="text-right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <Separator />
        
        <div className="flex justify-end">
            <div className="w-full max-w-sm space-y-2 text-sm">
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
                <Separator className="my-2"/>
                <div className="flex justify-between font-bold text-lg">
                    <span>Total Payable</span>
                    <span>₹{order.total.toFixed(2)}</span>
                </div>
            </div>
        </div>

        <Separator />

        <div className="text-center">
            <h4 className="font-semibold font-headline text-lg">Thank you for choosing us!</h4>
            <p className="text-xs text-muted-foreground">Please Visit Again</p>
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
