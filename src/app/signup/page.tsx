import Link from 'next/link';
import SignUpForm from '@/components/auth/SignUpForm';

export default function SignUpPage() {
  return (
    <div className="container relative flex pt-20 flex-col items-center justify-center lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col items-center space-y-2 text-center">
          <h1 className="text-2xl font-headline font-semibold tracking-tight">
            Create an Account
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your details to start using Reskot
          </p>
        </div>
        <SignUpForm />
        <p className="px-8 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href="/login" className="underline underline-offset-4 hover:text-primary">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
