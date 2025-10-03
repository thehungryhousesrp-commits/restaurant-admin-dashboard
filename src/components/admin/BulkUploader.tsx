'use client';

import React, { useState, useTransition } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wand2, Loader2, UploadCloud, Trash2, Sparkles, Info, AlertTriangle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateBulkItems } from '@/ai/flows/generateBulkItems';
import { useAppContext } from '@/context/AppContext';
import { menuItemSchema } from '@/lib/schemas';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { type Category } from '@/lib/types';

// 1. FORM & SCHEMA DEFINITIONS
export const GeneratedItemSchema = menuItemSchema.extend({
  id: z.string(),
  imageHint: z.string().optional(),
});
export type GeneratedItem = z.infer<typeof GeneratedItemSchema>;

const FailedItemSchema = z.object({
  id: z.string(),
  error: z.literal(true),
  line: z.string(),
  reason: z.string(),
});
type FailedItem = z.infer<typeof FailedItemSchema>;

const ReviewItemSchema = z.union([GeneratedItemSchema, FailedItemSchema]);
type ReviewItem = z.infer<typeof ReviewItemSchema>;

const bulkUploaderSchema = z.object({
  items: z.array(ReviewItemSchema),
});
type BulkUploaderFormValues = z.infer<typeof bulkUploaderSchema>;

const defaultMenuText = ``;

