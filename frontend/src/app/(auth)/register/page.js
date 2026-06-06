"use client";

import { Suspense } from "react";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import RegisterForm from "./RegisterForm";

export default function RegisterPage() {
  return (
    <Suspense fallback={<LoadingSpinner className="py-20" size="lg" />}>
      <RegisterForm />
    </Suspense>
  );
}
