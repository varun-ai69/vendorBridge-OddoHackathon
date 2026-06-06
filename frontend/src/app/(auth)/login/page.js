"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IoMail, IoLockClosed, IoFlash } from "react-icons/io5";
import Logo from "@/components/ui/Logo";
import { useAuth } from "@/contexts/AuthContext";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import RoleSelector from "@/components/ui/RoleSelector";
import { ROLES, ROLE_LABELS } from "@/lib/constants";
import { TEST_USERS } from "@/lib/testUsers";

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
        setError(
          `This account is registered as ${ROLE_LABELS[user.role] || user.role}, not ${ROLE_LABELS[role]}. Please select the correct user type.`
        );
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
    <Card glass className="!p-8">
      <div className="mb-8 text-center lg:hidden">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent text-white">
          <Logo className="text-2xl" />
        </div>
        <h1 className="text-2xl font-bold">VendorBridge</h1>
      </div>

      <h2 className="text-xl font-semibold">Sign in</h2>
      <p className="mt-1 text-sm text-muted">Select your role and enter credentials</p>
      <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
        Demo mode active — no backend required. Use demo credentials below.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label className="text-sm font-medium text-foreground/80 mb-2 block">User Type</label>
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
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          icon={IoLockClosed}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger dark:bg-red-900/20">
            {error}
          </p>
        )}

        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-accent hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" loading={loading} className="w-full" size="lg">
          Sign In as {ROLE_LABELS[role]}
        </Button>
      </form>

      {testUser && (
        <div className="mt-4 rounded-xl border border-dashed border-accent/30 bg-accent-muted/30 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-2">Demo Account</p>
          <div className="text-sm space-y-1">
            <p><span className="text-muted">Email:</span> {testUser.email}</p>
            <p><span className="text-muted">Mobile:</span> {testUser.phone}</p>
            <p><span className="text-muted">Password:</span> {testUser.password}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={IoFlash}
            className="w-full mt-3"
            onClick={fillTestUser}
          >
            Use Demo Credentials
          </Button>
        </div>
      )}

      <p className="mt-6 text-center text-sm text-muted">
        Don&apos;t have an account?{" "}
        <Link href={`/register?role=${role}`} className="font-medium text-accent hover:underline">
          Register as {ROLE_LABELS[role]}
        </Link>
      </p>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
