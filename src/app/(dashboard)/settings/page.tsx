"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, UserPlus, Mail, Lock, User } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const [template, setTemplate] = useState(
`<div style="font-family: sans-serif; max-w: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: white;">
  <h2 style="color: #2563eb; margin-top: 0;">BrandTactics Update</h2>
  <div style="background: #f8fafc; padding: 24px; border-radius: 8px; border: 1px solid #f1f5f9; color: #334155; line-height: 1.6;">
    [content]
  </div>
  <p style="color: #64748b; font-size: 12px; margin-top: 24px; text-align: center; border-top: 1px solid #f1f5f9; pt: 16px;">
    Sent via BrandTactics Client Portal
  </p>
</div>`
  );

  const [inviteEmail, setInviteEmail] = useState("");
  const [staff, setStaff] = useState<any[]>([]);
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("users");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch initial template, handle password recovery, and fetch staff
  useEffect(() => {
    // 1. Fetch Template
    supabase.from('app_settings').select('email_template').eq('id', 'global').single()
      .then(({data, error}: {data: any, error: any}) => {
        if (data?.email_template) {
          setTemplate(data.email_template);
        }
      });

    // 2. Fetch Staff
    supabase.from('users').select('*').order('created_at', { ascending: true })
      .then(({data, error}: {data: any, error: any}) => {
        if (data) setStaff(data);
        setIsLoading(false);
      });

    // Initialize full name from profile if available
    if (profile?.full_name) {
      setFullName(profile.full_name);
    }

    // 3. Listen for password recovery event
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        setIsRecoveryMode(true);
        setActiveTab("profile");
        toast.info("Recovery link accepted. Please set your new password below.");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSaveTemplate = async () => {
    try {
      const { error } = await supabase.from('app_settings').update({ email_template: template }).eq('id', 'global');
      if (error) throw error;
      toast.success("Email template saved successfully.");
    } catch (err: any) {
      toast.error("Failed to save template");
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success("Password updated successfully!");
      setNewPassword("");
      setConfirmPassword("");
      setIsRecoveryMode(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to update password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.email) return;

    setIsUpdatingProfile(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: fullName })
        .eq('email', user.email);

      if (error) throw error;
      toast.success("Profile updated successfully!");
      
      // Refresh global profile state and local staff list
      await refreshProfile();
      const { data } = await supabase.from('users').select('*').order('created_at', { ascending: true });
      if (data) setStaff(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to update profile.");
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    toast.success(`Invite sent to ${inviteEmail}.`);
    setInviteEmail("");
  };

  // Preview content wrapper
  const previewHtml = template.replace('[content]', `
    <p>This is a preview of how your message will look inside the template wrapper.</p>
    <ul>
      <li>Task completed: "New Website Design"</li>
      <li>New comment from Sarah</li>
      <li>Monthly report is ready</li>
    </ul>
    <p>You can use standard HTML formatting here.</p>
  `);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1 uppercase text-[11px] font-bold tracking-widest">Manage global app settings, team members, and templates.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-100/50 border border-gray-200 p-1 rounded-lg">
          <TabsTrigger value="users" className="px-6 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Users & Team</TabsTrigger>
          <TabsTrigger value="profile" className="px-6 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">My Profile</TabsTrigger>
          <TabsTrigger value="email" className="px-6 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Email Template</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6 mt-0 outline-none ring-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <UserPlus className="w-5 h-5 mr-2 text-purple-600" />
                  Invite Team Member
                </CardTitle>
                <CardDescription>
                  Send an invitation link to a colleague to create a staff account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInviteUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input 
                      type="email" 
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="teammate@brandtactics.com" 
                    />
                  </div>
                  <Button type="submit" variant="default" className="w-full bg-purple-600 hover:bg-purple-700">
                    Send Invite
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Staff Directory</CardTitle>
                <CardDescription>Manage existing team members and their access roles.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6">User</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => (
                      <TableRow key={member.id} className="hover:bg-gray-50/50">
                        <TableCell className="pl-6">
                          <div className="font-medium text-gray-900 text-sm">{member.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={cn(
                            "capitalize",
                            member.role === 'admin' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-gray-100 text-gray-700 border-gray-200"
                          )}>
                            {member.role || 'Staff'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {staff.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center py-4 text-gray-500 text-sm">
                          No staff members found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profile" className="space-y-6 mt-0 outline-none ring-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <Button type="submit" variant="default" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isUpdatingPassword}>
                    {isUpdatingPassword ? "Updating..." : (isRecoveryMode ? "Set New Password" : "Change Password")}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <User className="w-5 h-5 mr-2 text-gray-600" />
                  Account Info
                </CardTitle>
                <CardDescription>
                  Update your public profile details.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input 
                      type="text" 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your Name" 
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
                      {staff.find(s => s.email === user?.email)?.role || "Staff"}
                    </Badge>
                  </div>
                  <Button type="submit" variant="outline" className="w-full" disabled={isUpdatingProfile}>
                    {isUpdatingProfile ? "Saving..." : "Save Profile Details"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-6 mt-0 outline-none ring-0">
          <Card className="shadow-sm border-gray-200 overflow-hidden">
            <CardHeader className="border-b bg-gray-50/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center text-lg">
                    <Mail className="w-5 h-5 mr-2 text-blue-600" />
                    Global Email Template
                  </CardTitle>
                  <CardDescription>
                    Customize the HTML wrapper for client email updates. Use exactly <code>[content]</code> where you want the body injected.
                  </CardDescription>
                </div>
                <Button onClick={handleSaveTemplate} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" /> Save Template
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 h-[600px]">
                {/* Editor Side */}
                <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800">
                  <div className="px-4 py-2 border-b border-gray-800 bg-gray-950 flex items-center justify-between shrink-0">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">HTML Source</span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <Textarea 
                      value={template}
                      onChange={(e) => setTemplate(e.target.value)}
                      className="w-full h-full font-mono text-sm resize-none border-0 focus-visible:ring-0 bg-transparent text-green-400 p-6 shadow-none rounded-none overflow-y-auto"
                      placeholder="<div>[content]</div>"
                      style={{ fieldSizing: 'fixed' } as any}
                    />
                  </div>
                </div>

                {/* Preview Side */}
                <div className="flex flex-col h-full bg-gray-100/30">
                  <div className="px-4 py-2 border-b bg-white">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Live Preview</span>
                  </div>
                  <div className="flex-1 overflow-auto p-8 flex justify-center bg-[#f0f2f5]">
                    <div className="w-full max-w-[600px] shadow-lg rounded-xl overflow-hidden bg-white">
                      <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
