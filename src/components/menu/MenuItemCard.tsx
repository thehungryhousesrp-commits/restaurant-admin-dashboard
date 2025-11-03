
"use client";

import { useRef } from "react";
import { type MenuItem } from "@/lib/types";
import { Card, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MenuItemCardProps {
  item: MenuItem;
  onAnimateAndAdd: (item: MenuItem, rect: DOMRect) => void;
}

export default function MenuItemCard({ item, onAnimateAndAdd }: MenuItemCardProps) {
  const { isAvailable, isVeg, name, price } = item;
  const cardRef = useRef<HTMLDivElement>(null);

  const handleCardClick = () => {
    if (isAvailable && cardRef.current) {
        const rect = cardRef.current.getBoundingClientRect();
        onAnimateAndAdd(item, rect);
    }
  };

  return (
    <Card
      ref={cardRef}
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
        <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-left shrink-0">₹{(price || 0).toFixed(2)}</p>
             {typeof isVeg === 'boolean' && (
              <span 
                className={cn("h-3 w-3 rounded-full", isVeg ? "bg-green-600" : "bg-red-600")}
                title={isVeg ? 'Vegetarian' : 'Non-Vegetarian'}
              ></span>
            )}
        </div>
        
        <div className="flex items-center gap-2">
            {!isAvailable && (
              <span className="text-xs text-muted-foreground font-semibold">Unavailable</span>
            )}
        </div>
      </CardFooter>
    </Card>
  );
}
