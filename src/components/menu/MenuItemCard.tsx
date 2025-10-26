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
      "overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:border-primary",
      !item.isAvailable && "opacity-60 bg-muted/50"
    )}>
      <CardHeader className="p-0">
        <div className="relative aspect-video">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              data-ai-hint={item.imageHint}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={cn("object-cover", !item.isAvailable && "grayscale")}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted">
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          {!item.isAvailable && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <Badge variant="destructive" className="text-base px-4 py-1">Out of Stock</Badge>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 flex-grow">
        <div className="flex justify-between items-start gap-2 mb-1">
            <CardTitle className="text-lg font-headline leading-tight">{item.name}</CardTitle>
            <div className="flex gap-1.5 items-center flex-shrink-0">
                {item.isVeg ? <Vegan className="h-5 w-5 text-green-600" title="Vegetarian" /> : <div className="w-5 h-5 flex items-center justify-center"><div className="w-3 h-3 bg-red-600 rounded-sm"></div></div>}
                {item.isSpicy && <Flame className="h-5 w-5 text-orange-500" title="Spicy" />}
                {item.isChefsSpecial && <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" title="Chef's Special" />}
            </div>
        </div>
        {item.description && <CardDescription className="text-xs line-clamp-2">{item.description}</CardDescription>}
      </CardContent>
      <CardFooter className="p-4 pt-0 mt-auto flex justify-between items-center">
        <p className="text-lg font-bold">₹{item.price.toFixed(2)}</p>
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
