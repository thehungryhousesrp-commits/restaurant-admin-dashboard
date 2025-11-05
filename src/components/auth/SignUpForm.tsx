
"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { signupSchema } from '@/lib/schemas';
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, updateProfile, RecaptchaVerifier, signInWithPhoneNumber, type ConfirmationResult } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { Loader2, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

type SignUpFormValues = z.infer<typeof signupSchema>;

// This function must be called in a useEffect to avoid creating multiple verifiers.
const setupRecaptcha = () => {
    if (!auth) return;
    if (!(window as any).recaptchaVerifier) {
      (window as any).recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
          'size': 'invisible',
          'callback': (response: any) => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
          }
      });
    }
    return (window as any).recaptchaVerifier;
}

export default function SignUpForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  useEffect(() => {
    // Setup reCAPTCHA on component mount
    setupRecaptcha();
  }, []);

  const form = useForm<SignUpFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      phone: '',
    },
  });

  const handleSendOtp = async () => {
    const phoneNumber = form.getValues('phone');
    if (!/^\+?91[6-9]\d{9}$/.test(phoneNumber)) {
        form.setError('phone', { type: 'manual', message: 'Please enter a valid Indian phone number (e.g., +919876543210).' });
        return;
    }
    setSendingOtp(true);
    try {
        const appVerifier = (window as any).recaptchaVerifier;
        const result = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
        setConfirmationResult(result);
        setOtpSent(true);
        toast({ title: "OTP Sent", description: "Please check your phone for the verification code." });
    } catch (error) {
        console.error("Error sending OTP:", error);
        toast({ title: "Failed to Send OTP", description: "Please check the phone number and try again.", variant: "destructive" });
    } finally {
        setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!confirmationResult || !otp) return;
    setVerifyingOtp(true);
    try {
        await confirmationResult.confirm(otp);
        setPhoneVerified(true);
        setOtpSent(false); // Hide OTP field
        toast({ title: "Phone Verified!", className: "bg-green-100 border-green-300 text-green-800" });
    } catch (error) {
        console.error("Error verifying OTP:", error);
        toast({ title: "Invalid OTP", description: "The code you entered is incorrect. Please try again.", variant: "destructive" });
    } finally {
        setVerifyingOtp(false);
    }
  };

  const onSubmit = async (data: SignUpFormValues) => {
    if (!phoneVerified) {
        toast({ title: "Phone Not Verified", description: "Please verify your phone number to continue.", variant: "destructive" });
        return;
    }
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: data.name });

      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, {
        uid: user.uid,
        displayName: data.name,
        email: user.email,
        phoneNumber: data.phone,
        restaurantIds: [],
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Account Created!",
        description: "Redirecting you to set up your first restaurant.",
      });

      router.push('/');

    } catch (error: any) {
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/email-already-in-use') {
        description = "This email is already in use. Please log in or use a different email.";
      }
      toast({
        title: "Sign Up Failed",
        description,
        variant: "destructive",
      });
      console.error("Sign up error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div id="recaptcha-container"></div>
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} disabled={loading}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} disabled={loading}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={loading}/>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number</FormLabel>
              <div className="flex items-center gap-2">
                <FormControl>
                  <div className="relative w-full">
                    <Input 
                      type="tel" 
                      placeholder="+919876543210" 
                      {...field}
                      disabled={otpSent || phoneVerified || loading}
                      className={cn(phoneVerified && "border-green-500 focus-visible:ring-green-500")}
                    />
                    {phoneVerified && <CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />}
                  </div>
                </FormControl>
                {!phoneVerified && (
                  <Button type="button" onClick={handleSendOtp} disabled={sendingOtp || !field.value} className="shrink-0">
                    {sendingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {otpSent ? 'Resend' : 'Send OTP'}
                  </Button>
                )}
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
        
        {otpSent && !phoneVerified && (
          <div className="space-y-2">
              <FormLabel>Enter OTP</FormLabel>
              <div className="flex items-center gap-2">
                <Input 
                  type="text" 
                  maxLength={6} 
                  placeholder="123456" 
                  value={otp} 
                  onChange={(e) => setOtp(e.target.value)}
                  className="tracking-widest text-center"
                />
                <Button type="button" onClick={handleVerifyOtp} disabled={verifyingOtp || otp.length !== 6}>
                  {verifyingOtp && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify
                </Button>
              </div>
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading || !phoneVerified}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Create Account
        </Button>
      </form>
    </Form>
  );
}
