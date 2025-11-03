'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Info, Wand2, Loader2, UploadCloud, Trash2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Category, type MenuItem } from '@/lib/types';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { addCategory, addMenuItem } from '@/lib/menu';

interface ParsedMenuItem {
  id: string;
  name: string;
  price: number;
  categoryName: string;
}

const defaultMenuText = `Shakes
Cold Coffee: 139
Oreo Shake: 149

Continental Starter
Cheese Nachos with Salsa: 150
BBQ Chicken Wings: 200
`;

function BulkUploader() {
  const [categoriesSnapshot, loadingCategories] = useCollection(collection(db, 'categories'));
  const categories = categoriesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)) || [];
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
      if (!trimmedLine) return;
      if (trimmedLine.includes(':')) {
        const parts = trimmedLine.split(':');
        const name = parts[0].trim();
        const price = parseFloat(parts[1].trim());
        if (name && !isNaN(price)) {
          items.push({ id: `parsed-${Date.now()}-${index}`, name, price, categoryName: currentCategory });
        }
      } else {
        currentCategory = trimmedLine;
      }
    });
    return items;
  };

  const handleParse = () => {
    setIsParsing(true);
    const items = parseMenuText(rawInput);
    setParsedItems(items);
    setIsParsing(false);
    toast({ title: "Review Your Items", description: `Found ${items.length} items. Check them below.` });
  };

  const handleUpdateItem = (id: string, field: keyof ParsedMenuItem, value: string | number) => {
    setParsedItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const handleRemoveItem = (id: string) => {
    setParsedItems(prev => prev.filter(item => item.id !== id));
  };

  const handleInitiateUpload = async () => {
    setIsUploading(true);
    toast({ title: "Starting Upload...", description: "Please wait.", duration: 5000 });

    try {
      // Step 1: Handle Categories
      const uniqueCategoryNames = [...new Set(parsedItems.map(p => p.categoryName))];
      const existingCategoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c]));
      const newCategoryNames = uniqueCategoryNames.filter(name => !existingCategoryMap.has(name.toLowerCase()));
      
      const newCategories: Category[] = [];
      if (newCategoryNames.length > 0) {
        toast({ title: "Creating New Categories", description: `Found ${newCategoryNames.length} new categories.` });
        const newCategoryPromises = newCategoryNames.map(name => addCategory({ name }));
        const settledCategories = await Promise.all(newCategoryPromises);
        settledCategories.forEach(cat => {
            if(cat) newCategories.push(cat)
        });
      }

      // Step 2: Create a definitive map of all categories (old and new)
      const finalCategoryMap = new Map(categories.map(c => [c.name, c.id]));
      newCategories.forEach(c => finalCategoryMap.set(c.name, c.id));

      // Step 3: Upload Menu Items
      toast({ title: "Uploading Menu Items...", description: `Adding ${parsedItems.length} items to your menu.` });
      const uploadPromises = parsedItems.map(item => {
        const categoryId = finalCategoryMap.get(item.categoryName);
        if (!categoryId) {
          console.warn(`Could not find category ID for ${item.categoryName}. Skipping item ${item.name}`);
          return Promise.resolve(); // Skip this item
        }

        const payload: Omit<MenuItem, 'id'> = {
          name: item.name,
          price: item.price,
          category: categoryId, 
          description: '', 
          isAvailable: true, 
          isVeg: true, 
        };
        return addMenuItem(payload);
      });

      await Promise.all(uploadPromises);

      toast({ title: "Upload Complete!", description: `Successfully added ${parsedItems.length} items to your menu.`, duration: 5000 });
      setParsedItems([]);
      setRawInput(defaultMenuText);

    } catch (error) {
      console.error("Upload failed", error);
      toast({ title: "Upload Failed", variant: 'destructive', description: "An error occurred during the upload process. Please check the console.", duration: 5000 });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2"><Wand2 /> Bulk Menu Uploader</CardTitle>
          <CardDescription>Paste your menu text to parse and upload items in batches.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>Formatting Guide</AlertTitle>
            <AlertDescription>
              Place categories on their own line. For items, use the format: `Name: Price`. Items listed under a category heading will be assigned to it.
            </AlertDescription>
          </Alert>
          <Textarea
            placeholder={defaultMenuText}
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            rows={15}
            disabled={isParsing || isUploading}
          />
          <Button onClick={handleParse} disabled={isParsing || isUploading || !rawInput.trim() || loadingCategories}>
            {isParsing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />} {isParsing ? 'Parsing...' : 'Parse & Review'}
          </Button>
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
                      <TableCell><Input value={item.name} onChange={e => handleUpdateItem(item.id, 'name', e.target.value)} className="h-8" disabled={isUploading} /></TableCell>
                      <TableCell><Input type="number" value={item.price} onChange={e => handleUpdateItem(item.id, 'price', parseFloat(e.target.value) || 0)} className="h-8" disabled={isUploading} /></TableCell>
                      <TableCell><Input value={item.categoryName} onChange={e => handleUpdateItem(item.id, 'categoryName', e.target.value)} className="h-8" disabled={isUploading} /></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="text-destructive" disabled={isUploading}>
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
            <Button onClick={handleInitiateUpload} disabled={isUploading || parsedItems.length === 0 || loadingCategories}>
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
