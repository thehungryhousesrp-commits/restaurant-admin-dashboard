'use client';

import { type Table } from "@/lib/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Armchair, User, Utensils, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useContext, useMemo } from "react";
import { AppContext } from "@/context/AppContext";

// --- Enhanced Data Model with Mock Data ---
// In a real application, this data would come from your backend (e.g., Firestore).
type EnrichedTable = Table & {
    partySize?: number;
    serverName?: string;
    status: 'available' | 'occupied' | 'reserved' | 'cleaning';
};

// Props updated to handle the new enriched table type
interface SelectTableProps {
    onTableSelect: (table: EnrichedTable | null) => void;
    selectedTable: EnrichedTable | null;
}

export default function SelectTable({ onTableSelect, selectedTable }: SelectTableProps) {
    const { tables: rawTables, loading } = useContext(AppContext);

    // --- Mock Data Enrichment ---
    // This adds placeholder data for party size, server, and new statuses.
    // This logic should be replaced with real data from Firestore when available.
    const enrichedTables: EnrichedTable[] = useMemo(() => {
        return rawTables.map((table, index) => {
            const mockData: Partial<EnrichedTable> = {};
            switch (index % 5) {
                case 1:
                    mockData.status = 'occupied';
                    mockData.partySize = 4;
                    mockData.serverName = 'Anjali';
                    break;
                case 2:
                     mockData.status = 'occupied';
                    mockData.partySize = 2;
                    mockData.serverName = 'Ravi';
                    break;
                case 3:
                    mockData.status = 'reserved';
                    mockData.partySize = 6;
                    break;
                case 4:
                    mockData.status = 'cleaning';
                    break;
                default:
                    mockData.status = 'available';
                    break;
            }
            // Ensure original status from DB is used if not mocked
            const finalStatus = mockData.status || table.status;
            return { ...table, ...mockData, status: finalStatus };
        });
    }, [rawTables]);
    

    const handleTableClick = (table: EnrichedTable) => {
        // Only available tables are selectable
        if (table.status !== 'available') return;

        if (selectedTable?.id === table.id) {
            onTableSelect(null);
        } else {
            onTableSelect(table);
        }
    };

    // --- Dynamic Styling based on Status ---
    const getStatusStyles = (status: EnrichedTable['status']) => {
        switch (status) {
            case 'available':
                return { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300', icon: <Utensils className="h-5 w-5 mx-auto text-green-600" /> };
            case 'occupied':
                return { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300', icon: <Armchair className="h-5 w-5 mx-auto text-red-600" /> };
            case 'reserved':
                return { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-300', icon: <User className="h-5 w-5 mx-auto text-blue-600" /> };
            case 'cleaning':
                 return { bg: 'bg-yellow-100', text: 'text-yellow-800', border: 'border-yellow-300', icon: <Sparkles className="h-5 w-5 mx-auto text-yellow-600" /> };
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
            {enrichedTables.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {enrichedTables.map(table => {
                        const isSelectable = table.status === 'available';
                        const isSelected = selectedTable?.id === table.id;
                        const styles = getStatusStyles(table.status);

                        return (
                            <Card
                                key={table.id}
                                onClick={() => handleTableClick(table)}
                                className={cn(
                                    "transition-all duration-200 flex flex-col justify-between",
                                    styles.bg, styles.border,
                                    isSelectable ? "cursor-pointer hover:shadow-lg hover:ring-2 hover:ring-primary/50" : "cursor-not-allowed opacity-90",
                                    isSelected && isSelectable && "ring-2 ring-primary shadow-lg"
                                )}
                            >
                                <CardHeader className="p-3 text-center">
                                    <CardTitle className={cn("text-lg font-bold", styles.text)}>{table.name}</CardTitle>
                                </CardHeader>
                                <CardContent className="p-3 text-center flex-grow flex flex-col items-center justify-center">
                                    {styles.icon}
                                    <p className={cn("text-sm font-semibold capitalize mt-2", styles.text)}>
                                        {table.status.replace('_', ' ')}
                                    </p>
                                    {table.partySize && (
                                        <p className="text-xs text-muted-foreground mt-1">{table.partySize} Guests</p>
                                    )}
                                </CardContent>
                                <CardFooter className={cn("p-2 text-center text-xs justify-center", styles.text)}>
                                    {table.serverName ? `Served by: ${table.serverName}` : ''}
                                </CardFooter>
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
