
'use client';

import { type Table } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Armchair, Utensils } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContext } from "react";
import { AppContext } from "@/context/AppContext";

type InProgressOrders = Record<string, { items: any[]; customerInfo: { name: string; phone: string } }>;

interface SelectTableProps {
    onTableSelect: (table: Table) => void;
    selectedTable: Table | null;
    inProgressOrders: InProgressOrders;
}

export default function SelectTable({ onTableSelect, selectedTable, inProgressOrders }: SelectTableProps) {
    const { tables, loading } = useContext(AppContext);
    
    const getTableStatus = (table: Table): 'available' | 'occupied' => {
        // An in-progress order exists if the key is in the map and it has items or customer info.
        const inProgressOrder = inProgressOrders[table.id];
        if (inProgressOrder && (inProgressOrder.items.length > 0 || inProgressOrder.customerInfo.name || inProgressOrder.customerInfo.phone)) {
            return 'occupied';
        }
        // Fallback to the status from the database (e.g., if an order was placed but page was refreshed).
        // A truly available table will have status 'available' and no in-progress order.
        return table.status === 'occupied' ? 'occupied' : 'available';
    };

    const handleTableClick = (table: Table) => {
        onTableSelect(table);
    };

    const getStatusStyles = (status: 'available' | 'occupied') => {
        switch (status) {
            case 'available':
                return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', icon: <Utensils className="h-5 w-5 mx-auto text-green-600" /> };
            case 'occupied':
                return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', icon: <Armchair className="h-5 w-5 mx-auto text-red-600" /> };
            default:
                return { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300', icon: <Armchair className="h-5 w-5 mx-auto text-gray-600" /> };
        }
    };

    if (loading) {
        return (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-36 rounded-lg" />)}
            </div>
        );
    }

    return (
        <div>
            {tables.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {tables.map(table => {
                        const status = getTableStatus(table);
                        const isSelected = selectedTable?.id === table.id;
                        const styles = getStatusStyles(status);
                        // Show the customer name if it's an in-progress order.
                        const customerName = status === 'occupied' ? inProgressOrders[table.id]?.customerInfo?.name : '';

                        return (
                            <Card
                                key={table.id}
                                onClick={() => handleTableClick(table)}
                                className={cn(
                                    "transition-all duration-200 flex flex-col justify-between cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-primary/50",
                                    styles.bg, styles.border,
                                    isSelected && "ring-2 ring-primary shadow-lg"
                                )}
                            >
                                <CardHeader className="p-3 text-center">
                                    <CardTitle className={cn("text-lg font-bold", styles.text)}>{table.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 text-center flex-grow flex flex-col items-center justify-center">
                                    {styles.icon}
                                    <p className={cn("text-sm font-semibold capitalize mt-2", styles.text)}>
                                        {status}
                                    </p>
                                    {customerName && (
                                        <p className={cn("text-xs font-medium truncate mt-1", styles.text, "w-full px-1")}>
                                            by: {customerName}
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center text-muted-foreground py-10 border-2 border-dashed rounded-lg">
                    <p>No tables have been configured.</p>
                    <p className="text-sm">Please go to the Admin Dashboard to add tables.</p>
                </div>
            )}
        </div>
    );
}
