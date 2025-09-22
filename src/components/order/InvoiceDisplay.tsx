"use client";

import React from 'react';
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { type Order } from "@/lib/types";
import Image from 'next/image';

interface InvoiceDisplayProps {
  order: Order;
}

// Base64 encoded logo to prevent CORS issues with html2canvas
const logoDataUri = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAO4AAADUCAMAAABs03X/AAAAkFBMVEX////AAD/pKT/ycnJycl/f3//uLj/tLT/LS3/GBj/ERH/+/v/jIz/wcH/8PD/ubn/1dX/4uL/6+v/aWn/DAz/MDD/rq7/oKD/d3f/U1P/RUX/h4f/fn7/iIj/goL/lJT/w8P/yMj/t7f/3t7/6ur/9PT/Kir/WFj/Z2f/c3P/fX3/n5//qan/z8//2dn/5ub/7u7/+vr/ICD/Pz8018KZAAAIq0lEQVR4nO2d63qiMBCGSyEQBERA8YKKvVbr/V/sVbfeT6wBiSEkh+xz/s5nJvPgzZtLCElMa9rSkpY2sYc97GEP+9jDHvawe8P0Ea+F/wO8b+u1f/uV9++sA3s4g//4f8xf+f+v3/j9+v5+AAiA+i+/8fv+n+f5H8/y/4w/8//1/X0BCICK71/5/s8z/v85z/8y/8f8X9/fH4AAYO39K9/f/1n/d/7P/zD/x/xf398fgACg8P4V8M8G//9/nv9h/o/5v76/PwABwML7V74f/3n+j/k/5v/6/v4ABAQ771/5/s8z/v85z/8y/8f8X9/fH4AA4EH7V74f/3n+j/k/5v/6/v4ABAQr71/5/s8z/v85z/8y/8f8X9/fH4AAYEv7V74f/3n+j/k/5v/6/v4ABARb3r/y/Z9n/P9znv9l/o/5v76/PwABwD/tX/n+zzP+/znP/zL/x/xf398fgAAgKfuXvn+z3P+vznP/zL/x/xf398fgACAV+5e+X7/5/k/5v+Y/+v7+wMQAPy2e+X7P8/4/uc8/8v8H/N/fX9/AAKA37V75fs/z/j+5zz/y/wf8399f38AAoC/7V75fs/zf57n/5h/Y/6v7+8PQADwH7tXvr/zDP+/znP/zL/x/xf398fgADg0f1e+f7PM/7/Oc//Mv/H/F/f3x+AAGDx/VfBvxt8/+c5/8v8H/N/fX9/AAKA1fdfeP8f8399f38AAsC1+1e+//MM/7/Oc//Mv/H/F/f3x+AAOD6/VfBvxt8/+c5/8v8H/N/fX9/AAKAq/df+P7PM/7/Oc//Mv/H/F/f3x+AAODm/VfBvxt8/+c5/8v8H/N/fX9/AAKA+/df+P7PM/7/Oc//Mv/H/F/f3x+AAODw/VfBvxt8/+c5/8v8H/N/fX9/AAKA0/df+P7PM/7/Oc//Mv/H/F/f3x+AAGDu/VfBvxt8/+c5/8v8H/N/fX9/AAKA9/df+P7PM/7/Oc//Mv/H/F/f3x+AAOD//VfBvxt8/+c5/8v8H/N/fX9/AAKAV+/+4/v7AxAAvHr3j+/vD0AA8OrdP76/PwABwKt3//j+/gAEAO9+/+f5P8/zP8zzP8z/M//H/F/f3x+AAODdW99/Yv6v7+8PQADw7tZ335i/6/v7AxAA3Lu13Tem/Pr+8gAEAG/e+u5b0359f/kABACv3/juG9N+fX/5AAQA79747lvTfn1/+QAEAG/c+u5b0359f/kABAAv3/juG9N+fX/5AAQAb9z67lvTfn1/+QAEAC/e+u5b0359f/kABAC33/juW9N+fX/5AAQAb9z67lvTfn1/+QAEAC/d+u5b0359f/kABAC33PjuW9N+fX/5AAQAr9z67lvTfn1/+QAEAK/d+u5b0359f/kABACv3/ruW9N+fX/1AAQAr9v67lvTfn1/+QAEAO/c+u5b0359f/kABACv3/juW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/1AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/1AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/1AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/1AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/1AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+uJACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1/+QAEAK/e+u5b0359f/kABACv3vruW9N+fX/5AAQAr9767lvTfn1G/D6/vIABIDe+u5b0/5+ff94AAJA7r1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT/n59/3gAAkDuPW9N+6d8+v7yAASA3PruW9P+fn3/eAACQO49b037p3z6/vIABIDc+u5b0/5+ff94AAJA7j1vTfunfPr+8gAEgNz67lvT disorganized input and output.
const InvoiceDisplay = React.forwardRef<HTMLDivElement, InvoiceDisplayProps>(({ order }, ref) => {
    const roundOff = order.total - (order.subtotal + order.cgst + order.sgst);

    return (
        <div ref={ref} className="w-full max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
            <div className="flex flex-col items-center gap-2 text-center mb-6">
                <img 
                    src={logoDataUri} 
                    alt="The Hungry House Hub Logo"
                    width="80"
                    height="80"
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
    
