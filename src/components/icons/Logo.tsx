import React from 'react';
import Image from 'next/image';

const Logo = (props: React.SVGProps<SVGSVGElement>) => (
    <Image 
        src="/logo.jpg" 
        alt="The Hungry House Hub"
        width={80}
        height={80}
        {...props}
    />
);

export default Logo;
