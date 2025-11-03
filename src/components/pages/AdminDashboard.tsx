'use client';

import { useState, useCallback } from 'react';
import { type MenuItem, type Order, type Category } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PlusCircle, Edit, Trash2, Eye, Utensils, LayoutList, Armchair, ShoppingCart, Wand2 } from 'lucide-react';
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
  DialogTrigger,
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
import { collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateMenuItem, deleteMenuItems } from '@/lib/menu';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/lib/firebase';

// ============================================================================
// TYPES
// ============================================================================

type AdminView = 'items' | 'categories' | 'tables' | 'orders' | 'bulk-upload';

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
  { id: 'bulk-upload', label: 'Bulk Uploader', icon: Wand2 },
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
// MENU ITEMS VIEW
// ============================================================================

/**
 * Displays menu items in a table with edit and delete functionality
 */
const MenuItemsView = () => {
  const [menuItemsSnapshot, loadingMenuItems] = useCollection(collection(db, 'menuItems'));
  const [categoriesSnapshot] = useCollection(collection(db, 'categories'));
  const { toast } = useToast();

  const menuItems = (menuItemsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []) as MenuItem[];
  const categories = (categoriesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []) as Category[];

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
      try {
        await updateMenuItem(item.id, { isAvailable });
        toast({ title: `${item.name} is now ${isAvailable ? 'available' : 'unavailable'}` });
      } catch (error) {
        console.error('Error updating availability:', error);
        toast({ title: 'Error', description: 'Failed to update availability', variant: 'destructive' });
      }
    },
    [toast]
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
    if (deleteConfirmation !== 'DELETE') return;

    try {
      await deleteMenuItems(selectedItems);
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
  }, [deleteConfirmation, selectedItems, toast]);

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
            {loadingMenuItems ? (
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
 * Displays orders in a table with view functionality
 */
const OrdersView = () => {
  const [ordersSnapshot, loadingOrders] = useCollection(collection(db, 'orders'));

  const orders = (ordersSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() })) || []) as Order[];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Orders</h2>

      <div className="border rounded-lg overflow-hidden">
        <ShadcnTable>
          <TableHeader>
            <TableRow className="bg-muted">
              <TableHead>Invoice #</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right w-16">View</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingOrders ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                  No orders found
                </TableCell>
              </TableRow>
            ) : (
              orders.map(order => (
                <TableRow key={order.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{order.id.slice(-6).toUpperCase()}</TableCell>
                  <TableCell>{order.customerInfo?.name ?? 'N/A'}</TableCell>
                  <TableCell>{new Date(order.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">₹{order.total.toFixed(2)}</TableCell>
                  <TableCell className="text-right">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                          <DialogTitle>Order Details</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p><strong>Invoice:</strong> {order.id}</p>
                          <p><strong>Total:</strong> ₹{order.total.toFixed(2)}</p>
                          <p><strong>Date:</strong> {new Date(order.createdAt).toLocaleString()}</p>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </ShadcnTable>
      </div>
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