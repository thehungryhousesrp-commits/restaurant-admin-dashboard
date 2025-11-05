

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
import { type Order, type Restaurant } from "@/lib/types";
import { Share2, Copy, MessageCircle, Printer } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import InvoiceDisplay from "./InvoiceDisplay";

interface InvoicePreviewProps {
  order: Order;
  restaurant?: Restaurant | null; // Make restaurant prop optional
}

/**
 * A component to display a preview of the invoice inside a dialog.
 * This component now includes printing and WhatsApp sharing functionality.
 */
export function InvoicePreview({ order, restaurant }: InvoicePreviewProps) {
  const { toast } = useToast();
  const [shareableLink, setShareableLink] = useState('');
  const invoiceRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (typeof window !== 'undefined' && order.restaurantId) {
        setShareableLink(`${window.location.origin}/invoice/${order.restaurantId}/${order.id}`);
    }
  }, [order.id, order.restaurantId]);

  const copyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    toast({ title: "Link Copied!", description: "Invoice link copied to clipboard." });
  };
  
  const handlePrint = () => {
    window.print();
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
    <>
      {/* This is the content that will be printed, but it's hidden from view */}
      <div className="printable-area hidden">
        <InvoiceDisplay order={order} restaurant={restaurant} ref={invoiceRef} />
      </div>
      
      {/* This is the dialog content shown on screen, which will be hidden during printing */}
      <DialogContent className="sm:max-w-md p-0 flex flex-col max-h-[90vh] no-print">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle className="font-headline text-2xl text-center">Invoice Generated</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
          {/* Display the invoice visually inside the dialog */}
          <InvoiceDisplay order={order} restaurant={restaurant} />
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
                 <Button variant="outline" className="w-full" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" />
                    Print Invoice
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
    </>
  );
}
