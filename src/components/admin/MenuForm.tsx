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
import { findImageUrl } from "@/ai/flows/findImageUrl";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";


// We are removing imageUrl from the form schema as it will be auto-generated for new items.
const formSchema = menuItemSchema.omit({ imageUrl: true, imageHint: true });
type MenuFormValues = z.infer<typeof formSchema>;

interface MenuFormProps {
  itemToEdit?: MenuItem;
  onFormSubmit: () => void;
}

export default function MenuForm({ itemToEdit, onFormSubmit }: MenuFormProps) {
  const { categories, addMenuItem, updateMenuItem } = useAppContext();
  const { toast } = useToast();
  const [imagePreview, setImagePreview] = useState<string | null>(itemToEdit?.imageUrl || null);
  const [isGeneratingDesc, setIsGeneratingDesc] = useState(false);
  const [isSuggestingPrice, setIsSuggestingPrice] = useState(false);
  const [isAiBusy, setIsAiBusy] = useState(false);
  const [aiImageClickCount, setAiImageClickCount] = useState(0);
  
  const isEditing = !!itemToEdit;

  const form = useForm<MenuFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: itemToEdit?.name || "",
      description: itemToEdit?.description || "",
      price: itemToEdit?.price || 0,
      category: itemToEdit?.category || "",
      isAvailable: itemToEdit?.isAvailable ?? true,
      isVeg: itemToEdit?.isVeg ?? false,
      isSpicy: itemToEdit?.isSpicy ?? false,
      isChefsSpecial: itemToEdit?.isChefsSpecial ?? false,
    },
  });

  const itemName = form.watch("name");
  const itemDescription = form.watch("description");
  
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
      });
      setImagePreview(null);
    }
  }, [itemToEdit, form]);

  useEffect(() => {
    setIsAiBusy(isGeneratingDesc || isSuggestingPrice);
  }, [isGeneratingDesc, isSuggestingPrice]);

  const handlePremiumFeatureClick = () => {
    setAiImageClickCount(prev => prev + 1);
  }

  useEffect(() => {
    if (aiImageClickCount >= 3) {
      toast({
        title: "Upgrade Required",
        description: "This is a premium feature. Please upgrade your plan to use it.",
        variant: "destructive",
      });
      setAiImageClickCount(0); // Reset counter
    }
  }, [aiImageClickCount, toast]);

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

  const onSubmit = async (data: MenuFormValues) => {
    setIsAiBusy(true);
    try {
      if (isEditing && itemToEdit) {
        // Since we don't have manual upload, we just pass the existing data for update
        await updateMenuItem(itemToEdit.id, { ...itemToEdit, ...data });
        toast({ title: "Success", description: "Menu item updated successfully." });
      } else {
        if (!data.name) {
             toast({ title: "Item name is required", description: "Please provide a name to find an image.", variant: "destructive"});
             setIsAiBusy(false);
             return;
        }

        toast({ title: "Finding an image...", description: "The AI is searching for a suitable placeholder for your item." });
        const imageResult = await findImageUrl({ itemName: data.name });
        
        const newItemPayload = {
            ...data,
            imageUrl: imageResult.imageUrl,
            imageHint: imageResult.imageHint,
        }
        
        await addMenuItem(newItemPayload);
        toast({ title: "Success", description: "New menu item added with an AI-found image." });
      }
      onFormSubmit();
    } catch (error) {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
      console.error(error);
    } finally {
        setIsAiBusy(false);
    }
  };
  
  return (
    <TooltipProvider>
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
               <div>
                  <Label>Menu Image</Label>
                  <div className="relative aspect-video w-full rounded-md overflow-hidden border mt-2 bg-muted">
                      {imagePreview ? (
                          <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                      ) : (
                          <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                              <UploadCloud className="h-12 w-12" />
                              <p className="mt-2 text-sm">Image will be auto-assigned</p>
                          </div>
                      )}
                  </div>
               </div>
              <div className="grid grid-cols-2 gap-2">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        disabled
                        onClick={handlePremiumFeatureClick}
                      >
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate with AI
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Premium Feature: Upgrade to generate images with AI.</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <Button
                          type="button"
                          variant="outline"
                          className="w-full"
                          disabled
                          onClick={handlePremiumFeatureClick}
                        >
                          <UploadCloud className="mr-2 h-4 w-4" />
                          Upload Image
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Premium Feature: Upgrade to upload custom images.</p>
                    </TooltipContent>
                  </Tooltip>
              </div>
               <FormDescription>
                 For new items, a placeholder image will be automatically found. AI Generation and Manual Upload are premium features.
              </FormDescription>
            </div>
          </div>
          <Button type="submit" disabled={isAiBusy}>{isEditing ? 'Save Changes' : 'Add Item'}</Button>
        </form>
      </Form>
    </TooltipProvider>
  );
}
