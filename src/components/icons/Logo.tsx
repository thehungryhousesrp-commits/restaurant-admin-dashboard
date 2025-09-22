import React from 'react';
import Image from 'next/image';
import { useAppContext } from '@/context/AppContext';

const Logo = (props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) => {
    const { logoDataUri } = useAppContext();

    // Use a local fallback if the data URI is not available yet.
    const logoSrc = logoDataUri || '/logo.jpg';

    return (
        <Image
            src={logoSrc}
            alt="The Hungry House Hub Logo"
            width={80}
            height={80}
            {...props}
            // If the src is a data URI, we don't need the unoptimized prop,
            // but it's good practice for external URLs you don't control.
            unoptimized={logoSrc.startsWith('data:image')}
        />
    );
};

export default Logo;