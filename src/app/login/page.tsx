
import LoginForm from '@/components/auth/LoginForm';
import PublicHeader from '@/components/layout/PublicHeader';

export default function LoginPage() {
  return (
    <>
      <PublicHeader />
      <div className="container relative flex pt-20 flex-col items-center justify-center lg:px-0">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div className="flex flex-col items-center space-y-2 text-center">
            <h1 className="text-2xl font-headline font-semibold tracking-tight">
              Sign In
            </h1>
            <p className="text-sm text-muted-foreground">
              Enter your credentials to access your account
            </p>
          </div>
          <LoginForm />
        </div>
      </div>
    </>
  );
}
