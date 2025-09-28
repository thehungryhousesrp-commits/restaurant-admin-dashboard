"use client";

import { Code, GitBranch, Workflow } from 'lucide-react';
import Head from 'next/head';

const AboutPageContent = ({ adminName }: { adminName: string }) => {
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
            min-height: 600px;
            padding: 50px 70px;
            overflow: hidden;
            background: linear-gradient(135deg, var(--primary-color) 0%, #0d2f5a 100%);
            color: var(--text-dark);
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
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

        .pps-extra-info {
            width: 100%;
            max-width: 1200px;
            margin: 30px auto;
            color: var(--text-light);
            font-weight: 600;
            font-size: 0.9rem;
            display: flex;
            gap: 15px;
            justify-content: center;
            flex-wrap: wrap;
        }
        .pps-extra-info span {
            background: rgba(255 255 255 / 0.08);
            padding: 10px 20px;
            border-radius: 20px;
            transition: all 0.3s ease;
            cursor: default;
        }
        .pps-extra-info span:hover {
            background: rgba(255 255 255 / 0.15);
            transform: translateY(-2px);
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
            .pps-extra-info { font-size: 0.8rem; }
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
            <div className="text-center mb-12">
                <h2 className="text-4xl font-headline font-extrabold tracking-tight text-white sm:text-5xl">
                    Welcome, {adminName}!
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-400">
                    This is your developer insight panel for the Hungry House Hub application.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mx-auto">
                        <Code className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-lg font-medium text-white font-headline">ER Diagram</h3>
                    <p className="mt-2 text-base text-gray-400">
                        Placeholder for the Entity-Relationship diagram showing database schema and relations.
                    </p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mx-auto">
                        <Workflow className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-lg font-medium text-white font-headline">Flow Diagram</h3>
                    <p className="mt-2 text-base text-gray-400">
                        Placeholder for the application's main user and data flow diagrams.
                    </p>
                </div>

                <div className="bg-gray-800/50 rounded-lg p-6 text-center">
                    <div className="flex items-center justify-center h-12 w-12 rounded-md bg-primary text-white mx-auto">
                        <GitBranch className="h-6 w-6" />
                    </div>
                    <h3 className="mt-5 text-lg font-medium text-white font-headline">Sequence Diagram</h3>
                    <p className="mt-2 text-base text-gray-400">
                        Placeholder for sequence diagrams illustrating key interactions, e.g., order placement.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </>
  );
};

export default AboutPageContent;
