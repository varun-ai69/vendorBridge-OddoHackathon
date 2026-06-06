"use client";

import { useState } from "react";
import { IoLockClosed, IoPerson } from "react-icons/io5";
import { changePassword, updateProfile } from "@/utils/api";
import { useAuth } from "@/contexts/AuthContext";
import PageTransition from "@/components/ui/PageTransition";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState({ name: user?.name || "", phone: user?.phone || "" });
  const [passwords, setPasswords] = useState({ current_password: "", new_password: "" });
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [message, setMessage] = useState("");

  const saveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setMessage("");
    try {
      const updated = await updateProfile(profile);
      updateUser(updated);
      setMessage("Profile updated successfully");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setProfileLoading(false);
    }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setMessage("");
    try {
      await changePassword(passwords);
      setPasswords({ current_password: "", new_password: "" });
      setMessage("Password changed successfully");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted mt-1">Manage your account preferences</p>
      </div>

      {message && (
        <div className="mb-4 rounded-lg bg-accent-muted px-4 py-3 text-sm">{message}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <IoPerson className="text-accent" />
            <h3 className="font-semibold">Profile</h3>
          </div>
          <form onSubmit={saveProfile} className="space-y-4">
            <Input label="Full Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
            <Input label="Phone" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            <Input label="Email" value={user?.email || ""} disabled />
            <Button type="submit" loading={profileLoading}>Save Profile</Button>
          </form>
        </Card>

        <Card>
          <div className="flex items-center gap-2 mb-4">
            <IoLockClosed className="text-accent" />
            <h3 className="font-semibold">Change Password</h3>
          </div>
          <form onSubmit={savePassword} className="space-y-4">
            <Input label="Current Password" type="password" value={passwords.current_password} onChange={(e) => setPasswords({ ...passwords, current_password: e.target.value })} required />
            <Input label="New Password" type="password" value={passwords.new_password} onChange={(e) => setPasswords({ ...passwords, new_password: e.target.value })} required />
            <Button type="submit" loading={passwordLoading}>Update Password</Button>
          </form>
        </Card>
      </div>
    </PageTransition>
  );
}
