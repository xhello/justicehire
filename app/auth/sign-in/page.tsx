import Header from "@/components/Header";
import SignInForm from "./SignInForm";

export const metadata = { title: "Sign in — Company" };

export default function SignInPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-display text-4xl">Sign in</h1>
        <p className="mt-2 text-sm text-muted">
          We&rsquo;ll email you a magic link. No passwords.
        </p>
        <div className="mt-8">
          <SignInForm />
        </div>
        <p className="mt-8 text-sm text-muted">
          New here?{" "}
          <a href="/auth/sign-up" className="underline">
            Create an account
          </a>
          .
        </p>
      </main>
    </>
  );
}
