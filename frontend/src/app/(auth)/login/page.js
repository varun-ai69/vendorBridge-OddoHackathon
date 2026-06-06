"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { IoMail, IoLockClosed, IoFlash } from "react-icons/io5";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import RoleSelector from "@/components/ui/RoleSelector";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { TEST_USERS } from "@/lib/testUsers";
import { motion } from "framer-motion";

function LoginForm() {
  const { login, clearSession } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState(ROLES.ADMIN);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const fillTestUserForRole = (r) => {
    const testUser = TEST_USERS[r];
    if (testUser) {
      setEmail(testUser.email);
      setPassword(testUser.password);
    }
  };

  useEffect(() => {
    const paramRole = searchParams.get("role");
    if (paramRole && Object.values(ROLES).includes(paramRole)) {
      setRole(paramRole);
    }
    if (searchParams.get("registered") === "1") {
      fillTestUserForRole(paramRole || ROLES.ADMIN);
    }
  }, [searchParams]);

  const fillTestUser = () => {
    const testUser = TEST_USERS[role];
    if (testUser) {
      setEmail(testUser.email);
      setPassword(testUser.password);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const user = await login({ email, password });
      if (user.role !== role) {
        clearSession();
        setError(`This account is registered as ${ROLE_LABELS[user.role] || user.role}, not ${ROLE_LABELS[role]}.`);
        return;
      }
      router.push("/dashboard");
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const testUser = TEST_USERS[role];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="relative w-full max-w-[900px] flex justify-center items-center"
    >
      {/* Elegant Ambient Glow */}
      <div className="absolute -inset-1 rounded-[2.2rem] bg-linear-to-br from-rose-400/40 via-transparent to-amber-400/40 blur-xl z-0 pointer-events-none transition-all duration-700 hover:opacity-60"></div>
      
      {/* Dynamic 3D border container */}
      <div className="relative p-[2px] rounded-[2.1rem] overflow-hidden w-full shadow-2xl shadow-rose-900/10 z-10">
        
        {/* Minimalist dual sweeping border light */}
        <div className="absolute -inset-full animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,transparent_0%,transparent_20%,#fb7185_40%,transparent_50%,transparent_70%,#fbbf24_90%,transparent_100%)] opacity-70"></div>

        {/* Inner Card content */}
        <div className="relative flex flex-col md:flex-row w-full bg-white dark:bg-[#1c1a1a] rounded-4xl overflow-hidden z-20">
          {/* Left side: Illustration */}
          <div className="hidden md:flex md:w-1/2 bg-[#0A0A0A] items-center justify-center relative min-h-[500px]">
             <Image 
               src="/images/login-illustration-v3.png" 
               alt="Login Illustration" 
               fill
               className="object-cover opacity-90"
             />
             <div className="absolute top-8 left-8 z-10">
               <span className="text-xl font-bold tracking-tight text-white drop-shadow-md">VendorLand.</span>
             </div>
          </div>

          {/* Right side: Form */}
          <div className="w-full md:w-1/2 p-8 sm:p-12 flex flex-col justify-center bg-white/90 dark:bg-[#1c1a1a]/90 backdrop-blur-md">
            <div className="mb-6 text-center">
              <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Login</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="mb-2">
                <RoleSelector value={role} onChange={(r) => { setRole(r); setError(""); }} />
              </div>

              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                icon={IoMail}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="!"
              />
              
              <div className="space-y-1">
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  icon={IoLockClosed}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="!"
                />
                <div className="flex justify-end mt-1">
                  <Link href="/forgot-password" className="text-sm font-medium text-amber-500 hover:text-amber-600 transition-colors">
                    Forgot Password?
                  </Link>
                </div>
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/20">
                  {error}
                </p>
              )}

              <Button type="submit" loading={loading} className="w-full ! ! hover:! ! ! text-lg font-semibold shadow-lg shadow-rose-500/20 border-none transition-all hover:-translate-y-0.5">
                Log In
              </Button>
            </form>

            {testUser && (
              <div className="mt-6">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={IoFlash}
                  className="w-full ! border-dashed border-slate-300 dark:border-slate-700 bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-500"
                  onClick={fillTestUser}
                  type="button"
                >
                  Use Demo {ROLE_LABELS[role]} Credentials
                </Button>
              </div>
            )}

            <p className="mt-8 text-center text-sm text-slate-500 font-medium">
              Don&apos;t have an account?{" "}
              <Link href={`/register?role=${role}`} className="text-slate-700 dark:text-slate-300 hover:text-rose-500 dark:hover:text-rose-400 hover:underline underline-offset-2 transition-colors">
                Sign Up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
