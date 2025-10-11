'use client';

import { useState, useMemo } from "react";
import { type MenuItem, type Order, type Table } from "@/lib/types";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle, Edit, Trash2, Eye, Wand2, ShieldAlert, Image as ImageIconPlaceholder, SquareStack } from "lucide-react";
import {
  Table as ShadcnTable,
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
import { Checkbox } from "@/components/ui/checkbox";
import Image from "next/image";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import MenuForm from "@/components/admin/MenuForm";
import CategoryManager from "@/components/admin/CategoryManager";
import TableManager from "@/components/admin/TableManager";
import { InvoicePreview } from "@/components/order/InvoicePreview";
import BulkUploader from "@/components/admin/BulkUploader";

export default function AdminDashboard() {
  const { user, menuItems, categories, tables, orders, deleteMenuItem, deleteMenuItems, updateMenuItem, deleteOrder } = useAppContext();
  const [isFormOpen, setFormOpen] = useState(false);
  const [itemToEdit, setItemToEdit] = useState<MenuItem | undefined>(undefined);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isSecondAlertOpen, setSecondAlertOpen] = useState(false);
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

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await deleteOrder(orderId);
      toast({ title: "Order Deleted", description: "The order record has been permanently deleted." });
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete the order.", variant: "destructive" });
    }
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  const handleSelectAll = (checked: boolean | 'indeterminate') => {
    if (checked === true) {
      setSelectedItems(menuItems.map(item => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleRowSelect = (itemId: string, checked: boolean) => {
    if (checked) {
      setSelectedItems(prev => [...prev, itemId]);
    } else {
      setSelectedItems(prev => prev.filter(id => id !== itemId));
    }
  };

  const handleDeleteSelected = async () => {
    try {
      await deleteMenuItems(selectedItems);
      toast({ title: "Items Deleted", description: `${selectedItems.length} menu items have been permanently deleted.` });
      setSelectedItems([]);
      setSecondAlertOpen(false);
      setDeleteConfirmation('');
    } catch (error) {
      toast({ title: "Error", description: "Failed to delete the selected items.", variant: "destructive" });
    }
  };

  const displayName = user?.displayName || 'Admin';
  const isAllSelected = selectedItems.length > 0 && selectedItems.length === menuItems.length;
  const isPartialSelected = selectedItems.length > 0 && selectedItems.length < menuItems.length;
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
            <h1 className="text-3xl font-bold font-headline tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Hello, {displayName}. Manage your restaurant's menu, categories, and orders.</p>
        </div>
        <div className="flex gap-2">
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
          <TabsTrigger value="tables">Tables</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
          <TabsTrigger value="bulk-upload"><Wand2 className="mr-2 h-4 w-4" />Bulk Uploader</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-4">
            {selectedItems.length > 0 && (
                 <div className="flex items-center justify-between p-4 mb-4 border rounded-lg bg-secondary/50">
                     <div className="text-sm font-medium">
                         {selectedItems.length} item(s) selected
                     </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" />Delete Selected</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete {selectedItems.length} item(s). This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => setSecondAlertOpen(true)}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
          <div className="border rounded-lg">
            <ShadcnTable>
              <TableHeader>
                <TableRow>
                    <TableHead className="w-[50px] text-center">
                        <Checkbox 
                            onCheckedChange={handleSelectAll}
                            checked={isAllSelected ? true : (isPartialSelected ? 'indeterminate' : false)}
                        />
                    </TableHead>
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
                  <TableRow key={item.id} data-state={selectedItems.includes(item.id) ? 'selected' : ''}>
                    <TableCell className="text-center">
                        <Checkbox 
                            onCheckedChange={(checked) => handleRowSelect(item.id, checked === true)}
                            checked={selectedItems.includes(item.id)}
                        />
                    </TableCell>
                    <TableCell>
                      <div className="w-[50px] h-[50px] rounded-md bg-muted flex items-center justify-center">
                        {item.imageUrl ? (
                           <Image src={item.imageUrl} alt={item.name} width={50} height={50} className="rounded-md object-cover w-full h-full" />
                        ) : (
                          <ImageIconPlaceholder className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>{getCategoryName(item.category)}</TableCell>
                    <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                    <TableCell className="text-center">
                        <Switch checked={item.isAvailable} onCheckedChange={(checked) => handleAvailabilityToggle(item, checked)} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => handleEditClick(item)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>                  
                  </TableRow>
                ))}
              </TableBody>
            </ShadcnTable>
          </div>
        </TabsContent>
        
        <TabsContent value="categories" className="mt-4"><div className="max-w-md mx-auto"><CategoryManager /></div></TabsContent>
        <TabsContent value="tables" className="mt-4"><div className="max-w-md mx-auto"><TableManager /></div></TabsContent>
        <TabsContent value="orders" className="mt-4">
            <div className="border rounded-lg">
                <ShadcnTable>
                    <TableHeader><TableRow><TableHead>Invoice #</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Amount</TableHead><TableHead className="text-center">Actions</TableHead></TableRow></TableHeader>
                    <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id}>
                                <TableCell className="font-medium">{order.id.slice(-6).toUpperCase()}</TableCell>
                                <TableCell>{order.customerInfo.name}</TableCell>
                                <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                                <TableCell className="text-center space-x-2">
                                    <Dialog><DialogTrigger asChild><Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4" />View</Button></DialogTrigger><InvoicePreview order={order} /></Dialog>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button></AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader><AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle><AlertDialogDescription>This action will permanently delete the order record for invoice <span className="font-semibold">#{order.id.slice(-6).toUpperCase()}</span>.</AlertDialogDescription></AlertDialogHeader>
                                          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteOrder(order.id)}>Continue</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </ShadcnTable>
            </div>
             {orders.length === 0 && <div className="text-center py-16 text-muted-foreground"><p className="text-lg font-semibold">No Orders Found</p><p>New orders will appear here once they are placed.</p></div>}
        </TabsContent>
        <TabsContent value="bulk-upload" className="mt-4"><BulkUploader /></TabsContent>
      </Tabs>

       <AlertDialog open={isSecondAlertOpen} onOpenChange={setSecondAlertOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive"/> Final Confirmation</AlertDialogTitle>
                    <AlertDialogDescription>
                        This is your final warning. To confirm the deletion of {selectedItems.length} item(s), please type <strong>DELETE</strong> in the box below.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Input 
                    value={deleteConfirmation}
                    onChange={(e) => setDeleteConfirmation(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="my-2"
                />
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setDeleteConfirmation('')}>Cancel</AlertDialogCancel>
                    <Button 
                        variant="destructive"
                        onClick={handleDeleteSelected} 
                        disabled={deleteConfirmation !== 'DELETE'}
                    >
                        Delete Permanently
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    </div>
  );
}

    