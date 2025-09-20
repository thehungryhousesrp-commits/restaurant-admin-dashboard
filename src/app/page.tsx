// This file is now a redirector.
// The actual home page is at /src/app/(app)/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
    redirect('/');
}
