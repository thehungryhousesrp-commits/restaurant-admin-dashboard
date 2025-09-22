"use client";

import React from 'react';
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Order } from "@/lib/types";
import { useAppContext } from '@/context/AppContext';

interface InvoiceDisplayProps {
  order: Order;
}

const InvoiceDisplay = React.forwardRef<HTMLDivElement, InvoiceDisplayProps>(({ order }, ref) => {
    const { logoDataUri } = useAppContext();
    const roundOff = order.total - (order.subtotal + order.cgst + order.sgst);

    return (
        <div ref={ref} className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col items-center gap-2 text-center mb-6">
                <img 
                    src={logoDataUri} 
                    alt="The Hungry House Hub Logo"
                    width="80"
                    height="80"
                    style={{ objectFit: 'contain' }}
                />
                <div className="space-y-0.5">
                    <h1 className="font-headline text-3xl">The Hungry House Hub</h1>
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

            <Separator className="my-4" />
            
            <h2 className="text-lg font-bold text-center font-headline tracking-wider mb-4">E-BILL</h2>

            <Table className="text-sm">
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-1/2">Item</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {order.items.map((item, index) => (
                        <TableRow key={index}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right">₹{(item.price * item.quantity).toFixed(2)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
            
            <Separator className="my-4" />
            
            <div className="flex justify-end mb-6">
                <div className="w-full max-w-[220px] space-y-2 text-sm">
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
                    <Separator className="my-2"/>
                    <div className="flex justify-between font-bold text-lg">
                        <span>Total</span>
                        <span>₹{order.total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="w-full text-center">
                <h4 className="font-semibold font-headline text-lg">Thank you for choosing us!</h4>
                <p className="text-sm text-muted-foreground">Please Visit Again</p>
            </div>
        </div>
    );
});

InvoiceDisplay.displayName = 'InvoiceDisplay';
export default InvoiceDisplay;
    