// 2. COMPONENT
function BulkUploader() {
  const { toast } = useToast();
  const { categories, addMenuItem, addCategory } = useAppContext();
  const [rawInput, setRawInput] = useState(defaultMenuText);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, startUploadTransition] = useTransition();

  const form = useForm<BulkUploaderFormValues>({
    resolver: zodResolver(bulkUploaderSchema),
    defaultValues: { items: [] },
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: 'items' });

  // 3. CORE LOGIC
  const handleGenerate = async () => {
    const lines = rawInput.split('\n').map(line => line.trim()).filter(Boolean);
    if (lines.length === 0) {
      toast({ title: 'Input required', description: 'Please enter menu items.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    form.reset({ items: [] });

    let lastSeenCategory = 'Uncategorized';
    const itemInputs = lines.map(line => {
      const isHeading = !/[-–—:]\s*₹?\s*(\d|\()/.test(line);
      if (isHeading) {
        lastSeenCategory = line.replace(/[:(].*/, '').trim();
        return null;
      }
      return { line, category: lastSeenCategory };
    }).filter(Boolean) as { line: string; category: string }[];

    let localCategories = [...categories];
    let successCount = 0;
    let totalCount = 0;

    try {
      const stream = generateBulkItems.stream({ itemInputs });

      for await (const chunk of stream) {
        totalCount++;
        const tempId = `temp-${Date.now()}-${Math.random()}`;
        
        if (chunk && !('error' in chunk)) {
            successCount++;
            const [categoryId, updatedCategories] = await getCategoryId(chunk.category, localCategories);
            localCategories = updatedCategories;

            append({
                ...chunk,
                id: tempId,
                category: categoryId,
                imageUrl: chunk.imageUrl ?? '',
                imageHint: chunk.imageHint ?? '',
                isAvailable: chunk.isAvailable ?? true,
            });
        } else if (chunk) {
            append({ ...chunk, id: tempId });
        }
      }

      toast({ 
        title: 'Generation Complete!', 
        description: `Processed ${successCount} of ${totalCount} items.` 
      });

    } catch (e) {
      console.error('Bulk generation failed:', e);
      toast({ title: 'AI Generation Stream Failed', description: 'The AI could not process the menu. Check the console for errors.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };
  
  const getCategoryId = async (name: string, localCategories: Category[]): Promise<[string, Category[]]> => {
    if (!name) return [categories.find(c => c.name.toLowerCase() === 'uncategorized')?.id || '', localCategories];
    const existing = localCategories.find(c => c.name.toLowerCase() === name.toLowerCase());
    if (existing) return [existing.id, localCategories];

    try {
      const newCategory = await addCategory({ name });
      if (newCategory) {
        toast({ title: 'AI created new category!', description: `Added "${name}".` });
        const updatedCats = [...localCategories, newCategory];
        return [newCategory.id, updatedCats];
      }
    } catch (e) {
      console.error(`Failed to create category "${name}":`, e);
    }
    const defaultCategory = localCategories.find(c => c.name.toLowerCase() === 'uncategorized') || localCategories[0];
    return [defaultCategory?.id || '', localCategories];
  };

  const onSubmit = (data: BulkUploaderFormValues) => {
    startUploadTransition(async () => {
        try {
            const validItems = data.items.filter(item => !('error' in item)) as GeneratedItem[];

            if (validItems.length === 0) {
              toast({ title: 'No valid items to upload', description: 'Please generate or correct items before uploading.', variant: 'warning' });
              return;
            }

            const creationPromises = validItems.map(item => {
                const { id, ...itemToCreate } = item;
                return addMenuItem(itemToCreate);
            });

            await Promise.all(creationPromises);
            toast({ title: 'Upload Successful!', description: `${validItems.length} items added.` });
            form.reset({ items: [] });
            setRawInput('');
        } catch (error) {
            console.error('Bulk upload failed:', error);
            toast({ title: 'Upload Failed', variant: 'destructive' });
        }
    });
  };

  const isProcessing = isGenerating || isUploading;

  // 4. RENDER
  return (
    <Card className="border-yellow-500/50 border-2 shadow-lg">
      <CardHeader>
        <CardTitle className="font-headline text-2xl bg-gradient-to-r from-yellow-400 to-amber-600 text-transparent bg-clip-text flex items-center gap-2">
          <Sparkles className="text-yellow-500" /> AI Genesis Uploader
        </CardTitle>
        <CardDescription>Paste your menu, and our AI will parse, enrich, and prepare each item. Correct any failures and upload.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
         <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle>Formatting Guide</AlertTitle>
          <AlertDescription>
            Place categories on their own line. For items with multiple prices, use formats like `Name: (Label) Price | (Label) Price`.
          </AlertDescription>
        </Alert>
        <div className="grid w-full gap-2">
          <Textarea
            placeholder="Soups\nTomato Soup – 150\n..."
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            rows={15}
            disabled={isProcessing}
            className="focus-visible:ring-yellow-500"
          />
          <Button onClick={handleGenerate} disabled={isProcessing || !rawInput.trim()} className="bg-gradient-to-r from-yellow-400 to-amber-600 text-white hover:opacity-90">
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />} {isGenerating ? 'Generating...' : 'Generate & Review'}
          </Button>
        </div>
      </CardContent>

      {fields.length > 0 && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
              <h3 className="text-lg font-medium mb-4">Review Generated Items ({fields.length})</h3>
              <div className="border rounded-lg overflow-x-auto">
                 <Table>
                  <TableHeader><TableRow>
                    <TableHead className="min-w-[250px]">Name & Variants</TableHead>
                    <TableHead className="min-w-[300px]">Description</TableHead>
                    <TableHead className="w-[180px]">Category</TableHead>
                    <TableHead className="w-[300px]">Image URL</TableHead>
                    <TableHead className="w-[200px]">Flags</TableHead>
                    <TableHead className="w-[50px]">Action</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {fields.map((field, index) => {
                      const item = form.watch(`items.${index}`);

                      if ('error' in item) {
                        return (
                          <TableRow key={field.id} className="bg-red-50 border-l-4 border-red-500">
                            <TableCell colSpan={5}>
                              <div className="font-semibold text-red-800">Failed to parse line:</div>
                              <div className="text-sm text-gray-600 font-mono p-2 bg-red-100 rounded-md my-1">{item.line}</div>
                              <div className="text-xs text-red-600"><b>Reason:</b> {item.reason}</div>
                            </TableCell>
                             <TableCell><Button variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                          </TableRow>
                        )
                      }

                      return (
                        <TableRow key={field.id}>
                            <TableCell>
                                <Input {...form.register(`items.${index}.name`)} className="font-semibold" />
                                <div className="mt-2 space-y-2">
                                    <Controller
                                        control={form.control}
                                        name={`items.${index}.variants`}
                                        render={({ field: controllerField }) => (
                                            <>
                                                {controllerField.value.map((variant, vIndex) => (
                                                    <div key={vIndex} className="flex items-center gap-2">
                                                        <Input
                                                            placeholder="Label (e.g., Full)"
                                                            defaultValue={variant.label}
                                                            onChange={(e) => {
                                                              const newVariants = [...controllerField.value];
                                                              newVariants[vIndex].label = e.target.value;
                                                              controllerField.onChange(newVariants);
                                                            }}
                                                            className="h-8"
                                                        />
                                                        <Input
                                                            type="number"
                                                            placeholder="Price"
                                                            defaultValue={variant.price}
                                                             onChange={(e) => {
                                                              const newVariants = [...controllerField.value];
                                                              newVariants[vIndex].price = parseFloat(e.target.value) || 0;
                                                              controllerField.onChange(newVariants);
                                                            }}
                                                            className="h-8 w-24"
                                                        />
                                                         <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => {
                                                              const newVariants = controllerField.value.filter((_, i) => i !== vIndex);
                                                              controllerField.onChange(newVariants);
                                                          }}>
                                                            <X className="h-4 w-4 text-muted-foreground" />
                                                          </Button>
                                                    </div>
                                                ))}
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => controllerField.onChange([...controllerField.value, { label: 'New', price: 0 }])}
                                                    className="mt-1 w-full"
                                                >
                                                    Add Variant
                                                </Button>
                                            </>
                                        )}
                                    />
                                </div>
                            </TableCell>
                          <TableCell><Textarea {...form.register(`items.${index}.description`)} /></TableCell>
                           <TableCell>
                            <Controller
                              control={form.control}
                              name={`items.${index}.category`}
                              render={({ field: controllerField }) => (
                                  <Select onValueChange={controllerField.onChange} value={controllerField.value}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>{categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}</SelectContent>
                                  </Select>
                              )} 
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-2">
                              <Input {...form.register(`items.${index}.imageUrl`)} />
                              <div className="relative aspect-video w-full rounded-md overflow-hidden border bg-muted">
                                <Image src={form.watch(`items.${index}.imageUrl`) || '/placeholder.png'} alt="Preview" fill className="object-cover" />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="space-y-3">
                            <FormField control={form.control} name={`items.${index}.isAvailable`} render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Available</FormLabel></FormItem>)} />
                            <FormField control={form.control} name={`items.${index}.isVeg`} render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Veg</FormLabel></FormItem>)} />
                            <FormField control={form.control} name={`items.${index}.isSpicy`} render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Spicy</FormLabel></FormItem>)} />
                            <FormField control={form.control} name={`items.${index}.isChefsSpecial`} render={({ field }) => (<FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl><FormLabel className="font-normal">Chef's Special</FormLabel></FormItem>)} />
                          </TableCell>
                          <TableCell><Button variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button></TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" disabled={isProcessing} className="bg-slate-700 text-white hover:bg-slate-800">
                {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />} {isUploading ? 'Uploading...' : 'Upload All Valid Items'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      )}
    </Card>
  );
}

export default BulkUploader;
