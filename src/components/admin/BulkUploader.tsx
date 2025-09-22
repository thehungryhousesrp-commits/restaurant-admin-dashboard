"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Wand2, Loader2, UploadCloud, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateBulkItems } from '@/ai/flows/generateBulkItems';
import { useAppContext } from '@/context/AppContext';
import { menuItemSchema } from '@/lib/schemas';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { type MenuItem } from '@/lib/types';


// Define the output for a single processed item, which now includes an optional imageHint
export const GeneratedItemSchema = menuItemSchema.extend({
    imageHint: z.string().optional(),
});
export type GeneratedItem = z.infer<typeof GeneratedItemSchema>;


const bulkUploaderSchema = z.object({
  items: z.array(GeneratedItemSchema),
});

type BulkUploaderFormValues = z.infer<typeof bulkUploaderSchema>;

export default function BulkUploader() {
  const { toast } = useToast();
  const { categories, addMenuItem } = useAppContext();
  const [rawInput, setRawInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<BulkUploaderFormValues>({
    resolver: zodResolver(bulkUploaderSchema),
    defaultValues: {
      items: [],
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: 'items',
  });

  const handleGenerate = async () => {
    const lines = rawInput.split('\n').filter(line => line.trim() !== '');
    if (lines.length === 0) {
      toast({ title: 'Input required', description: 'Please enter at least one item name.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setError(null);
    form.reset({ items: [] }); // Clear previous results

    try {
      const promises = lines.map(line => generateBulkItems({ itemInput: line }));
      const results = await Promise.all(promises);
      
      // Filter out any potential null/undefined results if the AI fails
      const validItems = results.filter(item => item) as GeneratedItem[];
      append(validItems);

      toast({ title: 'Generation Complete!', description: `Processed ${validItems.length} items. Please review before uploading.` });
    } catch (err: any) {
      console.error('Bulk generation error:', err);
      setError('An error occurred during AI generation. Please check the console for details.');
      toast({ title: 'AI Error', description: err.message || 'Could not generate items.', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data: BulkUploaderFormValues) => {
    if(data.items.length === 0) {
        toast({ title: 'No items to upload', description: 'Please generate and review items first.', variant: 'destructive' });
        return;
    }
    setIsSubmitting(true);
    try {
        const creationPromises = data.items.map(item => addMenuItem(item as Omit<MenuItem, 'id'>));
        await Promise.all(creationPromises);

        toast({ title: 'Upload Successful!', description: `${data.items.length} items have been added to the menu.` });
        form.reset({ items: [] });
        setRawInput('');

    } catch (error) {
        console.error('Bulk upload failed:', error);
        toast({ title: 'Upload Failed', description: 'Could not add items to the menu. Please try again.', variant: 'destructive' });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Bulk AI Uploader</CardTitle>
        <CardDescription>
          Enter a list of menu items (one per line). You can optionally add a price after a hyphen (e.g., "Latte - 150"). The AI will generate the rest.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid w-full gap-2">
          <Textarea
            placeholder="Cold Coffee
Chicken Tikka Pizza - 550
Paneer Butter Masala
Garlic Naan - 50"
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            rows={6}
            disabled={isGenerating}
          />
          <Button onClick={handleGenerate} disabled={isGenerating || !rawInput.trim()}>
            {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Generate & Review
          </Button>
        </div>
        {error && (
            <Alert variant="destructive">
                <AlertTitle>Generation Failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
      </CardContent>

      {fields.length > 0 && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent>
                <h3 className="text-lg font-medium mb-4">Review Generated Items</h3>
                <div className="border rounded-lg overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Name</TableHead>
                                <TableHead className="w-[300px]">Description</TableHead>
                                <TableHead className="w-[120px]">Price</TableHead>
                                <TableHead className="w-[180px]">Category</TableHead>
                                <TableHead className="w-[300px]">Image URL</TableHead>
                                <TableHead className="w-[250px]">Flags</TableHead>
                                <TableHead className="w-[50px]">Action</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {fields.map((field, index) => (
                                <TableRow key={field.id}>
                                    <TableCell><Input {...form.register(`items.${index}.name`)} /></TableCell>
                                    <TableCell><Textarea {...form.register(`items.${index}.description`)} /></TableCell>
                                    <TableCell><Input type="number" {...form.register(`items.${index}.price`, { valueAsNumber: true })} /></TableCell>
                                    <TableCell>
                                        <FormField
                                            control={form.control}
                                            name={`items.${index}.category`}
                                            render={({ field }) => (
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col gap-2">
                                            <Input {...form.register(`items.${index}.imageUrl`)} />
                                            <div className="relative aspect-video w-full rounded-md overflow-hidden border bg-muted">
                                                <Image src={form.watch(`items.${index}.imageUrl`)} alt="Preview" fill className="object-cover" />
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="space-y-3">
                                       <FormField control={form.control} name={`items.${index}.isAvailable`} render={({ field }) => (
                                            <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange}/></FormControl><FormLabel className="font-normal">Available</FormLabel></FormItem>
                                        )} />
                                       <FormField control={form.control} name={`items.${index}.isVeg`} render={({ field }) => (
                                            <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange}/></FormControl><FormLabel className="font-normal">Veg</FormLabel></FormItem>
                                        )} />
                                       <FormField control={form.control} name={`items.${index}.isSpicy`} render={({ field }) => (
                                            <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange}/></FormControl><FormLabel className="font-normal">Spicy</FormLabel></FormItem>
                                        )} />
                                       <FormField control={form.control} name={`items.${index}.isChefsSpecial`} render={({ field }) => (
                                            <FormItem className="flex items-center gap-2 space-y-0"><FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange}/></FormControl><FormLabel className="font-normal">Chef's Special</FormLabel></FormItem>
                                        )} />
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" onClick={() => remove(index)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                    Upload All to Menu
                </Button>
            </CardFooter>
          </form>
        </Form>
      )}
    </Card>
  );
}
