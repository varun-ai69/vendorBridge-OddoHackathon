"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.replace(isAuthenticated ? "/dashboard" : "/login");
    }
  }, [loading, isAuthenticated, router]);

  return (
    <div className="flex h-screen items-center justify-center page-gradient">
      <LoadingSpinner size="lg" />
    </div>
  );
}
