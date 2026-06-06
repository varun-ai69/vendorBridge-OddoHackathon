"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  IoBusiness, IoMail, IoLockClosed, IoPerson, IoCall, IoStorefront,
} from "react-icons/io5";
import { registerOrg } from "@/utils/api";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Card from "@/components/ui/Card";
import RoleSelector from "@/components/ui/RoleSelector";
import { ROLES, ROLE_LABELS } from "@/lib/constants";

const INITIAL_FORMS = {
  [ROLES.ADMIN]: {
    org_name: "", org_address: "", org_gst: "", org_industry: "", org_website: "",
    admin_name: "", admin_email: "", admin_phone: "", admin_password: "",
  },
  [ROLES.PROCUREMENT]: {
    name: "", email: "", phone: "", department: "", password: "",
  },
  [ROLES.MANAGER]: {
    name: "", email: "", phone: "", department: "", password: "",
  },
  [ROLES.VENDOR]: {
    company_name: "", contact_person: "", email: "", phone: "",
    address: "", gst_number: "", pan_number: "", password: "",
  },
};

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePhone(phone) {
  return /^\+?[\d\s-]{10,15}$/.test(phone.replace(/\s/g, ""));
}

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [role, setRole] = useState(ROLES.ADMIN);
  const [forms, setForms] = useState(INITIAL_FORMS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const paramRole = searchParams.get("role");
    if (paramRole && Object.values(ROLES).includes(paramRole)) {
      setRole(paramRole);
    }
  }, [searchParams]);

  const form = forms[role];
  const update = (field) => (e) =>
    setForms({ ...forms, [role]: { ...form, [field]: e.target.value } });

  const validateCommon = () => {
    const email = form.admin_email || form.email;
    const phone = form.admin_phone || form.phone;

    if (!email || !validateEmail(email)) {
      setError("A valid email address is required");
      return false;
    }
    if (!phone || !validatePhone(phone)) {
      setError("A valid mobile number is required (min 10 digits)");
      return false;
    }
    return true;
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateCommon()) return;

    setLoading(true);
    try {
      await registerOrg({
        org_name: form.org_name,
        org_address: form.org_address,
        org_gst: form.org_gst,
        org_industry: form.org_industry,
        org_website: form.org_website,
        admin_name: form.admin_name,
        admin_email: form.admin_email,
        admin_phone: form.admin_phone,
        admin_password: form.admin_password,
      });
      router.push("/login?registered=1&role=admin");
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleInviteRoleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateCommon()) return;

    setSuccess(
      `${ROLE_LABELS[role]} accounts are created by an Administrator. Your details have been noted — please contact your org admin or use the demo credentials on the login page.`
    );
  };

  const handleVendorSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateCommon()) return;

    setSuccess(
      "Vendor registration request submitted. An administrator will review your application and send login credentials to your email."
    );
  };

  const submitHandlers = {
    [ROLES.ADMIN]: handleAdminSubmit,
    [ROLES.PROCUREMENT]: handleInviteRoleSubmit,
    [ROLES.MANAGER]: handleInviteRoleSubmit,
    [ROLES.VENDOR]: handleVendorSubmit,
  };

  return (
    <Card glass className="!p-8">
      <h2 className="text-xl font-semibold">Create Account</h2>
      <p className="mt-1 text-sm text-muted">Select user type and complete registration</p>

      <div className="mt-5">
        <label className="text-sm font-medium text-foreground/80 mb-2 block">User Type</label>
        <RoleSelector value={role} onChange={(r) => { setRole(r); setError(""); setSuccess(""); }} />
      </div>

      {success ? (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-success dark:bg-emerald-900/20">
            {success}
          </div>
          <Link href={`/login?role=${role}`}>
            <Button className="w-full">Go to Login</Button>
          </Link>
        </div>
      ) : (
        <form onSubmit={submitHandlers[role]} className="mt-6 space-y-4 max-h-[55vh] overflow-y-auto scrollbar-thin pr-1">
          {role === ROLES.ADMIN && (
            <>
              <p className="text-sm font-medium">Organization Details</p>
              <Input label="Organization Name" icon={IoBusiness} value={form.org_name} onChange={update("org_name")} required />
              <Input label="Address" value={form.org_address} onChange={update("org_address")} required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="GST Number" value={form.org_gst} onChange={update("org_gst")} />
                <Input label="Industry" value={form.org_industry} onChange={update("org_industry")} />
              </div>
              <Input label="Website" type="url" value={form.org_website} onChange={update("org_website")} />

              <hr className="border-[var(--border)]" />
              <p className="text-sm font-medium">Admin Account</p>
              <Input label="Full Name" icon={IoPerson} value={form.admin_name} onChange={update("admin_name")} required />
              <Input label="Email *" type="email" icon={IoMail} value={form.admin_email} onChange={update("admin_email")} required />
              <Input label="Mobile Number *" type="tel" icon={IoCall} placeholder="+91-9876543210" value={form.admin_phone} onChange={update("admin_phone")} required />
              <Input label="Password" type="password" icon={IoLockClosed} value={form.admin_password} onChange={update("admin_password")} required minLength={8} />
            </>
          )}

          {(role === ROLES.PROCUREMENT || role === ROLES.MANAGER) && (
            <>
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-warning dark:bg-amber-900/20">
                {ROLE_LABELS[role]} accounts are typically invited by your organization&apos;s Administrator.
              </div>
              <Input label="Full Name" icon={IoPerson} value={form.name} onChange={update("name")} required />
              <Input label="Email *" type="email" icon={IoMail} value={form.email} onChange={update("email")} required />
              <Input label="Mobile Number *" type="tel" icon={IoCall} placeholder="+91-9876543210" value={form.phone} onChange={update("phone")} required />
              <Input label="Department" value={form.department} onChange={update("department")} />
              <Input label="Password" type="password" icon={IoLockClosed} value={form.password} onChange={update("password")} required minLength={8} />
            </>
          )}

          {role === ROLES.VENDOR && (
            <>
              <Input label="Company Name" icon={IoStorefront} value={form.company_name} onChange={update("company_name")} required />
              <Input label="Contact Person" icon={IoPerson} value={form.contact_person} onChange={update("contact_person")} required />
              <Input label="Email *" type="email" icon={IoMail} value={form.email} onChange={update("email")} required />
              <Input label="Mobile Number *" type="tel" icon={IoCall} placeholder="+91-9111111111" value={form.phone} onChange={update("phone")} required />
              <Input label="Address" value={form.address} onChange={update("address")} required />
              <div className="grid grid-cols-2 gap-3">
                <Input label="GST Number" value={form.gst_number} onChange={update("gst_number")} />
                <Input label="PAN Number" value={form.pan_number} onChange={update("pan_number")} />
              </div>
              <Input label="Password" type="password" icon={IoLockClosed} value={form.password} onChange={update("password")} required minLength={8} />
            </>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger dark:bg-red-900/20">{error}</p>
          )}

          <Button type="submit" loading={loading} className="w-full" size="lg">
            {role === ROLES.ADMIN
              ? "Create Organization"
              : role === ROLES.VENDOR
                ? "Submit Vendor Registration"
                : "Submit Registration Request"}
          </Button>
        </form>
      )}

      <p className="mt-4 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href={`/login?role=${role}`} className="font-medium text-accent hover:underline">Sign in</Link>
      </p>
    </Card>
  );
}
