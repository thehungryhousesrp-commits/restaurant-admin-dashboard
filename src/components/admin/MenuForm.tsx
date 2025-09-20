"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { menuItemSchema } from "@/lib/schemas";
import { useAppContext } from "@/context/AppContext";
import { type MenuItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";

type MenuFormValues = z.infer<typeof menuItemSchema>;

interface MenuFormProps {
  itemToEdit?: MenuItem;
  onFormSubmit: () => void;
}

export default function MenuForm({ itemToEdit, onFormSubmit }: MenuFormProps) {
  const { categories, addMenuItem, updateMenuItem } = useAppContext();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(itemToEdit?.imageUrl || null);
  
  const isEditing = !!itemToEdit;

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: itemToEdit?.name || "",
      description: itemToEdit?.description || "",
      price: itemToEdit?.price || 0,
      category: itemToEdit?.category || "",
      isAvailable: itemToEdit?.isAvailable ?? true,
      isVeg: itemToEdit?.isVeg ?? false,
      isSpicy: itemToEdit?.isSpicy ?? false,
      isChefsSpecial: itemToEdit?.isChefsSpecial ?? false,
      image: undefined,
    },
  });

  const imageRef = form.register("image");

  useEffect(() => {
    if (itemToEdit) {
      form.reset({
        name: itemToEdit.name,
        description: itemToEdit.description,
        price: itemToEdit.price,
        category: itemToEdit.category,
        isAvailable: itemToEdit.isAvailable,
        isVeg: itemToEdit.isVeg,
        isSpicy: itemToEdit.isSpicy,
        isChefsSpecial: itemToEdit.isChefsSpecial,
        image: undefined,
      });
      setImagePreview(itemToEdit.imageUrl);
    }
  }, [itemToEdit, form]);

  const onSubmit = (data: MenuFormValues) => {
    try {
      if (isEditing && itemToEdit) {
        // @ts-ignore - a bit of a hack to make the types work
        updateMenuItem(itemToEdit.id, data);
        toast({ title: "Success", description: "Menu item updated successfully." });
      } else {
        // @ts-ignore
        addMenuItem(data);
        toast({ title: "Success", description: "New menu item added." });
      }
      onFormSubmit();
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
      console.error(error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl><Input placeholder="Margherita Pizza" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl><Textarea placeholder="Classic Italian pizza..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Price</FormLabel>
                    <FormControl><Input type="number" step="0.01" placeholder="12.99" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem className="flex-grow">
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a category" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="isAvailable"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5"><FormLabel>Available</FormLabel></div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
              <div className="flex gap-4">
                <FormField control={form.control} name="isVeg" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id="isVeg" /></FormControl>
                      <Label htmlFor="isVeg" className="font-normal">Veg</Label>
                    </FormItem>
                )} />
                 <FormField control={form.control} name="isSpicy" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id="isSpicy" /></FormControl>
                      <Label htmlFor="isSpicy" className="font-normal">Spicy</Label>
                    </FormItem>
                )} />
                 <FormField control={form.control} name="isChefsSpecial" render={({ field }) => (
                    <FormItem className="flex items-center gap-2 space-y-0">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} id="isChefsSpecial" /></FormControl>
                      <Label htmlFor="isChefsSpecial" className="font-normal">Chef's Special</Label>
                    </FormItem>
                )} />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Menu Image</FormLabel>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/*"
                      {...imageRef}
                      onChange={(e) => {
                        field.onChange(e.target.files);
                        if (e.target.files && e.target.files[0]) {
                          setImagePreview(URL.createObjectURL(e.target.files[0]));
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>PNG, JPG, WEBP. Max 5MB.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            {imagePreview && (
              <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                <Image src={imagePreview} alt="Preview" fill className="object-cover" />
              </div>
            )}
          </div>
        </div>
        <Button type="submit">{isEditing ? 'Save Changes' : 'Add Item'}</Button>
      </form>
    </Form>
  );
}

// Checkbox component needed for the form
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground",
      className
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator
      className={cn("flex items-center justify-center text-current")}
    >
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

