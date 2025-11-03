
"use client";

import { type MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItemCardProps {
  item: MenuItem;
  onAddToOrder: (item: MenuItem) => void;
}

export default function MenuItemCard({ item, onAddToOrder }: MenuItemCardProps) {
  // Defensive defaults for boolean properties.
  // This ensures the card renders correctly even if data is missing from Firestore.
  const isAvailable = item.isAvailable ?? true;
  const isVeg = item.isVeg; // Rely on AppContext to provide a safe default (false)

  return (
    <Card className={cn(
      "overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:border-primary",
      !isAvailable && "bg-muted/50 cursor-not-allowed opacity-60"
    )}>
      
      <CardHeader className="flex-row items-start justify-between pb-2 pt-4 px-4">
        <CardTitle className="text-base font-headline leading-tight flex-1 pr-2">{item.name || "Unnamed Item"}</CardTitle>
        <p className="text-base font-bold text-right shrink-0">₹{(item.price || 0).toFixed(2)}</p>
      </CardHeader>

      <CardContent className="px-4 pb-4 flex-grow">
        {item.description && (
            <CardDescription className="text-xs line-clamp-2">{item.description}</CardDescription>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 mt-auto flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex gap-2 items-center">
            {/* Only render the badge if isVeg is explicitly a boolean */}
            {typeof isVeg === 'boolean' && (
              isVeg ? (
                <Badge variant="outline" className="border-green-500 text-green-600">Veg</Badge>
              ) : (
                <Badge variant="outline" className="border-red-500 text-red-600">Non-Veg</Badge>
              )
            )}
        </div>
        <Button
          size="sm"
          onClick={() => onAddToOrder(item)}
          disabled={!isAvailable}
          aria-label={`Add ${item.name} to order`}
        >
            {isAvailable ? (
                <>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add
                </>
            ) : (
                "Out of Stock"
            )}
        </Button>
      </CardFooter>
    </Card>
  );
}
