

'use client';

import { useState, useCallback, useContext, useEffect } from 'react';
import { type MenuItem, type Order, type Category, type Restaurant } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Edit, Trash2, Eye, Utensils, LayoutList, Armchair, ShoppingCart, Wand2, Download, Calendar as CalendarIcon, X, Settings, Upload, Image as ImageIcon } from 'lucide-react';
import {
  Table as ShadcnTable,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeader,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import MenuForm from '@/components/admin/MenuForm';
import CategoryManager from '@/components/admin/CategoryManager';
import TableManager from '@/components/admin/TableManager';
import BulkUploader from '@/components/admin/BulkUploader';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, orderBy, doc, updateDoc } from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateMenuItem, deleteMenuItems } from '@/lib/menu';
import { deleteOrders } from '@/lib/order';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';
import { AppContext } from '@/context/AppContext';
import { DateRange } from 'react-day-picker';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';


// ============================================================================
// TYPES
// ============================================================================

type AdminView = 'items' | 'categories' | 'tables' | 'orders' | 'bulk-upload' | 'settings';

interface NavItem {
  id: AdminView;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const NAV_ITEMS: NavItem[] = [
  { id: 'items', label: 'Menu Items', icon: Utensils },
  { id: 'categories', label: 'Categories', icon: LayoutList },
  { id: 'tables', label: 'Tables', icon: Armchair },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  // { id: 'bulk-upload', label: 'Bulk Uploader', icon: Wand2 },
  { id: 'settings', label: 'Outlet Settings', icon: Settings },
];

// ============================================================================
// SIDEBAR COMPONENT
// ============================================================================

/**
 * Navigation sidebar for switching between admin views
 */
const AdminSidebar = ({
  activeView,
  setActiveView,
}: {
  activeView: AdminView;
  setActiveView: (view: AdminView) => void;
}) => {
  return (
    <aside className="w-64 flex-shrink-0 border-r bg-card p-4">
      <nav className="flex flex-col gap-2">
        {NAV_ITEMS.map(item => (
          <Button
            key={item.id}
            variant={activeView === item.id ? 'secondary' : 'ghost'}
            className="justify-start gap-3"
            onClick={() => setActiveView(item.id)}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Button>
        ))}
      </nav>
    </aside>
  );
};

// ============================================================================
// OUTLET SETTINGS VIEW
// ============================================================================

const OutletSettingsView = () => {
    const { activeRestaurant, restaurantId } = useContext(AppContext);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(activeRestaurant?.logoUrl || null);

    useEffect(() => {
        setPreviewUrl(activeRestaurant?.logoUrl || null);
    }, [activeRestaurant]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!selectedFile) {
            toast({ title: 'No file selected', description: 'Please choose a logo to upload.', variant: 'destructive' });
            return;
        }
        if (!restaurantId) {
            toast({ title: 'Error', description: 'No active restaurant selected.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            // Create a storage reference
            const logoStorageRef = storageRef(storage, `restaurants/${restaurantId}/logo/${selectedFile.name}`);
            
            // Upload the file
            const uploadResult = await uploadBytes(logoStorageRef, selectedFile);
            
            // Get the download URL
            const downloadURL = await getDownloadURL(uploadResult.ref);

            // Update the restaurant document in Firestore
            const restaurantRef = doc(db, 'restaurants', restaurantId);
            await updateDoc(restaurantRef, {
                logoUrl: downloadURL,
            });

            toast({ title: 'Success', description: 'Logo has been updated successfully.' });
            setSelectedFile(null);
        } catch (error) {
            console.error('Error uploading logo:', error);
            toast({ title: 'Upload Failed', description: 'Failed to upload new logo.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Outlet Settings for {activeRestaurant?.name}</h2>
            <Card>
                <CardHeader>
                    <CardTitle>Brand Logo</CardTitle>
                    <CardDescription>Upload a logo for this outlet. This will appear on the dashboard and on invoices.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex flex-col sm:flex-row items-center gap-6">
                           <div className="w-32 h-32 rounded-lg border-2 border-dashed flex items-center justify-center bg-muted">
                                {previewUrl ? (
                                    <Image src={previewUrl} alt="Logo preview" width={128} height={128} className="object-contain rounded-md"/>
                                ) : (
                                    <ImageIcon className="h-10 w-10 text-muted-foreground" />
                                )}
                           </div>
                           <div className="flex-1 space-y-2">
                                <label htmlFor="logo-upload" className="font-medium text-sm">Choose a logo file</label>
                                <Input 
                                    id="logo-upload" 
                                    type="file"
                                    accept="image/png, image/jpeg, image/gif, image/webp"
                                    onChange={handleFileChange} 
                                    className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
                                />
                                <p className="text-xs text-muted-foreground">PNG, JPG, GIF, or WEBP. Max 2MB.</p>
                           </div>
                        </div>
                        <Button type="submit" disabled={isSubmitting || !selectedFile}>
                            {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                            {isSubmitting ? 'Uploading...' : 'Save and Upload Logo'}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};



// ============================================================================
// MENU ITEMS VIEW
// ============================================================================

/**
 * Displays menu items in a table with edit and delete functionality
 */
const MenuItemsView = () => {
  const { menuItems, categories, restaurantId, menuLoading } = useContext(AppContext);
  const { toast } = useToast();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // Get category name by ID
  const getCategoryName = useCallback(
    (categoryId: string) => {
      return categories.find(cat => cat.id === categoryId)?.name ?? 'Uncategorized';
    },
    [categories]
  );

  // Handle edit button click
  const handleEdit = useCallback((item: MenuItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  }, []);

  // Handle add new item
  const handleAddNew = useCallback(() => {
    setEditingItem(null);
    setIsFormOpen(true);
  }, []);

  // Toggle item availability
  const handleToggleAvailability = useCallback(
    async (item: MenuItem, isAvailable: boolean) => {
      if (!restaurantId) return;
      try {
        await updateMenuItem(restaurantId, item.id, { isAvailable });
        toast({ title: `${item.name} is now ${isAvailable ? 'available' : 'unavailable'}` });
      } catch (error) {
        console.error('Error updating availability:', error);
        toast({ title: 'Error', description: 'Failed to update availability', variant: 'destructive' });
      }
    },
    [toast, restaurantId]
  );

  // Select/deselect all items
  const handleSelectAll = useCallback(
    (checked: boolean | 'indeterminate') => {
      if (checked === true) {
        setSelectedItems(menuItems.map(item => item.id));
      } else {
        setSelectedItems([]);
      }
    },
    [menuItems]
  );

  // Toggle single item selection
  const handleToggleSelection = useCallback((itemId: string) => {
    setSelectedItems(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  }, []);

  // Delete selected items
  const handleDeleteSelected = useCallback(async () => {
    if (deleteConfirmation !== 'DELETE' || !restaurantId) return;

    try {
      await deleteMenuItems(restaurantId, selectedItems);
      toast({
        title: 'Success',
        description: `${selectedItems.length} item(s) deleted permanently`,
      });
      setSelectedItems([]);
      setDeleteConfirmation('');
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error deleting items:', error);
      toast({ title: 'Error', description: 'Failed to delete items', variant: 'destructive' });
    }
  }, [deleteConfirmation, selectedItems, toast, restaurantId]);

  const isAllSelected = menuItems.length > 0 && selectedItems.length === menuItems.length;
  const isIndeterminate = selectedItems.length > 0 && selectedItems.length < menuItems.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Menu Items</h2>
        <Button onClick={handleAddNew}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Item
        </Button>
      </div>

      {/* Selection Toolbar */}
      {selectedItems.length > 0 && (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/50">
          <span className="text-sm font-medium">{selectedItems.length} item(s) selected</span>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" size="sm">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete {selectedItems.length} item(s). This cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => setIsConfirmDialogOpen(true)}>
                  Continue
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <ShadcnTable>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected || isIndeterminate}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-center">Available</TableHead>
              <TableHead className="text-right w-16">Edit</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {menuLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : menuItems.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No items found
                </TableCell>
              </TableRow>
            ) : (
              menuItems.map(item => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(item.id)}
                      onCheckedChange={() => handleToggleSelection(item.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>{getCategoryName(item.category)}</TableCell>
                  <TableCell className="text-right">₹{item.price.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={item.isAvailable}
                      onCheckedChange={checked => handleToggleAvailability(item, checked)}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(item)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </ShadcnTable>
      </div>

      {/* Add/Edit Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          <MenuForm
            itemToEdit={editingItem ?? undefined}
            onFormSubmit={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Final Confirmation Dialog */}
      <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Final Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Type <strong>DELETE</strong> to permanently delete {selectedItems.length} item(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirmation}
            onChange={e => setDeleteConfirmation(e.target.value)}
            placeholder="Type DELETE"
            className="my-4"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
};

// ============================================================================
// ORDERS VIEW
// ============================================================================

/**
 * Displays orders in a table with view and filtering functionality
 */
const OrdersView = () => {
  const { restaurantId } = useContext(AppContext);
  const [ordersSnapshot, loadingOrders] = useCollection(
    restaurantId ? query(collection(db, `restaurants/${restaurantId}/orders`), orderBy('createdAt', 'desc')) : null
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const { toast } = useToast();

  const allOrders = (ordersSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []) as Order[];

  const filteredOrders = allOrders.filter(order => {
    if (!dateRange || (!dateRange.from && !dateRange.to)) {
      return true;
    }
    const orderDate = new Date(order.createdAt.seconds * 1000);
    const from = dateRange.from ? startOfDay(dateRange.from) : null;
    const to = dateRange.to ? endOfDay(dateRange.to) : null;

    if (from && !to) return orderDate >= from;
    if (!from && to) return orderDate <= to;
    if (from && to) return orderDate >= from && orderDate <= to;

    return false;
  });

  const downloadCSV = useCallback((isSelection: boolean = false) => {
    const ordersToExport = isSelection ? allOrders.filter(o => selectedOrders.includes(o.id)) : filteredOrders;
    
    if (ordersToExport.length === 0) {
      toast({ title: 'No Orders to Export', description: 'There are no orders matching your criteria.', variant: 'destructive' });
      return;
    }

    const headers = ['Invoice #', 'Customer Name', 'Customer Phone', 'Table', 'Date', 'Total Amount'];
    
    const rows = ordersToExport.map(order => {
        const row = [
            `"${order.id.slice(-6).toUpperCase()}"`,
            `"${order.customerInfo.name}"`,
            `"${order.customerInfo.phone}"`,
            `"${order.tableName}"`,
            `"${new Date(order.createdAt.seconds * 1000).toLocaleDateString()}"`,
            order.total.toFixed(2),
        ];
        return row.join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `orders_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: 'Export Successful', description: `Exported ${ordersToExport.length} orders.` });

  }, [filteredOrders, allOrders, selectedOrders, toast]);

  const clearFilters = () => {
    setDateRange(undefined);
    toast({ title: 'Filter Cleared', description: 'Displaying all orders.'});
  }

  // Selection handlers
  const handleSelectAllOrders = useCallback(
    (checked: boolean | 'indeterminate') => {
      setSelectedOrders(checked === true ? filteredOrders.map(o => o.id) : []);
    },
    [filteredOrders]
  );
  
  const handleToggleOrderSelection = useCallback((orderId: string) => {
    setSelectedOrders(prev =>
      prev.includes(orderId) ? prev.filter(id => id !== orderId) : [...prev, orderId]
    );
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    if (deleteConfirmation !== 'DELETE' || !restaurantId) return;

    try {
      await deleteOrders(restaurantId, selectedOrders);
      toast({
        title: 'Success',
        description: `${selectedOrders.length} order(s) deleted permanently.`,
      });
      setSelectedOrders([]);
      setDeleteConfirmation('');
      setIsConfirmDialogOpen(false);
    } catch (error) {
      console.error('Error deleting orders:', error);
      toast({ title: 'Error', description: 'Failed to delete orders.', variant: 'destructive' });
    }
  }, [deleteConfirmation, selectedOrders, toast, restaurantId]);

  const isAllOrdersSelected = filteredOrders.length > 0 && selectedOrders.length === filteredOrders.length;
  const isOrdersIndeterminate = selectedOrders.length > 0 && selectedOrders.length < filteredOrders.length;


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-bold">Orders</h2>
            <p className="text-sm text-muted-foreground">
              Showing {filteredOrders.length} of {allOrders.length} total orders.
            </p>
        </div>
      </div>
      
      {/* Filtering Section */}
      <div className="p-4 border rounded-lg bg-secondary/50 flex items-center gap-4">
        <span className="text-sm font-medium">Filter by Date:</span>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className={cn(
                "w-[260px] justify-start text-left font-normal",
                !dateRange && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange?.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y")} -{" "}
                    {format(dateRange.to, "LLL dd, y")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange?.from}
              selected={dateRange}
              onSelect={setDateRange}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
        {dateRange && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="mr-2 h-4 w-4"/>
            Clear Filter
          </Button>
        )}
      </div>

      {/* Selection Toolbar */}
      {selectedOrders.length > 0 && (
        <div className="flex items-center justify-between p-4 border rounded-lg bg-secondary/50">
          <span className="text-sm font-medium">{selectedOrders.length} order(s) selected</span>
          <div className='flex gap-2'>
            <Button variant="outline" size="sm" onClick={() => downloadCSV(true)}>
                <Download className="mr-2 h-4 w-4" />
                Export Selected
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Selected
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirm Deletion</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {selectedOrders.length} order(s). This cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => setIsConfirmDialogOpen(true)}>
                    Continue
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden">
        <ShadcnTable>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead className="w-12">
                  <Checkbox
                    checked={isAllOrdersSelected || isOrdersIndeterminate}
                    onCheckedChange={handleSelectAllOrders}
                  />
              </TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer / Table</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-center">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingOrders ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No orders found for the selected date range.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map(order => (
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell>
                    <Checkbox
                        checked={selectedOrders.includes(order.id)}
                        onCheckedChange={() => handleToggleOrderSelection(order.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{order.id.slice(-6).toUpperCase()}</TableCell>
                  <TableCell>{order.tableName}</TableCell>
                  <TableCell>{order.createdAt ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                  <TableCell className="text-center">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/invoice/${restaurantId}/${order.id}`} target="_blank" rel="noopener noreferrer">
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </ShadcnTable>
      </div>

       {/* Final Deletion Confirmation Dialog */}
       <AlertDialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Final Confirmation</AlertDialogTitle>
            <AlertDialogDescription>
              Type <strong>DELETE</strong> to permanently delete {selectedOrders.length} order(s).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={deleteConfirmation}
            onChange={e => setDeleteConfirmation(e.target.value)}
            placeholder="Type DELETE"
            className="my-4"
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
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
};

// ============================================================================
// MAIN ADMIN DASHBOARD
// ============================================================================

export default function AdminDashboard() {
  const [user] = useAuthState(auth);
  const [activeView, setActiveView] = useState<AdminView>('items');

  const displayName = user?.displayName ?? 'Admin';

  const renderView = useCallback(() => {
    switch (activeView) {
      case 'items':
        return <MenuItemsView />;
      case 'categories':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Categories</h2>
            <CategoryManager />
          </div>
        );
      case 'tables':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Tables</h2>
            <TableManager />
          </div>
        );
      case 'orders':
        return <OrdersView />;
      case 'bulk-upload':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold">Bulk Upload</h2>
            <BulkUploader />
          </div>
        );
      case 'settings':
          return <OutletSettingsView />;
      default:
        return <MenuItemsView />;
    }
  }, [activeView]);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome, {displayName}. Manage your restaurant operations.
          </p>
        </header>

        {/* Main Layout */}
        <div className="flex gap-8">
          <AdminSidebar activeView={activeView} setActiveView={setActiveView} />
          <main className="flex-1">{renderView()}</main>
        </div>
      </div>
    </div>
  );
}
