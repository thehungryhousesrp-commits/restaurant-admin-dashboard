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
import { Wand2, Loader2, Image as ImageIcon, Sparkles } from "lucide-react";
import { generateDescription } from "@/ai/flows/generateDescription";
import { generateImage } from "@/ai/flows/generateImage";
import { suggestPrice } from "@/ai/flows/suggestPrice";
import { Checkbox } from "@/components/ui/checkbox";

type MenuFormValues = z.infer<typeof menuItemSchema>;

interface MenuFormProps {
  itemToEdit?: MenuItem;
  onFormSubmit: () => void;
}

// Helper to convert file to Base64 data URI
function fileToDataUri(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function MenuForm({ itemToEdit, onFormSubmit }: MenuFormProps) {
  const { categories, addMenuItem, updateMenuItem } = useAppContext();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(itemToEdit?.imageUrl || null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  
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
      imageUrl: itemToEdit?.imageUrl || "",
    },
  });

  const itemName = form.watch("name");
  const itemDescription = form.watch("description");
  const imageRef = form.register("imageUrl");

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
        imageUrl: itemToEdit.imageUrl,
      });
      setImagePreview(itemToEdit.imageUrl);
    } else {
      form.reset({
        name: "",
        description: "",
        price: 0,
        category: "",
        isAvailable: true,
        isVeg: false,
        isSpicy: false,
        isChefsSpecial: false,
        imageUrl: "",
      });
      setImagePreview(null);
    }
  }, [itemToEdit, form]);

  const handleGenerateDescription = async () => {
    const currentName = form.getValues("name");
    if (!currentName) {
      toast({
        title: "Item Name Required",
        description: "Please enter an item name before generating a description.",
        variant: "destructive",
      });
      return;
    }
    setIsGeneratingDesc(true);
    try {
      const result = await generateDescription({ itemName: currentName });
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
    const currentName = form.getValues("name");
    const currentDescription = form.getValues("description");
    if (!currentName || !currentDescription) {
      toast({
        title: "Name and Description Required",
        description: "Please enter item name and description before suggesting a price.",
        variant: "destructive",
      });
      return;
    }
    setIsSuggestingPrice(true);
    try {
      const result = await suggestPrice({ itemName: currentName, description: currentDescription });
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

  const handleGenerateImage = async () => {
    const currentName = form.getValues("name");
     if (!currentName) {
      toast({
        title: "Item Name Required",
        description: "Please enter an item name before generating an image.",
        variant: "destructive",
      });
      return;
    }
    setIsGeneratingImg(true);
    setImagePreview(null);
    try {
      const result = await generateImage({ itemName: currentName });
      if (result.imageUrl) {
        setImagePreview(result.imageUrl);
        form.setValue("imageUrl", result.imageUrl, { shouldValidate: true });
        toast({ title: "Image Generated!", description: "The AI has created a new image for your item." });
      }
    } catch (error) {
      console.error("Error generating image:", error);
      toast({ title: "AI Error", description: "Could not generate image.", variant: "destructive" });
    } finally {
      setIsGeneratingImg(false);
    }
  };


  const onSubmit = async (data: MenuFormValues) => {
    try {
      if (!data.imageUrl) {
         toast({ title: "Image required", description: "Please select or generate an image for the item.", variant: "destructive"});
         return;
      }

      if (isEditing && itemToEdit) {
        updateMenuItem(itemToEdit.id, data);
        toast({ title: "Success", description: "Menu item updated successfully." });
      } else {
        // The type assertion is needed because addMenuItem expects a slightly different type
        await addMenuItem(data as Omit<MenuItem, 'id' | 'imageHint'>);
        toast({ title: "Success", description: "New menu item added." });
      }
      onFormSubmit();
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
      console.error(error);
    }
  };
  
  const isAiBusy = isGeneratingDesc || isGeneratingImg || isSuggestingPrice;

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
                        <Input type="number" step="0.01" placeholder="499.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="imageUrl"
              render={({ field }) => (
                <FormItem>
                   <div className="flex items-center justify-between">
                     <FormLabel>Menu Image</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateImage}
                        disabled={isAiBusy || !itemName}
                      >
                        {isGeneratingImg ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ImageIcon className="mr-2 h-4 w-4" />
                        )}
                        Generate
                      </Button>
                   </div>
                  <FormControl>
                    <Input 
                      type="file" 
                      accept="image/*"
                      // We don't use the field's onChange directly to handle file-to-data-uri conversion
                      onChange={async (e) => {
                        if (e.target.files && e.target.files[0]) {
                          const file = e.target.files[0];
                          const dataUri = await fileToDataUri(file);
                          field.onChange(dataUri); // Update form with data URI
                          setImagePreview(dataUri);
                        }
                      }}
                    />
                  </FormControl>
                  <FormDescription>PNG, JPG, WEBP. Max 1MB.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            { (imagePreview || isGeneratingImg) && (
              <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                { isGeneratingImg ? (
                  <div className="flex flex-col items-center justify-center h-full bg-muted">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">Generating your image...</p>
                    <p className="text-xs text-muted-foreground">This may take a moment.</p>
                  </div>
                ) : (
                   imagePreview && <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                )}
              </div>
            )}
          </div>
        </div>
        <Button type="submit" disabled={isAiBusy}>{isEditing ? 'Save Changes' : 'Add Item'}</Button>
      </form>
    </Form>
  );
}
