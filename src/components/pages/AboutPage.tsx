"use client";

import Head from 'next/head';
import { AnimatedDiagrams } from './AnimatedDiagrams';
import { Info, GitBranch, Calendar } from 'lucide-react';


const AboutPageContent = ({ adminName }: { adminName: string }) => {
  const lastUpdatedDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });

  return (
    <>
      <Head>
        <title>About Developer - Pragati Path Solutions</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700;800&family=Poppins:wght@400;600&display=swap" rel="stylesheet" />
      </Head>
      <style jsx global>{`
        .pps-banner-body {
            --primary-color: #0052CC;
            --secondary-color: #2EC4B6;
            --accent-color: #FF6B35;
            --text-light: #E0F2F1;
            --text-dark: #FFFFFF;
            --bg-dark: #1D2D3A;
            background-color: var(--bg-dark);
            font-family: 'Poppins', sans-serif;
            color: var(--text-light);
            overflow-x: hidden;
        }

        .pps-banner {
            position: relative;
            width: 100%;
            min-height: 500px;
            padding: 50px 70px;
            overflow: hidden;
            background: linear-gradient(135deg, var(--primary-color) 0%, #0d2f5a 100%);
            color: var(--text-dark);
        }
        
        .pps-banner::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image:
                linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px);
            background-size: 40px 40px;
            animation: pps-pan-grid 30s linear infinite;
            z-index: 1;
        }

        @keyframes pps-pan-grid {
            0% { background-position: 0 0; }
            100% { background-position: 40px 40px; }
        }

        .pps-animated-bg {
            position: absolute;
            border-radius: 50%;
            filter: blur(80px);
            opacity: 0.4;
            animation-timing-function: ease-in-out;
            animation-iteration-count: infinite;
            z-index: 0;
        }
        .pps-circle1 { width: 450px; height: 450px; background: var(--secondary-color); top: -150px; left: -100px; animation: pps-float1 22s; }
        .pps-circle2 { width: 380px; height: 380px; background: var(--accent-color); bottom: -200px; right: -150px; animation: pps-float2 28s; }
        .pps-circle3 { width: 300px; height: 300px; background: #5634f1; top: 50%; right: 20%; animation: pps-float3 35s; }

        @keyframes pps-float1 { 0%, 100% { transform: translateY(0) translateX(0) scale(1); } 50% { transform: translateY(40px) translateX(30px) scale(1.1); } }
        @keyframes pps-float2 { 0%, 100% { transform: translateY(0) translateX(0) scale(1); } 50% { transform: translateY(-35px) translateX(-25px) scale(1.05); } }
        @keyframes pps-float3 { 0%, 100% { transform: translateY(0) translateX(0) scale(1); } 50% { transform: translateY(25px) translateX(-35px) scale(1.12); } }

        .pps-content {
            position: relative;
            max-width: 650px;
            z-index: 10;
        }

        .pps-logo img {
            width: 200px;
            margin-bottom: 25px;
            animation: pps-fadeInDown 0.8s ease-out;
        }

        .pps-headline {
            font-family: 'Montserrat', sans-serif;
            font-size: 3.5rem;
            font-weight: 800;
            line-height: 1.15;
            margin-bottom: 20px;
            text-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            animation: pps-fadeInUp 0.8s 0.2s ease-out backwards;
        }

        .pps-subheadline {
            font-size: 1.3rem;
            margin-bottom: 35px;
            color: var(--text-light);
            max-width: 550px;
            animation: pps-fadeInUp 0.8s 0.4s ease-out backwards;
        }

        .pps-cta-buttons {
            display: flex;
            gap: 20px;
            margin-bottom: 45px;
            animation: pps-fadeInUp 0.8s 0.6s ease-out backwards;
        }

        .pps-btn {
            padding: 16px 38px;
            font-size: 1rem;
            font-weight: 700;
            font-family: 'Montserrat', sans-serif;
            border-radius: 50px;
            cursor: pointer;
            text-decoration: none;
            display: inline-flex;
            align-items: center;
            gap: 10px;
            transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
            user-select: none;
            border: none;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 0, 0, 0.08);
        }
        .pps-btn:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
        }
        .pps-btn:active {
            transform: translateY(-1px);
        }
        .pps-btn-primary { background-color: var(--accent-color); color: var(--text-dark); }
        .pps-btn-secondary { background-color: rgba(255, 255, 255, 0.15); color: var(--text-dark); backdrop-filter: blur(10px); }

        .pps-contact-info {
            display: flex;
            gap: 30px;
            animation: pps-fadeInUp 0.8s 0.8s ease-out backwards;
        }
        .pps-contact-item {
            display: flex;
            align-items: center;
            gap: 12px;
        }
        .pps-contact-item a {
            color: var(--text-light);
            text-decoration: none;
            font-size: 1rem;
            font-weight: 600;
            transition: color 0.3s ease;
        }
        .pps-contact-item a:hover { color: var(--accent-color); }
        .pps-contact-item svg {
            fill: var(--accent-color);
            width: 24px;
            height: 24px;
        }
        
        @keyframes pps-fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        @keyframes pps-fadeInDown {
            from { opacity: 0; transform: translateY(-20px); }
            to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 980px) {
            .pps-banner {
                flex-direction: column;
                min-height: auto;
                padding: 40px 30px;
                text-align: center;
            }
            .pps-content { max-width: 100%; }
            .pps-cta-buttons { justify-content: center; }
            .pps-contact-info {
                flex-direction: column;
                justify-content: center;
                gap: 15px;
                align-items: center;
            }
            .pps-headline { font-size: 2.5rem; }
            .pps-subheadline { font-size: 1.1rem; }
        }

        @media (max-width: 480px) {
            .pps-headline { font-size: 2rem; }
            .pps-cta-buttons { flex-direction: column; }
        }
      `}</style>
      <div className="pps-banner-body">
        <section className="pps-banner" role="banner" aria-label="Pragati Path Solutions Homepage Banner">
            <div className="pps-animated-bg pps-circle1"></div>
            <div className="pps-animated-bg pps-circle2"></div>
            <div className="pps-animated-bg pps-circle3"></div>

            <div className="flex items-center justify-between w-full">
                <div className="pps-content">
                    <div className="pps-logo" aria-label="Pragati Path Solutions Logo">
                        <img src="https://i.ibb.co/nTRZV7T/5fad425b-56e6-49d5-9781-f7420aeea30b-removebg-preview-1.png" alt="Pragati Path Solutions Logo" />
                    </div>

                    <h1 className="pps-headline">
                        Transforming Ideas into Intelligent Applications
                    </h1>
                    <p className="pps-subheadline">
                        Expert Flutter Apps, Scalable Web Solutions, and End-to-End Support to elevate your business.
                    </p>

                    <nav className="pps-cta-buttons" aria-label="Call to Action Buttons">
                        <a href="https://pragatipathsolutions.com" target="_blank" rel="noopener" className="pps-btn pps-btn-primary" role="button">Get Started with your idea</a>
                        <a href="tel:+918062180843" className="pps-btn pps-btn-secondary" role="button">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M6.62 10.79a15.054 15.054 0 0 0 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1v3.49a1 1 0 0 1-1 1C10.01 22 3 14.99 3 6a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57c.11.35.03.74-.25 1.02l-2.2 2.2z"/></svg>
                            Call Us
                        </a>
                        <a href="https://wa.me/918062180843" target="_blank" rel="noopener" className="pps-btn pps-btn-secondary" role="button">
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24"><path d="M19.03 4.97a10 10 0 0 0-14.06 0 10 10 0 0 0 0 14.06c3.8 3.8 10.26 3.8 14.06 0s3.8-10.26 0-14.06zM9.43 17.52c-.34 0-.68-.06-1-.18l-2.6.68.7-2.54a5.4 5.4 0 0 1-1.03-2.92c0-3 2.44-5.44 5.44-5.44a5.34 5.34 0 0 1 3.82 1.62c2.12 2.12 2.12 5.56 0 7.68-1.08 1.08-2.5 1.7-4.04 1.76h-.29zm5.17-5.18c-.28-.14-1.65-.82-1.9-.91-.26-.1-.45-.14-.64.14-.19.28-.72.91-.88 1.1-.16.19-.32.21-.6.07-.28-.14-1.17-.43-2.23-1.37-.83-.73-1.39-1.63-1.55-1.9-.16-.28-.02-.43.12-.57.13-.13.28-.32.42-.48.14-.16.19-.28.28-.47.1-.19.05-.36-.02-.5L9.9 9.17c-.24-.58-.5-.63-.68-.64-.18-.01-.38-.01-.58-.01-.2 0-.52.07-.78.35-.26.28-.99.97-.99 2.37s1.01 2.76 1.15 2.95c.14.19 1.99 3.03 4.83 4.25 2.84 1.22 2.84.82 3.36.75.52-.07 1.65-.67 1.88-1.32.23-.65.23-1.2.16-1.32c-.07-.12-.26-.19-.54-.33z"/></svg>
                            Tap to Chat
                        </a>
                    </nav>
                </div>
            </div>
        </section>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="text-center mb-8">
                <h2 className="text-4xl font-headline font-extrabold tracking-tight text-white sm:text-5xl">
                    Welcome, {adminName}!
                </h2>
                <p className="mt-4 max-w-3xl mx-auto text-xl text-gray-400">
                    This is the Developer Insight Panel for the <span className="text-primary-color font-bold">Hungry House Hub</span> application.
                </p>
            </div>
            
            <div className="max-w-4xl mx-auto p-4 rounded-lg border border-yellow-500/50 bg-yellow-900/30 text-yellow-200 mb-12 flex items-start gap-4">
                <Info className="h-5 w-5 flex-shrink-0 mt-1" />
                <div>
                    <h4 className="font-bold">Confidential Information</h4>
                    <p className="text-sm text-yellow-300/90">The diagrams and technical details on this page are for admin and business development purposes only. Please do not share them publicly.</p>
                </div>
            </div>


            <div className="bg-gray-800/20 rounded-lg p-6 md:p-8 mb-12">
                <h3 className="text-2xl font-headline font-bold text-white mb-4">Application Overview</h3>
                <p className="text-gray-300 mb-4">
                    The Hungry House Hub is a modern, AI-powered restaurant management system designed for seamless operation. It allows staff to quickly take orders, manage the menu, and automatically generate invoices. The admin panel provides powerful tools, including an AI-driven bulk menu uploader, to simplify restaurant management.
                </p>
                <div className="flex flex-wrap gap-2">
                    <span className="bg-blue-900/50 text-blue-300 text-xs font-medium px-2.5 py-0.5 rounded-full">Next.js</span>
                    <span className="bg-yellow-900/50 text-yellow-300 text-xs font-medium px-2.5 py-0.5 rounded-full">Firebase</span>
                    <span className="bg-green-900/50 text-green-300 text-xs font-medium px-2.5 py-0.5 rounded-full">Genkit (Gemini AI)</span>
                    <span className="bg-indigo-900/50 text-indigo-300 text-xs font-medium px-2.5 py-0.5 rounded-full">React</span>
                    <span className="bg-sky-900/50 text-sky-300 text-xs font-medium px-2.5 py-0.5 rounded-full">Tailwind CSS</span>
                </div>
            </div>

            <div className="bg-gray-800/20 rounded-lg p-6 md:p-8">
                 <h3 className="text-2xl font-headline font-bold text-white mb-4 text-center">Live Architecture Diagrams</h3>
                <AnimatedDiagrams />
            </div>

            <div className="mt-12 text-center text-gray-500 text-sm space-y-2">
                <div className="flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4" />
                        <span>Version 1.1</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Last Updated: {lastUpdatedDate}</span>
                    </div>
                </div>
                 <p>by Team Pragati Path Solutions</p>
            </div>

        </div>
      </div>
    </>
  );
};

export default AboutPageContent;

    