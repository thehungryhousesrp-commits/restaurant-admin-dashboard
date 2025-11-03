
"use client";

import { type MenuItem } from "@/lib/types";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
        "overflow-hidden flex flex-col transition-all duration-200 group",
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
      <CardHeader className="flex-grow p-3 text-center">
        <CardTitle className="text-sm font-headline leading-tight">{name || "Unnamed Item"}</CardTitle>
      </CardHeader>

      <CardFooter className="p-3 pt-2 mt-auto flex justify-between items-center bg-card-foreground/5 dark:bg-card-foreground/10">
        <p className="text-sm font-bold text-left shrink-0">₹{(price || 0).toFixed(2)}</p>
        
        <div className="flex items-center gap-2">
            {typeof isVeg === 'boolean' && (
              <span 
                className={cn("h-3 w-3 rounded-full", isVeg ? "bg-green-600" : "bg-red-600")}
                title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
              ></span>
            )}
            
            {isAvailable ? (
              <div className="flex items-center text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <PlusCircle className="h-4 w-4" />
              </div>
            ) : (
              <span className="text-xs text-muted-foreground font-semibold">Unavailable</span>
            )}
        </div>
      </CardFooter>
    </Card>
  );
}
