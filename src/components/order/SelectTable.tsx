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

    const availableTables = tables.filter(t => t.status === 'available');

    const handleTableClick = (table: Table) => {
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
            <h3 className="text-lg font-semibold mb-3">1. Select an Available Table</h3>
            {availableTables.length > 0 ? (
                <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {availableTables.map(table => (
                        <Card 
                            key={table.id}
                            onClick={() => handleTableClick(table)}
                            className={cn(
                                "cursor-pointer transition-all duration-200 text-center",
                                "hover:shadow-lg hover:border-primary-500/80",
                                selectedTable?.id === table.id 
                                    ? "border-2 border-primary shadow-lg ring-2 ring-primary/20"
                                    : "border"
                            )}
                        >
                            <CardHeader className="p-2 pb-1">
                                <CardTitle className="text-base font-bold">{table.name}</CardTitle>
                            </CardHeader>
                            <CardContent className="p-2 pt-0">
                                <Armchair className="h-6 w-6 mx-auto text-green-600" />
                                <p className="text-xs text-muted-foreground mt-1">Available</p>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-6 border-2 border-dashed rounded-lg">
                    <p>No tables are currently available.</p>
                </div>
            )}
        </div>
    );
}
