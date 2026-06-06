"use client";

import { useState } from "react";
import Link from "next/link";
import { IoMail, IoArrowBack } from "react-icons/io5";
import { forgotPassword } from "@/utils/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message || "Failed to send reset link");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card glass className="!p-8">
      <Link href="/login" className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground mb-4">
        <IoArrowBack /> Back to login
      </Link>

      <h2 className="text-xl font-semibold">Forgot Password</h2>
      <p className="mt-1 text-sm text-muted">
        {sent ? "Check your email for the reset link" : "Enter your email to receive a reset link"}
      </p>

      {sent ? (
        <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-success dark:bg-emerald-900/20">
          If an account exists for {email}, a password reset link has been sent.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            icon={IoMail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger dark:bg-red-900/20">{error}</p>
          )}
          <Button type="submit" loading={loading} className="w-full" size="lg">
            Send Reset Link
          </Button>
        </form>
      )}
    </Card>
  );
}
