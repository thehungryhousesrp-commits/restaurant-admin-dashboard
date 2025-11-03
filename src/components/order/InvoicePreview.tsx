
"use client";

import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Order } from "@/lib/types"; // The Order type here should be the old one. We need to check if this preview is still used.
import { Share2, Copy, MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface InvoicePreviewProps {
  order: Order;
}

/**
 * A component to display a preview of the invoice inside a dialog.
 * The PDF generation logic has been REMOVED from this component to avoid redundancy.
 * The primary invoice generation is now handled by the main [orderId]/page.tsx.
 * This component now focuses on displaying the preview and sharing via WhatsApp.
 */
export function InvoicePreview({ order }: InvoicePreviewProps) {
  const { toast } = useToast();
  const [shareableLink, setShareableLink] = useState('');
  const invoiceRef = useRef<HTMLDivElement>(null); // Still needed for the display

  // Note: The `order` prop for this component might be using the OLD data structure.
  // This needs to be verified. Assuming it uses the old structure with `customerInfo` and detailed tax.
  const roundOff = order.total - (order.subtotal + order.cgst + order.sgst);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setShareableLink(`${window.location.origin}/invoice/${order.id}`);
    }
  }, [order.id]);

  const copyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    toast({ title: "Link Copied!", description: "Invoice link copied to clipboard." });
  };

  const validatePhoneNumber = (phone: string) => {
    const phoneRegex = /^(?:\+91)?[ -]?\d{10}$/;
    return phoneRegex.test(phone.trim());
  };

  const handleShareOnWhatsApp = () => {
    const rawPhoneNumber = order.customerInfo.phone;
    if (!validatePhoneNumber(rawPhoneNumber)) {
        toast({ title: "Invalid Phone Number", description: "Cannot share on WhatsApp. The customer's phone number must be a valid 10-digit number.", variant: "destructive" });
        return;
    }

    const customerName = order.customerInfo.name;
    const totalAmount = order.total.toFixed(2);
    const orderDate = new Date(order.createdAt).toLocaleString('en-IN', {
      dateStyle: 'short',
      timeStyle: 'short',
    });
    
    const googleReviewLink = "https://g.page/r/Ca0dWH733XyFEBM/review";

    const message = `Dear ${customerName},\n\nThank you for your recent order at The Hungry House! Your invoice is now available.\n\nAmount : ₹${totalAmount}\nDate : ${orderDate}\n\nView Invoice : ${shareableLink}\n\n---\n\nHow was your experience? We'd love your feedback!\n⭐ Rate us on Google:\n${googleReviewLink}\n\nWe appreciate your support! 🙏`;
    
    let phoneNumber = rawPhoneNumber.replace(/[\s+()-]/g, '');
    if (phoneNumber.length === 10) {
      phoneNumber = `91${phoneNumber}`;
    }

    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    
    window.open(whatsappUrl, '_blank');
  };

  return (
    <DialogContent className="sm:max-w-md p-0 flex flex-col max-h-[90vh]">
      <DialogHeader className="p-6 pb-2 border-b">
         <DialogTitle className="font-headline text-2xl text-center">Invoice Generated</DialogTitle>
      </DialogHeader>
      
      <ScrollArea className="flex-1">
        {/* This `ref` is kept for potential future use, e.g., printing this specific view */}
        <div ref={invoiceRef} className="p-6 bg-white">
          <div className="flex flex-col items-center gap-4 text-center mb-6">
              <div className="relative h-24 w-24">
                  <Image
                    src="/Picsart_25-07-02_21-51-50-642 (1).png"
                    alt="The Hungry House Hub Logo"
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                  />
                </div>
              <div className="space-y-0.5">
                <h3 className="font-headline text-2xl">The Hungry House Hub</h3>
                <p className="text-xs text-muted-foreground">
                  62/A Netaji Subhas Avenue, Serampore, Hooghly, 712201
                </p>
                <p className="text-xs text-muted-foreground">
                  Ph: 6289472216 | Email: thehungryhouse.srp@gmail.com
                </p>
              </div>
          </div>
        
          <div className="grid grid-cols-2 gap-4 text-sm mb-4">
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
          
          <h2 className="text-lg font-bold text-center font-headline tracking-wider my-4">E-BILL</h2>

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
              {order.items.map((item, index) => (
                <TableRow key={index} className="h-8">
                  <TableCell className="font-medium py-1">{item.name}</TableCell>
                  <TableCell className="text-center py-1">{item.quantity}</TableCell>
                  <TableCell className="text-right py-1">₹{item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-right py-1">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <Separator className="my-4" />
          
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
                {roundOff.toFixed(2) !== '0.00' && roundOff.toFixed(2) !== '-0.00' && (
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

      <div className="px-6 py-4 border-t bg-slate-50">
          <div className="flex items-center gap-2 mb-3">
              <Share2 className="h-4 w-4 text-muted-foreground" />
              <label htmlFor="share-link" className="text-sm font-medium">
                Shareable Link
              </label>
          </div>
          <div className="flex space-x-2 mb-4">
            <Input id="share-link" type="text" readOnly value={shareableLink} className="text-xs bg-white" />
            <Button type="button" size="icon" variant="outline" onClick={copyLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
              <Button className="w-full" onClick={handleShareOnWhatsApp} style={{ backgroundColor: '#25D366', color: 'white' }}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Share on WhatsApp
              </Button>
          </div>
        </div>
      
      <DialogFooter className="p-4 border-t">
        <div className="w-full text-center">
            <h4 className="font-semibold font-headline text-base">Thank you for choosing us!</h4>
            <p className="text-sm text-muted-foreground">Please Visit Again</p>
        </div>
      </DialogFooter>
    </DialogContent>
  );
}
