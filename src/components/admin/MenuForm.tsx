"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { menuItemSchema } from "@/lib/schemas";
import { useAppContext } from "@/context/AppContext";
import { type MenuItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

type MenuFormValues = z.infer<typeof menuItemSchema>;

interface MenuFormProps {
  itemToEdit?: MenuItem;
  onFormSubmit: () => void;
}

export default function MenuForm({ itemToEdit, onFormSubmit }: MenuFormProps) {
  const { categories, addMenuItem, updateMenuItem } = useAppContext();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!itemToEdit;

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: itemToEdit?.name || "",
      description: itemToEdit?.description || "",
      price: itemToEdit?.price || 0,
      category: itemToEdit?.category || "",
      isAvailable: itemToEdit?.isAvailable ?? true,
      isVeg: itemToEdit?.isVeg ?? true,
      isSpicy: itemToEdit?.isSpicy ?? false,
      isChefsSpecial: itemToEdit?.isChefsSpecial ?? false,
    },
  });

  useEffect(() => {
    if (itemToEdit) {
      form.reset({
        ...itemToEdit,
        price: itemToEdit.price || 0,
        isAvailable: itemToEdit.isAvailable ?? true,
        isVeg: itemToEdit.isVeg ?? true,
        isSpicy: itemToEdit.isSpicy ?? false,
        isChefsSpecial: itemToEdit.isChefsSpecial ?? false,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        category: "",
        isAvailable: true,
        isVeg: true,
        isSpicy: false,
        isChefsSpecial: false,
      });
    }
  }, [itemToEdit, form]);

  const onSubmit = async (data: MenuFormValues) => {
    setIsSubmitting(true);
    try {
      const finalData: Omit<MenuItem, 'id'> = {
        ...data,
        // Ensure boolean values are always present
        isAvailable: data.isAvailable ?? true,
        isVeg: data.isVeg ?? true,
        isSpicy: data.isSpicy ?? false,
        isChefsSpecial: data.isChefsSpecial ?? false,
      };

      if (isEditing && itemToEdit) {
        await updateMenuItem(itemToEdit.id, finalData);
        toast({ title: "Success", description: "Menu item updated successfully." });
      } else {
        await addMenuItem(finalData);
        toast({ title: "Success", description: "New menu item added." });
      }
      onFormSubmit();
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
      console.error(error);
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-6">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name <span className="text-destructive">*</span></FormLabel>
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
                 <div className="flex items-center justify-between">
                  <FormLabel>Description <span className="text-destructive">*</span></FormLabel>
                </div>
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
                  <div className="flex items-center justify-between">
                    <FormLabel>Price (INR) <span className="text-destructive">*</span></FormLabel>
                  </div>
                  <FormControl>
                      <Input type="number" step="0.01" placeholder="499.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormLabel>Category <span className="text-destructive">*</span></FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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
                  <div className="space-y-0.5"><FormLabel>Available for Serving</FormLabel></div>
                  <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4 rounded-lg border p-3 shadow-sm">
               <FormField
                  control={form.control}
                  name="isVeg"
                  render={({ field }) => (
                      <FormItem className="space-y-3">
                          <FormLabel>Food Type</FormLabel>
                          <FormControl>
                              <RadioGroup
                              onValueChange={(value) => field.onChange(value === 'true')}
                              value={String(field.value)}
                              className="flex gap-4"
                              name="foodType"
                              id="foodType"
                              >
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl><RadioGroupItem value="true" id="isVeg-true" /></FormControl>
                                  <FormLabel htmlFor="isVeg-true" className="font-normal">Veg</FormLabel>
                              </FormItem>
                              <FormItem className="flex items-center space-x-2 space-y-0">
                                  <FormControl><RadioGroupItem value="false" id="isVeg-false" /></FormControl>
                                  <FormLabel htmlFor="isVeg-false" className="font-normal">Non-Veg</FormLabel>
                              </FormItem>
                              </RadioGroup>
                          </FormControl>
                          <FormMessage />
                      </FormItem>
                  )}
                  />
              <div className="space-y-2">
                  <Label>Other Flags</Label>
                  <div className="flex flex-col gap-3 pt-1">
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
          </div>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Save Changes' : 'Add Item'}
        </Button>
      </form>
    </Form>
  );
}
