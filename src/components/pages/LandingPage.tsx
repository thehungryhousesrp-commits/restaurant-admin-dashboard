
'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
      <section className="py-20 sm:py-32">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-extrabold font-headline tracking-tight">
            The Ultimate Cloud POS for the Modern Indian Restaurant
          </h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-muted-foreground">
            Grow your business with Reskot – a powerful, all-in-one platform to manage orders, staff, and multiple outlets with ease and efficiency.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg" className="font-semibold">
              <Link href="/login">Get Started for Free</Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="font-semibold">
              <Link href="#features">See Live Demo</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 sm:py-24 bg-secondary/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">Everything You Need to Succeed</h2>
            <p className="mt-4 max-w-xl mx-auto text-muted-foreground">
              From order taking to final billing, Reskot streamlines every aspect of your restaurant's operations.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="bg-background text-center p-6 border-transparent shadow-md hover:shadow-xl hover:border-primary/50 transition-all">
                <div className="flex justify-center mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold font-headline mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* "Why Reskot?" Section */}
      <section className="py-20 sm:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-headline">Why Choose Reskot Over Others?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-muted-foreground">
              Tired of outdated software and high aggregator fees? Reskot is built for growth, control, and peace of mind.
            </p>
          </div>
          <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
            {whyReskot.map((item, index) => (
              <div key={index} className="flex items-start gap-4 p-4">
                <CheckCircle className="h-6 w-6 text-green-500 mt-1 flex-shrink-0" />
                <div>
                  <h4 className="font-semibold">{item.title}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Final CTA Section */}
      <section className="py-20 sm:py-24 bg-primary/10">
        <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl md:text-4xl font-bold font-headline text-primary">Ready to Elevate Your Restaurant?</h2>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">
                Join hundreds of smart restaurant owners who are building a more profitable and efficient business with Reskot.
            </p>
            <div className="mt-8">
                <Button asChild size="lg" className="font-semibold text-lg px-8 py-6">
                  <Link href="/login">Start Your Free Trial Today</Link>
                </Button>
            </div>
        </div>
      </section>
    </div>
  );
}
