"use client";

import Image from "next/image";
import { type MenuItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Vegan, Flame, Star, PlusCircle, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface MenuItemCardProps {
  item: MenuItem;
  onAddToOrder: (item: MenuItem) => void;
}

export default function MenuItemCard({ item, onAddToOrder }: MenuItemCardProps) {
  return (
    <Card className={cn(
      "overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg",
      !item.isAvailable && "opacity-50 bg-muted"
    )}>
      <CardHeader className="p-0">
        <div className="relative aspect-video">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              data-ai-hint={item.imageHint}
              fill
              className={cn("object-cover", !item.isAvailable && "grayscale")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {!item.isAvailable && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Badge variant="destructive" className="text-lg">Out of Stock</Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-lg font-headline mb-1">{item.name}</CardTitle>
            <div className="flex gap-2 items-center text-primary">
                {item.isVeg && <Vegan className="h-5 w-5" title="Vegetarian" />}
                {item.isSpicy && <Flame className="h-5 w-5 text-orange-500" title="Spicy" />}
                {item.isChefsSpecial && <Star className="h-5 w-5 text-yellow-400" title="Chef's Special" />}
            </div>
        </div>
        <CardDescription className="text-sm">{item.description}</CardDescription>
      </CardContent>
      <CardFooter className="p-4 pt-0 flex justify-between items-center">
        <p className="text-lg font-semibold">₹{item.price.toFixed(2)}</p>
        <Button
          size="sm"
          onClick={() => onAddToOrder(item)}
          disabled={!item.isAvailable}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Add to Order
        </Button>
      </CardFooter>
    </Card>
  );
}
