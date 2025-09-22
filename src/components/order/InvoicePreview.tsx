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
import { type Order } from "@/lib/types";
import { Share2, Copy, Download, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useRef } from "react";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import Image from "next/image";

interface InvoicePreviewProps {
  order: Order;
}

export function InvoicePreview({ order }: InvoicePreviewProps) {
  const roundOff = order.total - (order.subtotal + order.cgst + order.sgst);
  const { toast } = useToast();
  const [shareableLink, setShareableLink] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setShareableLink(`${window.location.origin}/invoice/${order.id}`);
    }
  }, [order.id]);

  const copyLink = () => {
    navigator.clipboard.writeText(shareableLink);
    toast({ title: "Link Copied!", description: "Invoice link copied to clipboard." });
  };
  
  const handleDownloadPdf = async () => {
    if (!invoiceRef.current) return;
    setIsDownloading(true);

    try {
      const canvas = await html2canvas(invoiceRef.current, {
        scale: 2, // Improve resolution
        backgroundColor: '#ffffff', // Ensure background is white
        allowTaint: true,
        useCORS: true, 
      });
      const imgData = canvas.toDataURL('image/png');
      
      // Calculate PDF dimensions to maintain aspect ratio
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height],
      });

      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`invoice-${order.id.slice(-6).toUpperCase()}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      toast({ title: "PDF Error", description: "Could not generate PDF.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };


  return (
    <DialogContent className="sm:max-w-md p-0 flex flex-col max-h-[90vh]">
      <DialogHeader className="p-6 pb-2 border-b">
         <DialogTitle className="font-headline text-2xl text-center">Invoice Generated</DialogTitle>
      </DialogHeader>
      
      <ScrollArea className="flex-1">
        <div ref={invoiceRef} className="p-6 bg-white">
          <div className="flex flex-col items-center gap-4 text-center mb-6">
              <div className="relative h-24 w-24">
                  <Image
                    src="/logo.png"
                    alt="The Hungry House Hub Logo"
                    width={96}
                    height={96}
                    style={{ objectFit: 'contain' }}
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
          <div className="flex space-x-2">
            <Input id="share-link" type="text" readOnly value={shareableLink} className="text-xs bg-white" />
            <Button type="button" size="icon" variant="outline" onClick={copyLink}>
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button className="w-full mt-4" onClick={handleDownloadPdf} disabled={isDownloading}>
            {isDownloading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <Download className="mr-2 h-4 w-4" />
            )}
            Download PDF
          </Button>
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
