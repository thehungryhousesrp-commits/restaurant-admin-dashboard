"use client";

import { type MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Vegan, Flame, Star, PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItemCardProps {
  item: MenuItem;
  onAddToOrder: (item: MenuItem) => void;
}

export default function MenuItemCard({ item, onAddToOrder }: MenuItemCardProps) {
  return (
    <Card className={cn(
      "overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:border-primary",
      !item.isAvailable && "bg-muted/50 cursor-not-allowed"
    )}>
      
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-base font-headline leading-tight">{item.name}</CardTitle>
            <div className="flex gap-1.5 items-center flex-shrink-0">
                {item.isVeg ? <Vegan className="h-5 w-5 text-green-600" title="Vegetarian" /> : <div title="Non-Vegetarian" className="w-5 h-5 flex items-center justify-center"><div className="w-3 h-3 bg-red-600 rounded-sm border border-red-800"></div></div>}
                {item.isSpicy && <Flame className="h-5 w-5 text-orange-500" title="Spicy" />}
                {item.isChefsSpecial && <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" title="Chef's Special" />}
            </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-4 flex-grow">
        {item.description && <CardDescription className="text-xs line-clamp-2">{item.description}</CardDescription>}
         {!item.isAvailable && (
            <Badge variant="destructive" className="mt-2 text-xs">Out of Stock</Badge>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 mt-auto flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
        <p className="text-base font-bold">₹{item.price.toFixed(2)}</p>
        <Button
          size="sm"
          onClick={() => onAddToOrder(item)}
          disabled={!item.isAvailable}
          aria-label={`Add ${item.name} to order`}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add
        </Button>
      </CardFooter>
    </Card>
  );
}
