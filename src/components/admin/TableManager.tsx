"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { tableSchema } from "@/lib/schemas";
import { Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { useContext } from "react";
import { AppContext } from "@/context/AppContext";
import { addDoc, collection, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";

type TableFormValues = z.infer<typeof tableSchema>;

export default function TableManager() {
  const { tables, loading } = useContext(AppContext);
  const { toast } = useToast();

  const form = useForm<TableFormValues>({
    resolver: zodResolver(tableSchema),
    defaultValues: { name: "" },
  });

  const onSubmit = async (data: TableFormValues) => {
    try {
      await addDoc(collection(db, "tables"), { name: data.name, status: 'available' });
      toast({ title: "Table Added", description: `"${data.name}" has been added.` });
      form.reset();
    } catch (error) {
      console.error("Error adding table: ", error);
      toast({ title: "Error", description: "Failed to add table.", variant: "destructive" });
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
        await deleteDoc(doc(db, "tables", id));
        toast({ title: "Table Deleted", description: "The table has been removed." });
    } catch (error) {
        console.error("Error deleting table: ", error);
        toast({ title: "Error", description: "Failed to delete table.", variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Manage Tables</CardTitle>
        <CardDescription>Add, view, and remove dining tables.</CardDescription>
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
                    <Input placeholder="New table name (e.g., Table 5)" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit">Add Table</Button>
          </form>
        </Form>
        <div className="space-y-2">
          <h4 className="font-medium">Existing Tables</h4>
          <div className="border rounded-md p-2 space-y-2 max-h-60 overflow-y-auto">
            {loading ? <p>Loading...</p> : tables.length > 0 ? (
              tables.map((table) => (
                <div key={table.id} className="flex items-center justify-between p-2 bg-secondary rounded-md">
                  <div className="flex items-center gap-3">
                    <span>{table.name}</span>
                    <Badge variant={table.status === 'available' ? 'default' : 'destructive'} className="capitalize bg-green-500">
                      {table.status}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive h-8 w-8"
                    onClick={() => handleDelete(table.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground p-2">No tables found. Add one to get started.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
