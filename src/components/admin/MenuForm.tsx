
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { menuItemSchema } from "@/lib/schemas";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import useRealtimeData from "@/hooks/useRealtimeData"; // Import the new hook
import { collection, addDoc, updateDoc, doc } from "firebase/firestore"; // Import firestore functions
import { db } from "@/lib/firebase"; // Import db instance
import { type MenuItem, type Category } from "@/lib/types";

type MenuFormValues = z.infer<typeof menuItemSchema>;

interface MenuFormProps {
  itemToEdit?: MenuItem;
  onFormSubmit: () => void;
}

export default function MenuForm({ itemToEdit, onFormSubmit }: MenuFormProps) {
  const { data: categories, loading: categoriesLoading, error: categoriesError } = useRealtimeData<Category>('categories');
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!itemToEdit;

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      category: "",
      isAvailable: true,
      isVeg: false,
    },
  });

  useEffect(() => {
    if (itemToEdit) {
      form.reset({
        name: itemToEdit.name || "",
        description: itemToEdit.description || "",
        price: itemToEdit.price || 0,
        category: itemToEdit.category || "",
        isAvailable: typeof itemToEdit.isAvailable === 'boolean' ? itemToEdit.isAvailable : true,
        isVeg: typeof itemToEdit.isVeg === 'boolean' ? itemToEdit.isVeg : false,
      });
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        category: "",
        isAvailable: true,
        isVeg: false,
      });
    }
  }, [itemToEdit, form]);

  const onSubmit = async (data: MenuFormValues) => {
    setIsSubmitting(true);
    try {
      const finalData: Omit<MenuItem, 'id'> = {
        ...data,
        isAvailable: data.isAvailable ?? true,
        isVeg: data.isVeg ?? false,
      };

      if (isEditing && itemToEdit) {
        const docRef = doc(db, "menuItems", itemToEdit.id);
        await updateDoc(docRef, finalData);
        toast({ title: "Success", description: "Menu item updated successfully." });
      } else {
        await addDoc(collection(db, "menuItems"), finalData);
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
  
  if (categoriesLoading) {
    return <p>Loading categories...</p>;
  }

  if (categoriesError) {
    return <p>Error loading categories: {categoriesError.message}</p>;
  }

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
            <div className="rounded-lg border p-3 shadow-sm">
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
