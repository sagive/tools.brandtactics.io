"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Lock, User, Camera, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";

export default function MyProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [title, setTitle] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Initialize full name when profile loads
  useEffect(() => {
    if (profile) {
      if (profile.full_name) setFullName(profile.full_name);
      if (profile.phone) setPhoneNumber(profile.phone);
      if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
      if (profile.title) setTitle(profile.title);
    }
  }, [profile]);

  useEffect(() => {
    // Listen for password recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
        toast.info("Recovery link accepted. Please set your new password below.");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) return;

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully.");
      setNewPassword("");
      setConfirmPassword("");
      setIsRecoveryMode(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be under 2MB.");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      toast.success("Image uploaded! Don't forget to save changes.");
    } catch (err: any) {
      toast.error("Upload failed: " + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          full_name: fullName,
          phone: phoneNumber,
          avatar_url: avatarUrl,
          title: title
        })
        .or(`id.eq.${profile?.id},email.eq.${user.email}`);

      if (error) throw error;
      toast.success("Profile updated successfully!");
      
      await refreshProfile();
    } catch (err: any) {
      const msg = err.message?.includes("column users.full_name does not exist")
        ? "Database Error: The 'full_name' column is missing from your 'users' table."
        : (err.message || "Failed to update profile.");
      toast.error(msg);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">My Profile</h1>
        <p className="text-gray-500 mt-1 uppercase text-[11px] font-bold tracking-widest">Manage your personal account settings and security.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <User className="w-5 h-5 mr-2 text-gray-600" />
              Account Info
            </CardTitle>
            <CardDescription>
              Update your public profile details and photo.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="flex items-center gap-6 pb-2">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-full border-2 border-gray-100 overflow-hidden bg-gray-50 flex items-center justify-center">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-8 h-8 text-gray-300" />
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <Clock className="w-6 h-6 text-white animate-spin" />
                      </div>
                    )}
                  </div>
                  <label className="absolute -bottom-1 -right-1 bg-white border border-gray-200 p-1.5 rounded-full shadow-sm cursor-pointer hover:bg-gray-50 transition-colors">
                    <Camera className="w-3.5 h-3.5 text-gray-600" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={isUploading} />
                  </label>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-gray-900">Profile Picture</p>
                  <p className="text-[11px] text-gray-500">JPG, PNG or GIF. Max size 2MB.</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Full Name / Display Name</Label>
                  <Input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Daniel Haimoff" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Job Title</Label>
                  <Input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. SEO Specialist" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Phone</Label>
                  <Input 
                    type="tel" 
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="opacity-50">Email Address</Label>
                  <Input 
                    type="email" 
                    value={user?.email || ""} 
                    disabled 
                    className="bg-gray-50 opacity-70"
                  />
                </div>
                <div className="space-y-1 pt-1">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Account Role</p>
                  <Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50 uppercase text-[10px] px-2 py-0.5">
                    {profile?.role === 'staff' ? 'Team Member' : profile?.role || 'Team Member'}
                  </Badge>
                </div>
              </div>
              <Button type="submit" variant="default" className="w-full bg-blue-600 hover:bg-blue-700 h-10" disabled={isUpdatingProfile || isUploading}>
                <Save className="w-4 h-4 mr-2" />
                {isUpdatingProfile ? "Saving..." : "Save Profile Details"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Lock className="w-5 h-5 mr-2 text-blue-600" />
              Security & Password
            </CardTitle>
            <CardDescription>
              Update your account password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="space-y-2">
                <Label>New Password</Label>
                <Input 
                  type="password" 
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••" 
                />
              </div>
              <div className="space-y-2">
                <Label>Confirm New Password</Label>
                <Input 
                  type="password" 
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••" 
                />
              </div>
              <Button type="submit" variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 h-10" disabled={isUpdatingPassword}>
                {isUpdatingPassword ? "Updating..." : (isRecoveryMode ? "Set New Password" : "Change Password")}
              </Button>
              <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-100 flex gap-3">
                <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700 leading-relaxed">
                  Use at least 8 characters with a mix of letters, numbers, and symbols for a strong password.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
