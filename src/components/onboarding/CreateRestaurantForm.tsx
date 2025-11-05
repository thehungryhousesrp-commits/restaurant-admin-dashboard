
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { createRestaurantSchema } from '@/lib/schemas';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { doc, collection, writeBatch, serverTimestamp, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';

type FormValues = z.infer<typeof createRestaurantSchema>;

interface CreateRestaurantFormProps {
    user: FirebaseUser;
    onFormSubmit?: () => void; // Optional callback
}

export default function CreateRestaurantForm({ user, onFormSubmit }: CreateRestaurantFormProps) {    
    const { toast } = useToast();
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    const form = useForm<FormValues>({
        resolver: zodResolver(createRestaurantSchema),
        defaultValues: { restaurantName: '' },
    });

    const onSubmit = async (data: FormValues) => {
        setLoading(true);
        const batch = writeBatch(db);

        try {
            // 1. Create a new restaurant document
            const newRestaurantRef = doc(collection(db, 'restaurants'));
            batch.set(newRestaurantRef, {
                name: data.restaurantName,
                ownerId: user.uid,
                createdAt: serverTimestamp(),
            });

            // 2. Update the user's document to add the new restaurant ID and set it as active
            const userDocRef = doc(db, 'users', user.uid);
            batch.update(userDocRef, {
                restaurantIds: arrayUnion(newRestaurantRef.id),
                activeRestaurantId: newRestaurantRef.id,
            });

            // 3. Commit the batch transaction
            await batch.commit();

            toast({
                title: "Restaurant Created!",
                description: `"${data.restaurantName}" is ready.`,
            });
            
            // 4. If there's a callback, call it. Otherwise, redirect to the main dashboard.
            if (onFormSubmit) {
                onFormSubmit();
            } else {
                router.push('/order-entry');
            }

        } catch (error) {
            console.error("Error creating restaurant:", error);
            toast({
                title: "Creation Failed",
                description: "Could not create your restaurant. Please try again.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="restaurantName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>New Outlet Name</FormLabel>
                            <FormControl>
                                <Input placeholder="e.g., The Grand Indian - Downtown" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <Button type="submit" className="w-full" disabled={loading}>
                    {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Create Outlet
                </Button>
            </form>
        </Form>
    );
}
