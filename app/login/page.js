import { Suspense } from "react";
import Header from "@/components/Header";
import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <>
      <Header />
      <Suspense fallback={null}>
        <AuthForm />
      </Suspense>
    </>
  );
}
