'use client';

import { type Table } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Armchair } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContext } from "react";
import { AppContext } from "@/context/AppContext";

// Props updated to match parent and handle selection state
interface SelectTableProps {
    onTableSelect: (table: Table | null) => void;
    selectedTable: Table | null;
}

export default function SelectTable({ onTableSelect, selectedTable }: SelectTableProps) {
    const { tables, loading } = useContext(AppContext);

    const handleTableClick = (table: Table) => {
        if (table.status !== 'available') return; // Prevent selecting occupied tables

        // Allow unselecting by clicking the same table again
        if (selectedTable?.id === table.id) {
            onTableSelect(null);
        } else {
            onTableSelect(table);
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-4 gap-4 mb-4">
                {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-24 rounded-lg" />)}
            </div>
        );
    }

    return (
        <div className="mb-6">
            {tables.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {tables.map(table => {
                        const isAvailable = table.status === 'available';
                        const isSelected = selectedTable?.id === table.id;

                        return (
                            <Card 
                                key={table.id}
                                onClick={() => handleTableClick(table)}
                                className={cn(
                                    "transition-all duration-200 text-center",
                                    isAvailable 
                                      ? "cursor-pointer hover:shadow-lg hover:border-primary-500/80" 
                                      : "bg-red-50 border-red-200 cursor-not-allowed opacity-80",
                                    isSelected && isAvailable && "border-2 border-primary shadow-lg ring-2 ring-primary/20"
                                )}
                            >
                                <CardHeader className="p-2 pb-1">
                                    <CardTitle className={cn("text-base font-bold", !isAvailable && "text-red-800")}>{table.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-2 pt-0">
                                    <Armchair className={cn("h-6 w-6 mx-auto", isAvailable ? "text-green-600" : "text-red-500")} />
                                    <p className={cn("text-xs mt-1 font-semibold", isAvailable ? "text-muted-foreground" : "text-red-700")}>
                                      {isAvailable ? 'Available' : 'Occupied'}
                                    </p>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-6 border-2 border-dashed rounded-lg">
                    <p>No tables found. Please add tables in the admin dashboard.</p>
                </div>
            )}
        </div>
    );
}
