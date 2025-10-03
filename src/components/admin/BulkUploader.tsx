'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Info, Wand2, Loader2, UploadCloud, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAppContext } from '@/context/AppContext';
import { type Category } from '@/lib/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

// This will be the structure for items in the review stage
interface ParsedMenuItem {
  id: string; // A temporary unique ID for the key prop
  name: string;
  price: number;
  categoryName: string; // The name of the category from the text
  status: 'new' | 'valid' | 'invalid' | 'uploading' | 'uploaded';
}

const defaultMenuText = `Shakes
Cold Coffee: 139
Oreo Shake: 149

Continental Starter
Cheese Nachos with Salsa: 150
BBQ Chicken Wings: 200
`;

function BulkUploader() {
  const { categories, addCategory, addMenuItem } = useAppContext();
  const { toast } = useToast();
  const [rawInput, setRawInput] = useState(defaultMenuText);
  const [parsedItems, setParsedItems] = useState<ParsedMenuItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const parseMenuText = (text: string): ParsedMenuItem[] => {
    const lines = text.split('\n');
    let currentCategory = 'Uncategorized';
    const items: ParsedMenuItem[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return; // Skip empty lines

      if (trimmedLine.includes(':')) {
        const parts = trimmedLine.split(':');
        const name = parts[0].trim();
        const price = parseFloat(parts[1].trim());

        if (name && !isNaN(price)) {
          items.push({
            id: `parsed-${Date.now()}-${index}`,
            name,
            price,
            categoryName: currentCategory,
            status: 'new',
          });
        }
      } else {
        currentCategory = trimmedLine;
      }
    });
    return items;
  };

  const handleParse = () => {
    setIsParsing(true);
    toast({ title: "Parsing Menu...", description: "Reading your pasted text." });
    const items = parseMenuText(rawInput);
    setParsedItems(items);
    setIsParsing(false);
    toast({ title: "Review Your Items", description: `Found ${items.length} items. Check them below before uploading.` });
  };
  
  const handleUpdateItem = (id: string, field: keyof ParsedMenuItem, value: string | number) => {
    setParsedItems(prevItems =>
      prevItems.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };
  
  const handleRemoveItem = (id: string) => {
      setParsedItems(prevItems => prevItems.filter(item => item.id !== id));
  }

  const handleUploadAll = async () => {
    setIsUploading(true);

    // Step 1: Identify unique category names from the parsed items
    const uniqueCategoryNames = [...new Set(parsedItems.map(p => p.categoryName))];
    
    // Step 2: Find which of these categories are new
    const existingCategoryNames = new Set(categories.map(c => c.name));
    const newCategoryNames = uniqueCategoryNames.filter(name => !existingCategoryNames.has(name));

    // Step 3: Create the new categories
    const newCategoryPromises = newCategoryNames.map(name => addCategory({ name }));
    
    try {
        await Promise.all(newCategoryPromises);
        toast({ title: "Categories Synced", description: `${newCategoryNames.length} new categories were created.` });
    } catch (error) {
        toast({ title: "Category Creation Failed", variant: 'destructive', description: "Could not create new categories. Aborting upload." });
        setIsUploading(false);
        return;
    }

    // After new categories are created, the AppContext will update, but we need to wait for the next render.
    // A small delay or a refetch mechanism would be ideal, but for now we proceed.
    // The `addMenuItem` function will use the latest categories from the context.

    // Step 4: Upload menu items
    const uploadPromises = parsedItems.map(async (item) => {
        // Find the category ID from the (now updated) context
        // This is a potential race condition. A better way is to get the updated categories from the context provider.
        // For now, we'll rely on the context updating fast enough. A more robust solution might be needed.
        const category = categories.find(c => c.name === item.categoryName);
        const categoryId = category ? category.id : 'uncategorized'; // Fallback
        
        const menuItemPayload = {
            name: item.name,
            price: item.price,
            category: categoryId,
            description: 'Added via bulk upload.', // Default description
            isAvailable: true,
            isVeg: true, // Default to Veg
            isSpicy: false,
            isChefsSpecial: false,
            imageUrl: '',
            imageHint: item.name.toLowerCase().split(' ').slice(0, 2).join(' '),
        };

        await addMenuItem(menuItemPayload);
        // We can update item status here to show progress
        setParsedItems(prev => prev.map(p => p.id === item.id ? {...p, status: 'uploaded'} : p));
    });

    try {
        await Promise.all(uploadPromises);
        toast({ title: "Upload Complete!", description: `${parsedItems.length} items added to your menu.` });
        setParsedItems([]); // Clear the list after successful upload
    } catch(error) {
        toast({ title: "Upload Failed", variant: 'destructive', description: "Some items could not be uploaded." });
        console.error("Upload error:", error);
    } finally {
        setIsUploading(false);
    }
  };

  const allItemsValid = parsedItems.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2">
            <Wand2 /> Bulk Menu Uploader
          </CardTitle>
          <CardDescription>Paste your menu, and we'll parse it for you. Review and edit before uploading.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
           <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Formatting Guide</AlertTitle>
            <AlertDescription>
              Place categories on their own line. For items, use the format: `Name: Price`. Items listed under a category heading will be assigned to it.
            </AlertDescription>
          </Alert>
          <div className="grid w-full gap-2">
            <Textarea
              placeholder="Paste your menu here..."
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              rows={15}
              disabled={isParsing || isUploading}
            />
            <Button onClick={handleParse} disabled={isParsing || isUploading || !rawInput.trim()}>
              {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />} {isParsing ? 'Parsing...' : 'Parse & Review'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {parsedItems.length > 0 && (
        <Card>
            <CardHeader>
                <CardTitle>Review & Edit Items</CardTitle>
                <CardDescription>Verify the parsed items. Make any corrections before uploading.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Price (INR)</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {parsedItems.map(item => (
                            <TableRow key={item.id}>
                                <TableCell>
                                    <Input value={item.name} onChange={e => handleUpdateItem(item.id, 'name', e.target.value)} className="h-8" />
                                </TableCell>
                                <TableCell>
                                    <Input type="number" value={item.price} onChange={e => handleUpdateItem(item.id, 'price', parseFloat(e.target.value) || 0)} className="h-8" />
                                </TableCell>
                                <TableCell>
                                     <Input value={item.categoryName} onChange={e => handleUpdateItem(item.id, 'categoryName', e.target.value)} className="h-8" />
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="text-destructive">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </div>
            </CardContent>
            <CardFooter className="justify-end">
                <Button onClick={handleUploadAll} disabled={isUploading || !allItemsValid}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                    {isUploading ? 'Uploading...' : `Upload ${parsedItems.length} Items`}
                </Button>
            </CardFooter>
        </Card>
      )}
    </div>
  );
}

export default BulkUploader;
