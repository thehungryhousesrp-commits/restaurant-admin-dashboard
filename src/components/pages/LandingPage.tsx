
'use client';

import { Button } from '@/components/ui/button';
import { CheckCircle, Zap, Shield, BarChart, Gem, Users, GitBranch } from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    icon: <Zap className="h-8 w-8 text-primary" />,
    title: 'Quick & Easy Onboarding',
    description: "Get your restaurant online in minutes. Our simple setup process means you're ready to take orders almost instantly.",
  },
  {
    icon: <GitBranch className="h-8 w-8 text-primary" />,
    title: 'Multi-Branch Management',
    description: 'Manage unlimited outlets from a single, powerful admin panel. Track sales, inventory, and staff across all your locations.',
  },
  {
    icon: <BarChart className="h-8 w-8 text-primary" />,
    title: 'Unified Dashboard',
    description: 'Track live sales, table status, and incoming orders in one place. Make informed decisions with real-time data.',
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Secure Staff Logins',
    description: 'Create unique logins for your staff with role-based permissions. Control access and track activity with ease.',
  },
  {
    icon: <Shield className="h-8 w-8 text-primary" />,
    title: 'Compliance Ready',
    description: 'Built for the Indian market with GST, FSSAI, and DPDP Act compliance in mind to keep your business secure.',
  },
  {
    icon: <Gem className="h-8 w-8 text-primary" />,
    title: 'Modern & Customizable',
    description: 'A sleek interface that you can customize. Reskot is built to be modern, scalable, and adaptable to your brand.',
  },
];

const whyReskot = [
    { title: 'Cloud-Based Freedom', description: 'Access your dashboard from anywhere, on any device. No bulky hardware required.' },
    { title: 'Built for Scale', description: 'Whether you have one outlet or one hundred, our platform grows with you.' },
    { title: 'Your Data, Your Control', description: 'Unlike aggregators, your customer data is yours. Build direct relationships and loyalty.' },
    { title: 'Low Downtime', description: 'With a robust cloud infrastructure, we ensure your operations are always running smoothly.' },
    { title: 'Dedicated Support', description: 'Our team is here to help you 24/7, ensuring you get the most out of Reskot.' },
    { title: 'Affordable Pricing', description: 'Get enterprise-level features at a price that makes sense for your business.' },
];

export default function LandingPage() {
  return (
    <div className="bg-background text-foreground">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gray-900 text-white py-20 sm:py-32">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-transparent to-gray-900"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
            <img src="https://i.ibb.co/nTRZV7T/5fad425b-56e6-49d5-9781-f7420aeea30b-removebg-preview-1.png" alt="Reskot Logo" className="mx-auto mb-6 h-20" />
            <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                The Ultimate Cloud POS for the Modern Indian Restaurant
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-lg text-gray-300">
                Grow your business with Reskot – a powerful, all-in-one platform to manage orders, staff, and multiple outlets with ease and efficiency.
            </p>
            <div className="mt-10 flex justify-center gap-4 flex-wrap">
                <Button asChild size="lg" className="font-semibold text-base bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-transform hover:scale-105">
                    <Link href="/signup">Start Free Trial</Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="font-semibold text-base bg-white/10 border-white/20 hover:bg-white/20 backdrop-blur-sm transition-transform hover:scale-105">
                    <Link href="/kitchen">See Live Demo</Link>
                </Button>
            </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-24 bg-gray-100 dark:bg-gray-900">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">Everything You Need to Succeed</h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
              From order taking to final billing, Reskot streamlines every aspect of your restaurant's operations.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-background p-6 rounded-xl border border-transparent shadow-sm hover:shadow-primary/10 hover:border-primary/30 transition-all duration-300 transform hover:-translate-y-1">
                <div className="flex items-center gap-4 mb-4">
                    <div className="bg-primary/10 p-3 rounded-lg">{feature.icon}</div>
                    <h3 className="text-xl font-bold font-headline">{feature.title}</h3>
                </div>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* "Why Reskot?" Section */}
      <section className="py-20 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">Why Choose Reskot Over Others?</h2>
            <p className="mt-4 max-w-3xl mx-auto text-muted-foreground">
              Tired of outdated software and high aggregator fees? Reskot is built for growth, control, and peace of mind.
            </p>
          </div>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            {whyReskot.map((item, index) => (
              <div key={index} className="flex items-start gap-4 p-2">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold text-lg">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Final CTA Section */}
      <section className="py-20 sm:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">Ready to Elevate Your Restaurant?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg opacity-90">
                Join hundreds of smart restaurant owners who are building a more profitable and efficient business with Reskot.
            </p>
            <div className="mt-8">
                <Button asChild size="lg" variant="secondary" className="font-semibold text-lg px-10 py-7 shadow-2xl transition-transform hover:scale-105">
                  <Link href="/signup">Start Your Free Trial Today</Link>
                </Button>
            </div>
        </div>
      </section>
      <style jsx global>{`
        .bg-grid-pattern {
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.07) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.07) 1px, transparent 1px);
          background-size: 40px 40px;
          animation: pan-grid 30s linear infinite;
        }

        @keyframes pan-grid {
          0% { background-position: 0 0; }
          100% { background-position: 40px 40px; }
        }
      `}</style>
    </div>
  );
}

    