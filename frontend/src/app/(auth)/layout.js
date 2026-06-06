"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Logo from "@/components/ui/Logo";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function AuthLayout({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) router.replace("/dashboard");
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center page-gradient">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen page-gradient">
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-white">
            <Logo className="text-xl" />
          </div>
          <span className="text-xl font-bold tracking-tight">VendorBridge</span>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <h1 className="text-4xl font-bold leading-tight tracking-tight">
            Procurement,
            <br />
            <span className="text-accent">simplified.</span>
          </h1>
          <p className="mt-4 max-w-md text-muted leading-relaxed">
            From RFQ to invoice — manage your entire procurement lifecycle
            with role-based workflows, quotation comparison, and real-time analytics.
          </p>

          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: "RFQs", value: "500+" },
              { label: "Vendors", value: "120+" },
              { label: "Savings", value: "18%" },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="glass-card rounded-xl p-4"
              >
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <p className="text-xs text-muted">© 2026 VendorBridge · Oddo Hackathon</p>
      </div>

      <div className="flex w-full lg:w-1/2 items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}
