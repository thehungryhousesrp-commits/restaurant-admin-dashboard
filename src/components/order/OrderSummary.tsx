
'use client';

import { useState, useCallback } from 'react';
import { type OrderItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, Minus, ShoppingCart } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface OrderSummaryProps {
  orderItems: OrderItem[];
  onUpdateOrder: (updatedOrder: OrderItem[]) => void;
}

const GST_RATE = 0.05; // Assuming 5% GST (2.5% CGST + 2.5% SGST)

export default function OrderSummary({ orderItems, onUpdateOrder }: OrderSummaryProps) {
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');

  // Update quantity
  const handleUpdateQuantity = useCallback(
    (itemId: string, quantity: number) => {
      if (quantity <= 0) {
        handleRemoveItem(itemId);
        return;
      }
      const updated = orderItems.map(item =>
        item.itemId === itemId ? { ...item, quantity } : item
      );
      onUpdateOrder(updated);
    },
    [orderItems, onUpdateOrder]
  );

  // Remove item from order
  const handleRemoveItem = useCallback(
    (itemId: string) => {
      const updated = orderItems.filter(item => item.itemId !== itemId);
      onUpdateOrder(updated);
    },
    [orderItems, onUpdateOrder]
  );

  // Save special instructions for an item
  const handleSaveNote = useCallback(
    (itemId: string) => {
      const updated = orderItems.map(item =>
        item.itemId === itemId ? { ...item, specialInstructions: noteText } : item
      );
      onUpdateOrder(updated);
      setEditingNoteId(null);
      setNoteText('');
    },
    [orderItems, onUpdateOrder, noteText]
  );

  // Calculate totals
  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cgst = subtotal * (GST_RATE / 2);
  const sgst = subtotal * (GST_RATE / 2);
  const total = Math.round(subtotal + cgst + sgst);

  if (orderItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-gray-100 dark:bg-gray-800/30 rounded-lg border-2 border-dashed">
        <ShoppingCart className="h-16 w-16 mb-4 text-gray-400" />
        <p className="font-medium text-lg">Your order is empty</p>
        <p className="text-sm text-center">Please add items from the menu to get started.</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-card border rounded-lg h-full flex flex-col shadow-sm flex-1">
      {/* Items List */}
      <ScrollArea className="flex-grow p-3">
        <div className="space-y-3">
            {orderItems.map(item => (
            <div key={item.itemId} className="p-3 border rounded-lg space-y-2 bg-gray-50 dark:bg-background/50">
                {/* Item Header */}
                <div className="flex justify-between items-start">
                <div className="flex-1">
                    <p className="font-semibold text-sm">{item.name}</p>
                    <p className="text-xs text-muted-foreground">₹{item.price.toFixed(2)}</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleRemoveItem(item.itemId)}
                >
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
                </div>

                {/* Quantity Controls */}
                <div className="flex items-center gap-2">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleUpdateQuantity(item.itemId, item.quantity - 1)}
                >
                    <Minus className="h-3.5 w-3.5" />
                </Button>
                <span className="w-8 text-center font-bold text-sm">{item.quantity}</span>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => handleUpdateQuantity(item.itemId, item.quantity + 1)}
                >
                    <Plus className="h-3.5 w-3.5" />
                </Button>
                <span className="ml-auto font-bold text-sm">
                    ₹{(item.price * item.quantity).toFixed(2)}
                </span>
                </div>

                {/* Special Instructions */}
                {editingNoteId === item.itemId ? (
                <div className="flex gap-2 pt-1">
                    <Input
                    placeholder="Add cooking instructions..."
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    autoFocus
                    className="text-xs h-8"
                    />
                    <Button
                    size="sm"
                    className="h-8"
                    onClick={() => handleSaveNote(item.itemId)}
                    >
                    Save
                    </Button>
                </div>
                ) : (
                <button
                    onClick={() => {
                    setEditingNoteId(item.itemId);
                    setNoteText(item.specialInstructions || '');
                    }}
                    className="text-xs text-primary hover:underline text-left w-full pt-1"
                >
                    {item.specialInstructions ? `Note: "${item.specialInstructions}"` : '+ Add Instructions'}
                </button>
                )}
            </div>
            ))}
        </div>
      </ScrollArea>

      {/* Totals */}
      <div className="p-4 border-t bg-slate-50 dark:bg-background/70 rounded-b-lg space-y-2 mt-auto">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal:</span>
          <span>₹{subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>CGST (2.5%):</span>
          <span>₹{cgst.toFixed(2)}</span>
        </div>
         <div className="flex justify-between text-xs text-muted-foreground">
          <span>SGST (2.5%):</span>
          <span>₹{sgst.toFixed(2)}</span>
        </div>
        <Separator className="my-2"/>
        <div className="flex justify-between font-bold text-lg">
          <span>Total:</span>
          <span className="text-primary">₹{total.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
