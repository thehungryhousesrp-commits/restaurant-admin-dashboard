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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { menuItemSchema } from "@/lib/schemas";
import { useAppContext } from "@/context/AppContext";
import { type MenuItem } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Wand2, Loader2, Sparkles, UploadCloud } from "lucide-react";
import { generateDescription } from "@/ai/flows/generateDescription";
import { suggestPrice } from "@/ai/flows/suggestPrice";
import { Checkbox } from "@/components/ui/checkbox";

type MenuFormValues = z.infer<typeof menuItemSchema>;

interface MenuFormProps {
  itemToEdit?: MenuItem;
  onFormSubmit: () => void;
}

export default function MenuForm({ itemToEdit, onFormSubmit }: MenuFormProps) {
  const { categories, addMenuItem, updateMenuItem } = useAppContext();
  const { toast } = useToast();
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!itemToEdit;

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(menuItemSchema),
    defaultValues: {
      name: itemToEdit?.name || "",
      description: itemToEdit?.description || "",
      price: itemToEdit?.price || 0,
      category: itemToEdit?.category || "",
      imageUrl: itemToEdit?.imageUrl || "",
      isAvailable: itemToEdit?.isAvailable ?? true,
      isVeg: itemToEdit?.isVeg ?? false,
      isSpicy: itemToEdit?.isSpicy ?? false,
      isChefsSpecial: itemToEdit?.isChefsSpecial ?? false,
    },
  });

  const itemName = form.watch("name");
  const itemDescription = form.watch("description");
  const imageUrl = form.watch("imageUrl");

  useEffect(() => {
    if (itemToEdit) {
      form.reset(itemToEdit);
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        category: "",
        imageUrl: "",
        isAvailable: true,
        isVeg: false,
        isSpicy: false,
        isChefsSpecial: false,
      });
    }
  }, [itemToEdit, form]);

  const handleGenerateDescription = async () => {
    if (!itemName) {
      toast({
        title: "Item Name Required",
        description: "Please enter an item name before generating a description.",
        variant: "destructive",
      });
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const result = await generateDescription({ itemName });
      if (result.description) {
        form.setValue("description", result.description, { shouldValidate: true });
        toast({ title: "Description Generated!", description: "The AI has written a new description." });
      }
    } catch (error) {
      console.error("Error generating description:", error);
      toast({ title: "AI Error", description: "Could not generate description.", variant: "destructive" });
    } finally {
      setIsGeneratingDesc(false);
    }
  };

  const handleSuggestPrice = async () => {
    if (!itemName || !itemDescription) {
      toast({
        title: "Name and Description Required",
        description: "Please enter item name and description before suggesting a price.",
        variant: "destructive",
      });
      return;
    }
    setIsSuggestingPrice(true);
    try {
      const result = await suggestPrice({ itemName, description: itemDescription });
      if (result.price) {
        form.setValue("price", result.price, { shouldValidate: true });
        toast({ title: "Price Suggested!", description: `The AI suggested a price of ₹${result.price}.` });
      }
    } catch (error) {
      console.error("Error suggesting price:", error);
      toast({ title: "AI Error", description: "Could not suggest a price.", variant: "destructive" });
    } finally {
      setIsSuggestingPrice(false);
    }
  };

  const isAiBusy = isGeneratingDesc || isSuggestingPrice;

  const onSubmit = async (data: MenuFormValues) => {
    setIsSubmitting(true);
    try {
      const payload: Omit<MenuItem, 'id' | 'imageHint'> & { id?: string } = {
        ...data,
      };

      if (isEditing && itemToEdit) {
        await updateMenuItem(itemToEdit.id, payload);
        toast({ title: "Success", description: "Menu item updated successfully." });
      } else {
        await addMenuItem(payload);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column for Form Fields */}
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
                   <div className="flex items-center justify-between">
                    <FormLabel>Description</FormLabel>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateDescription}
                      disabled={isAiBusy || !itemName}
                    >
                      {isGeneratingDesc ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Wand2 className="mr-2 h-4 w-4" />
                      )}
                      Generate
                    </Button>
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
                      <FormLabel>Price (INR)</FormLabel>
                       <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleSuggestPrice}
                        disabled={isAiBusy || !itemName || !itemDescription}
                      >
                        {isSuggestingPrice ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-2 h-4 w-4" />
                        )}
                        Suggest
                      </Button>
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
                    <FormLabel>Category</FormLabel>
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

          {/* Right Column for Image */}
          <div className="space-y-4">
             <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl><Input placeholder="https://example.com/image.png" {...field} /></FormControl>
                    <FormDescription>
                      Upload your image to a service like <a href="https://imgbb.com/" target="_blank" rel="noopener noreferrer" className="underline">ImgBB</a> and paste the direct image link here.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <Label>Image Preview</Label>
                <div className="relative aspect-video w-full rounded-md overflow-hidden border mt-2 bg-muted">
                  {imageUrl && imageUrl.startsWith('http') ? (
                      <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                  ) : (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                          <UploadCloud className="h-12 w-12" />
                          <p className="mt-2 text-sm text-center">Paste an image URL above to see a preview</p>
                      </div>
                  )}
                </div>
              </div>
          </div>
        </div>
        <Button type="submit" disabled={isAiBusy || isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Save Changes' : 'Add Item'}
        </Button>
      </form>
    </Form>
  );
}
