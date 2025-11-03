
"use client";

import { type MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItemCardProps {
  item: MenuItem;
  onAddToOrder: (item: MenuItem) => void;
}

export default function MenuItemCard({ item, onAddToOrder }: MenuItemCardProps) {
  const { isAvailable, isVeg, name, price } = item;

  return (
    <Card className={cn(
      "overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:border-primary",
      !isAvailable && "bg-muted/50 cursor-not-allowed opacity-60"
    )}>
      
      <CardHeader className="flex-grow p-3 pb-2">
        <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-sm font-headline leading-tight flex-1">{name || "Unnamed Item"}</CardTitle>
            <p className="text-sm font-bold text-right shrink-0">₹{(price || 0).toFixed(2)}</p>
        </div>
      </CardHeader>

      <CardFooter className="p-3 pt-2 mt-auto flex justify-between items-center">
        <div className="flex gap-2 items-center">
            {typeof isVeg === 'boolean' && (
              isVeg ? (
                <Badge variant="outline" className="border-green-500 text-green-600 text-xs px-1.5 py-0">Veg</Badge>
              ) : (
                <Badge variant="outline" className="border-red-500 text-red-600 text-xs px-1.5 py-0">Non-Veg</Badge>
              )
            )}
        </div>
        <Button
          size="sm"
          onClick={() => onAddToOrder(item)}
          disabled={!isAvailable}
          aria-label={`Add ${name} to order`}
          className="h-8"
        >
            {isAvailable ? (
                <>
                    <PlusCircle className="mr-1.5 h-4 w-4" /> Add
                </>
            ) : (
                "Unavailable"
            )}
        </Button>
      </CardFooter>
    </Card>
  );
}
