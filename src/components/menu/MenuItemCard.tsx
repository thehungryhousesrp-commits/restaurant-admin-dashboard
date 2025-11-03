
"use client";

import { type MenuItem } from "@/lib/types";
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

  const handleCardClick = () => {
    if (isAvailable) {
      onAddToOrder(item);
    }
  };

  return (
    <Card 
      onClick={handleCardClick}
      className={cn(
        "overflow-hidden flex flex-col transition-all duration-200",
        isAvailable 
          ? "cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-primary" 
          : "bg-muted/50 cursor-not-allowed opacity-60"
      )}
      role={isAvailable ? "button" : "region"}
      aria-label={isAvailable ? `Add ${name} to order` : `${name} (unavailable)`}
      tabIndex={isAvailable ? 0 : -1}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && isAvailable) {
          e.preventDefault();
          handleCardClick();
        }
      }}
    >
      
      <CardHeader className="flex-grow p-3 pb-2">
        <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-sm font-headline leading-tight flex-1">{name || "Unnamed Item"}</CardTitle>
            {typeof isVeg === 'boolean' && (
              isVeg ? (
                <Badge variant="outline" className="border-green-500 text-green-600 text-xs px-1.5 py-0">Veg</Badge>
              ) : (
                <Badge variant="outline" className="border-red-500 text-red-600 text-xs px-1.5 py-0">Non-Veg</Badge>
              )
            )}
        </div>
      </CardHeader>

      <CardFooter className="p-3 pt-2 mt-auto flex justify-between items-center">
        <p className="text-sm font-bold text-left shrink-0">₹{(price || 0).toFixed(2)}</p>
        
        {isAvailable ? (
          <div className="flex items-center text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <PlusCircle className="h-4 w-4" />
          </div>
        ) : (
           <Badge variant="secondary" className="text-xs">Unavailable</Badge>
        )}
      </CardFooter>
    </Card>
  );
}
