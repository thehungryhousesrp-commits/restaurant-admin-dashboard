"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { categorySchema } from "@/lib/schemas";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useContext } from "react";
import { AppContext } from "@/context/AppContext";
import { addCategory, deleteCategory } from '@/lib/menu';

type CategoryFormValues = z.infer<typeof categorySchema>;

export default function CategoryManager() {
  const { categories, loading } = useContext(AppContext);
  const { toast } = useToast();

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (data: CategoryFormValues) => {
    try {
      await addCategory({ name: data.name });
      toast({ title: "Category Added", description: `"${data.name}" has been added.` });
      form.reset();
    } catch (e) {
      toast({ title: "Error", description: "Failed to add category", variant: "destructive" });
    }
  };
  
  const handleDelete = async (categoryId: string) => {
    try {
      await deleteCategory(categoryId);
      toast({ title: "Category Deleted" });
    } catch (e) {
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Manage Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex items-start gap-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="flex-grow">
                  <FormControl>
                    <Input placeholder="New category name..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Add Category</Button>
          </form>
        </Form>
        <div className="space-y-2">
          <h4 className="font-medium">Existing Categories</h4>
          <div className="border rounded-md p-2 space-y-2 max-h-60 overflow-y-auto">
            {loading ? <p>Loading...</p> : categories.length > 0 ? (
              categories.map((cat) => (
                <div key={cat.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                  <span>{cat.name}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive h-8 w-8"
                    onClick={() => handleDelete(cat.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground p-2">No categories found.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
