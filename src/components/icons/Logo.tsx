import React from 'react';

const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <path d="M3 9.5L12 4l9 5.5" />
    <path d="M19 13v6a2 2 0 01-2 2H7a2 2 0 01-2-2v-6" />
    <path d="M12 16a3 3 0 100-6 3 3 0 000 6z" />
    <path d="M12 21v-2" />
    <path d="M12 4V2" />
  </svg>
);

export default Logo;
