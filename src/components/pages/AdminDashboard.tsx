"use client";

import { useState } from "react";
import { type MenuItem } from "@/lib/types";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, HardDriveUpload, Check, X, ShieldAlert } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import MenuForm from "@/components/admin/MenuForm";
import CategoryManager from "@/components/admin/CategoryManager";

export default function AdminDashboard() {
  const { menuItems, categories, deleteMenuItem, updateMenuItem } = useAppContext();
  const [isFormOpen, setFormOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<MenuItem | undefined>(undefined);
  const { toast } = useToast();

  const handleEditClick = (item: MenuItem) => {
    setItemToEdit(item);
    setFormOpen(true);
  };

  const handleAddNewClick = () => {
    setItemToEdit(undefined);
    setFormOpen(true);
  };
  
  const handleAvailabilityToggle = (item: MenuItem, isAvailable: boolean) => {
    updateMenuItem(item.id, { isAvailable });
    toast({ title: `${item.name} is now ${isAvailable ? 'available' : 'unavailable'}`});
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage your restaurant's menu and categories.</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" disabled>
                <HardDriveUpload className="mr-2 h-4 w-4" />
                Bulk Upload
            </Button>
            <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                <DialogTrigger asChild>
                    <Button onClick={handleAddNewClick}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add New Item
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-2xl">
                          {itemToEdit ? "Edit Menu Item" : "Add New Menu Item"}
                        </DialogTitle>
                    </DialogHeader>
                    <MenuForm itemToEdit={itemToEdit} onFormSubmit={() => setFormOpen(false)} />
                </DialogContent>
            </Dialog>
        </div>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items">Menu Items</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
           <TabsTrigger value="orders" disabled>Orders <Badge variant="outline" className="ml-2">Soon</Badge></TabsTrigger>
        </TabsList>
        <TabsContent value="items" className="mt-4">
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {menuItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        width={50}
                        height={50}
                        className="rounded-md object-cover"
                      />
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{getCategoryName(item.category)}</TableCell>
                    <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                        <Switch
                            checked={item.isAvailable}
                            onCheckedChange={(checked) => handleAvailabilityToggle(item, checked)}
                        />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete the item
                              <span className="font-semibold"> {item.name}</span>.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMenuItem(item.id)}>
                              Continue
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
        <TabsContent value="categories" className="mt-4">
            <div className="max-w-md mx-auto">
                <CategoryManager />
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
