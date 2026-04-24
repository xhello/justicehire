import Header from "@/components/Header";
import SignInForm from "../sign-in/SignInForm";

export const metadata = { title: "Sign up — Company" };

export default function SignUpPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-6 py-16">
        <h1 className="font-display text-4xl">Create an account</h1>
        <p className="mt-2 text-sm text-muted">
          Sign in with your email and password. If you don&rsquo;t have an account yet,
          use one of the demo accounts.
        </p>
        <div className="mt-8">
          <SignInForm />
        </div>
        <p className="mt-8 text-sm text-muted">
          Want to host?{" "}
          <a href="/signup/host" className="underline">
            Apply here
          </a>
          .
        </p>
      </main>
    </>
  );
}
