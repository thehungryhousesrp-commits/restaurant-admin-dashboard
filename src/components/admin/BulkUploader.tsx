
'use client';

import React, { useState, useContext, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Info, Wand2, Loader2, UploadCloud, Trash2, Edit, Check, X } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { type Category, type MenuItem } from '@/lib/types';
import { AppContext } from '@/context/AppContext';
import { addCategory, addMenuItem, updateMenuItem } from '@/lib/menu';
import { Badge } from '../ui/badge';
import { cn } from '@/lib/utils';


// The state for each item being reviewed, including its duplicate status
interface ReviewItem {
  id: string; // A temporary unique ID for the react key
  name: string;
  price: number;
  categoryName: string;
  isDuplicate: boolean;
  existingItemId?: string; // If it's a duplicate, the ID of the existing item
  resolution: 'new' | 'skip' | 'overwrite' | 'rename'; // How to handle the item
}

const defaultMenuText = `Shakes
Cold Coffee: 139
Oreo Shake: 149

Biryani
Chicken Biryani: 250
Chicken Biryani (Half): 150
Veg Biryani: 220

Continental Starter
Cheese Nachos with Salsa: 150
BBQ Chicken Wings: 200
`;

function BulkUploader() {
  const { categories, menuItems, loading: loadingCategories } = useContext(AppContext);
  const { toast } = useToast();
  const [rawInput, setRawInput] = useState(defaultMenuText);
  const [reviewItems, setReviewItems] = useState<ReviewItem[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Memoize a map of existing item names for quick lookups
  const existingMenuItemMap = useMemo(() => {
    const map = new Map<string, string>(); // Maps lowercase name to original item ID
    menuItems.forEach(item => {
      map.set(item.name.toLowerCase(), item.id);
    });
    return map;
  }, [menuItems]);


  const handleParse = () => {
    setIsParsing(true);

    const lines = rawInput.split('\n');
    let currentCategory = 'Uncategorized';
    const items: ReviewItem[] = [];

    lines.forEach((line, index) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      if (trimmedLine.includes(':')) {
        const parts = trimmedLine.split(':');
        const name = parts[0].trim();
        const price = parseFloat(parts[1].trim());

        if (name && !isNaN(price)) {
          const lowerCaseName = name.toLowerCase();
          const isDuplicate = existingMenuItemMap.has(lowerCaseName);
          items.push({
            id: `review-${Date.now()}-${index}`,
            name,
            price,
            categoryName: currentCategory,
            isDuplicate,
            existingItemId: isDuplicate ? existingMenuItemMap.get(lowerCaseName) : undefined,
            resolution: isDuplicate ? 'skip' : 'new', // Default duplicates to 'skip'
          });
        }
      } else {
        currentCategory = trimmedLine;
      }
    });

    setReviewItems(items);
    setIsParsing(false);
    const duplicateCount = items.filter(item => item.isDuplicate).length;
    toast({
      title: "Review Your Items",
      description: `Found ${items.length} items. ${duplicateCount > 0 ? `${duplicateCount} potential duplicates were detected.` : ''}`,
    });
  };

  const handleUpdateItem = (id: string, field: keyof ReviewItem, value: string | number) => {
    setReviewItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
  };
  
  const handleSetResolution = (id: string, resolution: ReviewItem['resolution']) => {
    setReviewItems(prev => prev.map(item => {
      if (item.id === id) {
        // If user wants to rename, but name is still a duplicate, keep it as 'rename'
        if (resolution === 'new' && existingMenuItemMap.has(item.name.toLowerCase()) && item.name.toLowerCase() !== menuItems.find(mi => mi.id === item.existingItemId)?.name.toLowerCase()) {
           toast({ title: 'Still a Duplicate', description: `"${item.name}" already exists. Please choose a unique name.`, variant: 'destructive' });
           return { ...item, resolution: 'rename' };
        }
        return { ...item, resolution };
      }
      return item;
    }));
  };

  const handleRemoveItem = (id: string) => {
    setReviewItems(prev => prev.filter(item => item.id !== id));
  };

  const handleInitiateUpload = async () => {
    setIsUploading(true);
    toast({ title: "Starting Upload...", description: "Please wait.", duration: 5000 });

    const itemsToUpload = reviewItems.filter(item => item.resolution === 'new');
    const itemsToOverwrite = reviewItems.filter(item => item.resolution === 'overwrite');
    
    try {
      // Step 1: Handle Categories
      const allItemCategoryNames = reviewItems
        .filter(item => item.resolution === 'new' || item.resolution === 'overwrite')
        .map(p => p.categoryName);
        
      const uniqueCategoryNames = [...new Set(allItemCategoryNames)];
      const existingCategoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c]));
      const newCategoryNames = uniqueCategoryNames.filter(name => !existingCategoryMap.has(name.toLowerCase()));
      
      const newCategories: Category[] = [];
      if (newCategoryNames.length > 0) {
        toast({ title: "Creating New Categories", description: `Found ${newCategoryNames.length} new categories.` });
        for (const name of newCategoryNames) {
          const newCat = await addCategory({ name });
          if(newCat) newCategories.push(newCat);
        }
      }

      // Step 2: Create a definitive map of all categories (old and new)
      const finalCategoryMap = new Map(categories.map(c => [c.name.toLowerCase(), c.id]));
      newCategories.forEach(c => finalCategoryMap.set(c.name.toLowerCase(), c.id));

      // Step 3: Upload New and Overwrite Existing Menu Items
      const finalUploadCount = itemsToUpload.length + itemsToOverwrite.length;
      toast({ title: "Processing Menu Items...", description: `Adding or updating ${finalUploadCount} items.` });

      const uploadPromises = reviewItems.map(item => {
        if (item.resolution !== 'new' && item.resolution !== 'overwrite') {
          return Promise.resolve(); // Skip this item
        }
        const categoryId = finalCategoryMap.get(item.categoryName.toLowerCase());
        if (!categoryId) {
          console.warn(`Could not find category ID for ${item.categoryName}. Skipping item ${item.name}`);
          return Promise.resolve(); // Skip this item
        }

        const isNonVegKeyword = ['chicken', 'mutton', 'fish', 'prawn', 'egg', 'wings'].some(keyword => item.name.toLowerCase().includes(keyword));

        const payload: Omit<MenuItem, 'id'> = {
          name: item.name,
          price: item.price,
          category: categoryId, 
          description: '.',
          isAvailable: true,
          isVeg: !isNonVegKeyword,
        };

        if(item.resolution === 'overwrite' && item.existingItemId) {
          return updateMenuItem(item.existingItemId, payload);
        }
        return addMenuItem(payload);
      });

      await Promise.all(uploadPromises);

      toast({ title: "Upload Complete!", description: `Successfully processed ${finalUploadCount} items.`, duration: 5000 });
      setReviewItems([]);

    } catch (error) {
      console.error("Upload failed", error);
      toast({ title: "Upload Failed", variant: 'destructive', description: "An error occurred during the upload process. Please check the console.", duration: 5000 });
    } finally {
      setIsUploading(false);
    }
  };
  
  const itemsToProcessCount = reviewItems.filter(item => item.resolution === 'new' || item.resolution === 'overwrite').length;


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl flex items-center gap-2"><Wand2 /> Bulk Menu Uploader</CardTitle>
          <CardDescription>Paste your menu text to parse and upload items in batches. The system will detect duplicates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>How to Use the Bulk Uploader</AlertTitle>
            <AlertDescription>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-sm">
                  <li>Place each category on its own line (e.g., `Biryani`).</li>
                  <li>Place each menu item on a new line using the format: `Name: Price`.</li>
                  <li>
                    **Handling Duplicates & Variants:** If you have items with the same name but different prices (e.g., half/full plates), make sure their names are unique in the text you paste.
                    <br />
                    For example, use `Chicken Biryani (Full): 250` and `Chicken Biryani (Half): 150`.
                  </li>
                  <li>
                    If the system finds a duplicate name, it will be flagged. Use the **Rename** button in the review step to give it a unique name before uploading.
                  </li>
              </ul>
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

      {reviewItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Edit Items</CardTitle>
            <CardDescription>Verify the parsed items. Duplicates are flagged and skipped by default. You can choose to rename or overwrite them.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Price (INR)</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reviewItems.map(item => (
                    <TableRow key={item.id} className={cn(item.isDuplicate && item.resolution !== 'new' && 'bg-yellow-50/50')}>
                      <TableCell>
                        {item.resolution === 'new' && <Badge variant="default">New</Badge>}
                        {item.resolution === 'skip' && <Badge variant="secondary">Skipped</Badge>}
                        {item.resolution === 'overwrite' && <Badge variant="destructive">Overwrite</Badge>}
                        {item.resolution === 'rename' && <Badge variant="outline">Renaming</Badge>}
                      </TableCell>
                      <TableCell>
                        {item.resolution === 'rename' ? (
                          <div className="flex items-center gap-2">
                            <Input value={item.name} onChange={e => handleUpdateItem(item.id, 'name', e.target.value)} className="h-8" disabled={isUploading} />
                            <Button size="icon" className="h-8 w-8" onClick={() => handleSetResolution(item.id, 'new')}><Check className="h-4 w-4" /></Button>
                          </div>
                        ) : item.isDuplicate && item.resolution !== 'new' ? (
                          <div className="font-medium text-yellow-700">⚠️ {item.name}</div>
                        ): (
                          <Input value={item.name} onChange={e => handleUpdateItem(item.id, 'name', e.target.value)} className="h-8" disabled={isUploading} />
                        )}
                      </TableCell>
                      <TableCell><Input type="number" value={item.price} onChange={e => handleUpdateItem(item.id, 'price', parseFloat(e.target.value) || 0)} className="h-8" disabled={isUploading} /></TableCell>
                      <TableCell><Input value={item.categoryName} onChange={e => handleUpdateItem(item.id, 'categoryName', e.target.value)} className="h-8" disabled={isUploading} /></TableCell>
                      <TableCell className="text-right">
                        {item.isDuplicate && item.resolution !== 'new' ? (
                            <div className="flex gap-1 justify-end">
                                <Button variant="outline" size="sm" className="h-8" onClick={() => handleSetResolution(item.id, 'skip')}>Skip</Button>
                                <Button variant="outline" size="sm" className="h-8" onClick={() => handleSetResolution(item.id, 'rename')}>Rename</Button>
                                <Button variant="destructive" size="sm" className="h-8" onClick={() => handleSetResolution(item.id, 'overwrite')}>Overwrite</Button>
                            </div>
                        ) : item.resolution === 'rename' ? (
                           <Button variant="ghost" size="sm" className="h-8" onClick={() => handleSetResolution(item.id, 'skip')}>Cancel</Button>
                        ) : (
                          <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)} className="text-destructive" disabled={isUploading}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter className="justify-end">
            <Button onClick={handleInitiateUpload} disabled={isUploading || itemsToProcessCount === 0 || loadingCategories}>
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
              {isUploading ? 'Uploading...' : `Upload ${itemsToProcessCount} Items`}
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}

export default BulkUploader;
