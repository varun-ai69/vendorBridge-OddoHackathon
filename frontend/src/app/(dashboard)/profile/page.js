"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getVendorProfile, updateVendorProfile } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "@/components/ui/PageTransition";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ProfilePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.role !== "vendor") { router.replace("/dashboard"); return; }
    getVendorProfile().then(setProfile).catch(() => {}).finally(() => setLoading(false));
  }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateVendorProfile(profile);
      setProfile(updated);
    } catch { /* */ }
    finally { setSaving(false); }
  };

  if (loading) return <LoadingSpinner className="py-20" size="lg" />;
  if (!profile) return null;

  const update = (field) => (e) => setProfile({ ...profile, [field]: e.target.value });

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Vendor Profile</h1>
        <p className="text-sm text-muted mt-1">{profile.company_name}</p>
      </div>

      <Card className="max-w-2xl">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Contact Person" value={profile.contact_person || ""} onChange={update("contact_person")} />
          <Input label="Phone" value={profile.phone || ""} onChange={update("phone")} />
          <Input label="Address" value={profile.address || ""} onChange={update("address")} />
          <Input label="GST Number" value={profile.gst_number || ""} disabled />
          <Input label="PAN Number" value={profile.pan_number || ""} disabled />
          <hr className="border-[var(--border)]" />
          <Input label="Bank Account" value={profile.bank_account || ""} onChange={update("bank_account")} />
          <Input label="IFSC Code" value={profile.bank_ifsc || ""} onChange={update("bank_ifsc")} />
          <Button type="submit" loading={saving}>Save Profile</Button>
        </form>
      </Card>
    </PageTransition>
  );
}
