
"use client";

import React from 'react';
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Order, type Restaurant } from "@/lib/types";
import Image from "next/image";

interface InvoiceDisplayProps {
  order: Order;
  // Restaurant prop is now optional, as the logo can come from the order itself
  restaurant?: Restaurant | null;
}

const InvoiceDisplay = React.forwardRef<HTMLDivElement, InvoiceDisplayProps>(({ order, restaurant }, ref) => {
    const roundOff = order.total - (order.subtotal + order.cgst + order.sgst);
    
    // Prioritize logo from the order, then from the restaurant prop, then fallback to the Reskot logo
    const logoUrl = order.restaurantLogoUrl || restaurant?.logoUrl || "/logo.png";
    // Prioritize name from the order, then from restaurant prop, then fallback to a generic name
    const restaurantName = order.restaurantName || restaurant?.name || "Unnamed Restaurant";

    return (
        <div ref={ref} className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6 font-sans text-black">
            <div className="flex flex-col items-center gap-4 text-center mb-6">
                <div className="relative h-24 w-24">
                  <Image
                    src={logoUrl}
                    alt={restaurantName}
                    fill
                    style={{ objectFit: 'contain' }}
                    priority
                    // Important for html2canvas to render external images
                    crossOrigin="anonymous"
                  />
                </div>
                <div className="space-y-0.5">
                    <h1 className="font-headline text-3xl">{restaurantName}</h1>
                    <p className="text-xs text-gray-600">
                        62/A Netaji Subhas Avenue, Serampore, Hooghly, 712201
                    </p>
                    <p className="text-xs text-gray-600">
                        Ph: 6289472216 | Email: thehungryhouse.srp@gmail.com
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                    <h3 className="font-semibold mb-1">Billed To</h3>
                    <p className="font-medium">{order.customerInfo.name}</p>
                    <p className="text-gray-600">{order.customerInfo.phone}</p>
                </div>
                <div className="text-right space-y-0.5">
                    <p><span className="font-semibold">Invoice #:</span> {order.id.slice(-6).toUpperCase()}</p>
                    <p><span className="font-semibold">Date:</span> {new Date(order.createdAt.seconds * 1000).toLocaleDateString()}</p>
                    <p><span className="font-semibold">Time:</span> {new Date(order.createdAt.seconds * 1000).toLocaleTimeString()}</p>
                </div>
            </div>

            <Separator className="my-4 bg-gray-300" />
            
            <h2 className="text-lg font-bold text-center font-headline tracking-wider mb-4">E-BILL</h2>

            <Table className="text-sm">
                <TableHeader>
                    <TableRow className="border-b border-gray-300">
                        <TableHead className="w-1/2 text-black font-semibold">Item</TableHead>
                        <TableHead className="text-center text-black font-semibold">Qty</TableHead>
                        <TableHead className="text-right text-black font-semibold">Rate</TableHead>
                        <TableHead className="text-right text-black font-semibold">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {order.items.map((item, index) => (
                        <TableRow key={index} className="border-b border-gray-200">
                            <TableCell className="font-medium py-1.5">{item.name}</TableCell>
                            <TableCell className="text-center py-1.5">{item.quantity}</TableCell>
                            <TableCell className="text-right py-1.5">₹{item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right py-1.5">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            
            <Separator className="my-4 bg-gray-300" />
            
            <div className="flex justify-end mb-6">
                <div className="w-full max-w-[220px] space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Subtotal</span>
                        <span>₹{order.subtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">CGST @ 2.5%</span>
                        <span>₹{order.cgst.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-gray-600">SGST @ 2.5%</span>
                        <span>₹{order.sgst.toFixed(2)}</span>
                    </div>
                    {Math.abs(roundOff) > 0.001 && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">Round Off</span>
                            <span>{roundOff > 0 ? '+' : '-'}₹{Math.abs(roundOff).toFixed(2)}</span>
                        </div>
                    )}
                    <Separator className="my-2 bg-gray-300"/>
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>₹{order.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="w-full text-center">
                <h4 className="font-semibold font-headline text-lg">Thank you for choosing us!</h4>
                <p className="text-sm text-gray-600">Please Visit Again</p>
            </div>
        </div>
    );
});

InvoiceDisplay.displayName = 'InvoiceDisplay';
export default InvoiceDisplay;
