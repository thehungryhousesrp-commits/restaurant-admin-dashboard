
"use client";

import { useAppContext } from "@/context/AppContext";
import { type Table } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "../ui/badge";
import { Skeleton } from "../ui/skeleton";
import { Armchair, Users, Edit } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectTableProps {
    onSelectTable: (table: Table) => void;
}

export default function SelectTable({ onSelectTable }: SelectTableProps) {
    const { tables, loading } = useAppContext();

    const availableTables = tables.filter(t => t.status === 'available');
    const occupiedTables = tables.filter(t => t.status !== 'available');

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold font-headline tracking-tight">Select a Table</h1>
                <p className="text-muted-foreground">Choose a table to start a new order or edit an existing one.</p>
            </div>

            {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[...Array(12)].map((_, i) => (
                        <Skeleton key={i} className="h-32 rounded-lg" />
                    ))}
                </div>
            ) : (
                <>
                    <h2 className="text-xl font-semibold mb-4 border-b pb-2">Available Tables</h2>
                    {availableTables.length > 0 ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {availableTables.map(table => (
                                <Card 
                                    key={table.id}
                                    onClick={() => onSelectTable(table)}
                                    className="cursor-pointer transition-all duration-200 hover:shadow-xl hover:border-primary hover:scale-105"
                                >
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <CardTitle className="text-sm font-medium">{table.name}</CardTitle>
                                        <Armchair className="h-4 w-4 text-muted-foreground" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-green-500">Available</div>
                                        <p className="text-xs text-muted-foreground">Click to start order</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">No tables are currently available.</p>
                        </div>
                    )}

                    {occupiedTables.length > 0 && (
                       <div className="mt-12">
                            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Occupied & Active Tables</h2>
                             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                                {occupiedTables.map(table => (
                                    <Card 
                                        key={table.id}
                                        onClick={() => onSelectTable(table)}
                                        className="cursor-pointer transition-all duration-200 hover:shadow-xl hover:border-yellow-500 hover:scale-105"
                                    >
                                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                            <CardTitle className="text-sm font-medium">{table.name}</CardTitle>
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                        </CardHeader>
                                        <CardContent>
                                            <div className={cn(
                                                "text-2xl font-bold",
                                                table.status === 'occupied' && 'text-yellow-500',
                                                table.status === 'reserved' && 'text-orange-500'
                                            )}>
                                                {table.status.charAt(0).toUpperCase() + table.status.slice(1)}
                                            </div>
                                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Edit className="h-3 w-3" /> Click to edit order
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                       </div>
                    )}
                </>
            )}
        </div>
    );
}
