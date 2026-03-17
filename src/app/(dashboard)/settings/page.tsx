"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, UserPlus, Mail, Lock, User, Trash2, Plus, FileText, RotateCw, Clock, Camera, Upload, Zap } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

function PrewrittenTemplateRow({ template, onDelete, onUpdate }: { template: any, onDelete: (id: string) => void, onUpdate: (id: string, updates: any) => Promise<void> }) {
  const [name, setName] = useState(template.name);
  const [content, setContent] = useState(template.content || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(template.id, { name, content });
    setIsSaving(false);
  };

  return (
    <div className="p-6 border rounded-xl bg-white shadow-sm space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-1">
          <Label className="text-xs font-semibold text-gray-500 uppercase">Template Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="font-bold text-gray-900 border-gray-200" placeholder="e.g., Monthly SEO Update" />
        </div>
        <div className="flex items-end gap-2 pt-5">
          <Button variant="outline" onClick={handleSave} disabled={isSaving} className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 shrink-0">
            {isSaving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save</>}
          </Button>
          <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0" onClick={() => onDelete(template.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold text-gray-500 uppercase">Message Content</Label>
        <div className="border rounded-md overflow-hidden bg-white border-gray-200">
          <ReactQuill theme="snow" value={content} onChange={setContent} className="[&_.ql-editor]:min-h-[150px] [&_.ql-editor]:text-sm [&_.ql-toolbar]:border-x-0 [&_.ql-toolbar]:border-t-0 [&_.ql-container]:border-none" />
        </div>
      </div>
    </div>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || "users");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);



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
  const [inviteRole, setInviteRole] = useState("viewer");
  const [isInviting, setIsInviting] = useState(false);
  const [staff, setStaff] = useState<any[]>([]);
  const { user, profile, refreshProfile } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
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
      
    // Fetch prewritten templates
    fetchPrewrittenTemplates();

    // 2. Fetch Staff
    supabase.from('users').select('*').order('created_at', { ascending: true })
      .then(({data, error}: {data: any, error: any}) => {
        if (data) setStaff(data);
        setIsLoading(false);
      });



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

  // Initialize full name when profile loads
  useEffect(() => {
    if (profile) {
      if (profile.full_name) setFullName(profile.full_name);
      if (profile.phone) setPhoneNumber(profile.phone);
      if (profile.avatar_url) setAvatarUrl(profile.avatar_url);
    }
  }, [profile]);

  const handleSaveTemplate = async () => {
    try {
      const { error } = await supabase.from('app_settings').update({ email_template: template }).eq('id', 'global');
      if (error) throw error;
      toast.success("Email template saved successfully.");
    } catch (err: any) {
      toast.error("Failed to save template");
    }
  };

  const [prewrittenTemplates, setPrewrittenTemplates] = useState<any[]>([]);

  const fetchPrewrittenTemplates = async () => {
    try {
      const { data, error } = await supabase.from('email_templates').select('*').order('created_at', { ascending: true });
      if (data) setPrewrittenTemplates(data);
    } catch (err) {
      // Table might not exist yet
    }
  };

  const [articleEndpoints, setArticleEndpoints] = useState<any[]>([]);
  const [isAddingEndpoint, setIsAddingEndpoint] = useState(false);

  const fetchArticleEndpoints = async () => {
    try {
      const { data, error } = await supabase.from('article_endpoints').select('*').order('created_at', { ascending: true });
      if (data) setArticleEndpoints(data);
    } catch (err) {
      // Handle if table doesn't exist
    }
  };

  useEffect(() => {
    fetchArticleEndpoints();
  }, []);

  const handleCreateEndpoint = async () => {
    setIsAddingEndpoint(true);
    const newEndpoint = { 
      name: "New Endpoint", 
      endpoint_url: "https://hook.n8n.example.com/live...", 
      endpoint_url_test: "https://hook.n8n.example.com/test...",
      use_test_endpoint: true 
    };
    try {
      const { data, error } = await supabase.from('article_endpoints').insert(newEndpoint).select().single();
      if (error) throw error;
      if (data) {
        setArticleEndpoints([...articleEndpoints, data]);
        toast.success("New endpoint added");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add endpoint");
    } finally {
      setIsAddingEndpoint(false);
    }
  };

  const handleUpdateEndpoint = async (id: string, updates: any) => {
    try {
      const { error } = await supabase.from('article_endpoints').update(updates).eq('id', id);
      if (error) throw error;
      setArticleEndpoints(prev => prev.map(ep => ep.id === id ? { ...ep, ...updates } : ep));
      toast.success("Endpoint saved successfully.");
    } catch (err: any) {
      toast.error("Failed to save endpoint");
    }
  };

  const handleDeleteEndpoint = async (id: string) => {
    if (!confirm("Are you sure you want to delete this endpoint? Articles using this type will lose their AI capabilities.")) return;
    try {
      const { error } = await supabase.from('article_endpoints').delete().eq('id', id);
      if (error) throw error;
      setArticleEndpoints(prev => prev.filter(ep => ep.id !== id));
      toast.success("Endpoint deleted");
    } catch (err: any) {
      toast.error("Failed to delete endpoint");
    }
  };

  const handleCreatePrewrittenTemplate = async () => {
    const newTemp = { name: "New Template", content: "" };
    try {
      const { data, error } = await supabase.from('email_templates').insert(newTemp).select().single();
      if (error) throw error;
      if (data) {
        setPrewrittenTemplates([...prewrittenTemplates, data]);
        toast.success("New template added");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add template. Make sure you ran the SQL migration.");
    }
  };

  const handleUpdatePrewrittenTemplate = async (id: string, updates: any) => {
    try {
      const { error } = await supabase.from('email_templates').update(updates).eq('id', id);
      if (error) throw error;
      setPrewrittenTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      toast.success("Template saved successfully.");
    } catch (err: any) {
      toast.error("Failed to save template");
    }
  };

  const handleDeletePrewrittenTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const { error } = await supabase.from('email_templates').delete().eq('id', id);
      if (error) throw error;
      setPrewrittenTemplates(prev => prev.filter(t => t.id !== id));
      toast.success("Template deleted");
    } catch (err: any) {
      toast.error("Failed to delete template");
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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file.");
      return;
    }

    // Validate size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image size must be under 2MB.");
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // 1. Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get Public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // 3. Update profile state
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
          avatar_url: avatarUrl
        })
        .eq('email', user.email);

      if (error) throw error;
      toast.success("Profile updated successfully!");
      
      // Refresh global profile state and local staff list
      await refreshProfile();
      const { data } = await supabase.from('users').select('*').order('created_at', { ascending: true });
      if (data) setStaff(data);
    } catch (err: any) {
      const msg = err.message?.includes("column users.full_name does not exist")
        ? "Database Error: The 'full_name' column is missing from your 'users' table. Please see the troubleshooting guide."
        : (err.message || "Failed to update profile.");
      toast.error(msg);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    setIsInviting(true);
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to send invite");
      
      toast.success(`Invite sent successfully to ${inviteEmail}.`);
      setInviteEmail("");
      setInviteRole("viewer");
      
      // Refresh staff to show the new pending invite
      const { data: updatedStaff } = await supabase.from('users').select('*').order('created_at', { ascending: true });
      if (updatedStaff) setStaff(updatedStaff);
      
    } catch (err: any) {
      toast.error(err.message || "Failed to invite user");
    } finally {
      setIsInviting(false);
    }
  };

  const handleResendInvite = async (email: string, role: string) => {
    toast.info("Resending invite...");
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Invite resent successfully.");
      
      const { data: updatedStaff } = await supabase.from('users').select('*').order('created_at', { ascending: true });
      if (updatedStaff) setStaff(updatedStaff);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend invite");
    }
  };

  const handleDeleteUser = async (id: string, email: string, isInvite: boolean = false) => {
    const msg = isInvite ? "Are you sure you want to revoke this invitation?" : "Are you sure you want to remove this user from the system?";
    if (!confirm(msg)) return;
    
    try {
      const res = await fetch(`/api/invites?id=${id}&email=${email}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(isInvite ? "Invitation revoked" : "User removed");
      setStaff(prev => prev.filter(member => member.id !== id));
    } catch (err: any) {
      toast.error(err.message || (isInvite ? "Failed to revoke invitation" : "Failed to remove user"));
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;
      
      toast.success("Role updated successfully");
      setStaff(prev => prev.map(member => member.id === userId ? { ...member, role: newRole } : member));
    } catch (err: any) {
      toast.error("Failed to update role");
    }
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
          <TabsTrigger value="endpoints" className="px-6 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Article Endpoints</TabsTrigger>
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
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input 
                        type="email" 
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="teammate@brandtactics.com" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role</Label>
                      <Select value={inviteRole} onValueChange={(val) => setInviteRole(val || "viewer")}>
                        <SelectTrigger className="w-full bg-white">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="author">Author</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <Button type="submit" variant="default" className="w-full bg-purple-600 hover:bg-purple-700" disabled={isInviting}>
                    {isInviting ? "Sending Invite..." : "Send Invite"}
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
                      <TableHead className="text-right pr-6">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {staff.map((member) => (
                      <TableRow key={member.id} className="hover:bg-gray-50/50">
                        <TableCell className="pl-6">
                          <div className="font-medium text-gray-900 text-sm">{member.email}</div>
                          {member.status === 'invited' && (
                            <div className="text-[10px] text-gray-400 mt-0.5 flex items-center">
                              <Clock className="w-3 h-3 justify-center mr-1 inline" />
                              Invited {member.invited_at ? new Date(member.invited_at).toLocaleDateString() : 'recently'}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {profile?.role === 'admin' ? (
                            <Select 
                              value={member.role || 'viewer'} 
                              onValueChange={(val) => handleUpdateRole(member.id, val)}
                            >
                              <SelectTrigger className="w-full sm:w-[130px] h-8 text-xs bg-white">
                                <SelectValue placeholder="Select role" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="author">Author</SelectItem>
                                <SelectItem value="viewer">Viewer</SelectItem>
                                <SelectItem value="staff">Staff</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge className={cn(
                              "capitalize",
                              member.role === 'admin' ? "bg-blue-50 text-blue-700 border-blue-100" : "bg-gray-100 text-gray-700 border-gray-200"
                            )}>
                              {member.role || 'Staff'}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right pr-6 min-w-[120px]">
                          {member.status === 'invited' ? (
                            <div className="flex items-center justify-end gap-2">
                              {profile?.role === 'admin' && (
                                <>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                                    onClick={() => handleResendInvite(member.email, member.role)}
                                    title="Resend Invite"
                                  >
                                    <RotateCw className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteUser(member.id, member.email, true)}
                                    title="Revoke Invitation"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <Badge variant="outline" className="bg-orange-50 text-orange-600 border-orange-200">
                                Pending
                              </Badge>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              {profile?.role === 'admin' && member.email !== profile?.email && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteUser(member.id, member.email, false)}
                                  title="Remove User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 shadow-none">
                                Active
                              </Badge>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {staff.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-4 text-gray-500 text-sm">
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
            {/* Account Info Card (Now on Left) */}
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
                  {/* Avatar Section */}
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
                      <Label>Full Name</Label>
                      <Input 
                        type="text" 
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="Your Name" 
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
                        {staff.find(s => s.email === user?.email)?.role || "Staff"}
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

            {/* Security & Password Card (Now on Right) */}
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
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
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

          {/* Prewritten Templates Section */}
          <div className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                  Prewritten Templates
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Create reusable message blocks that you can quickly inject into email updates from the dashboard.
                </p>
              </div>
              <Button onClick={handleCreatePrewrittenTemplate} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm gap-2">
                <Plus className="w-4 h-4" /> Add Template
              </Button>
            </div>

            {prewrittenTemplates.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-700">No templates yet</h4>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Click the button above to create your first prewritten template.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {prewrittenTemplates.map(t => (
                  <PrewrittenTemplateRow 
                    key={t.id} 
                    template={t} 
                    onDelete={handleDeletePrewrittenTemplate} 
                    onUpdate={handleUpdatePrewrittenTemplate} 
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-6 mt-0 outline-none ring-0">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Plus className="w-5 h-5 mr-2 text-yellow-500" />
                AI Article Endpoints
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                Configure the n8n webhook URLs corresponding to each article type (e.g., Guest post, PR). 
                When a user clicks "Generate with AI" on an article of that type, these endpoints will be called to generate the HTML content.
              </p>
            </div>
            <Button onClick={handleCreateEndpoint} disabled={isAddingEndpoint} className="bg-yellow-500 hover:bg-yellow-600 text-white shadow-sm gap-2">
              <Plus className="w-4 h-4" /> {isAddingEndpoint ? "Adding..." : "Add Endpoint"}
            </Button>
          </div>

          {articleEndpoints.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
              <Plus className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <h4 className="font-semibold text-gray-700">No endpoints configured</h4>
              <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Add an endpoint to enable AI generation for client articles.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {articleEndpoints.map(ep => (
                <EndpointRow 
                  key={ep.id} 
                  endpoint={ep} 
                  onDelete={handleDeleteEndpoint} 
                  onUpdate={handleUpdateEndpoint} 
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EndpointRow({ endpoint, onDelete, onUpdate }: { endpoint: any, onDelete: (id: string) => void, onUpdate: (id: string, updates: any) => Promise<void> }) {
  const [name, setName] = useState(endpoint.name);
  const [url, setUrl] = useState(endpoint.endpoint_url || "");
  const [testUrl, setTestUrl] = useState(endpoint.endpoint_url_test || "");
  const [useTest, setUseTest] = useState(endpoint.use_test_endpoint || false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(endpoint.id, { 
      name, 
      endpoint_url: url,
      endpoint_url_test: testUrl,
      use_test_endpoint: useTest
    });
    setIsSaving(false);
  };

  return (
    <div className={`p-6 border rounded-xl shadow-sm space-y-4 transition-colors ${useTest ? "bg-amber-50/30 border-amber-200" : "bg-white border-gray-200"}`}>
      <div className="flex items-start gap-4 flex-col md:flex-row">
        {/* Left Col: Type and Toggle */}
        <div className="w-full md:w-1/4 space-y-4">
          <div className="space-y-1">
            <Label className="text-xs font-semibold text-gray-500 uppercase">Article Type</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="font-bold text-gray-900 border-gray-200 bg-white" placeholder="e.g., Guest Post" />
          </div>
          
          <div className="flex items-center gap-2 pt-2 bg-white p-2 rounded-md border border-gray-100 shadow-sm w-fit">
            <input 
              type="checkbox" 
              id={`toggle-${endpoint.id}`}
              checked={useTest} 
              onChange={(e) => setUseTest(e.target.checked)} 
              className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
            />
            <Label htmlFor={`toggle-${endpoint.id}`} className="text-xs font-bold text-gray-700 cursor-pointer">
              Use Test Endpoint
            </Label>
          </div>
        </div>

        {/* Middle Col: URLs */}
        <div className="w-full md:w-2/4 space-y-3">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className={`text-[11px] font-bold uppercase tracking-wider ${!useTest ? 'text-green-600' : 'text-gray-400'}`}>Live Webhook URL</Label>
              {!useTest && <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-[9px] h-4 py-0 px-1.5">ACTIVE</Badge>}
            </div>
            <Input 
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
              className={`font-mono text-xs ${!useTest ? 'border-green-300 bg-green-50/30 focus-visible:ring-green-500 text-gray-900' : 'border-gray-200 bg-gray-50 text-gray-500'}`}
              placeholder="https://..." 
            />
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <Label className={`text-[11px] font-bold uppercase tracking-wider ${useTest ? 'text-amber-600' : 'text-gray-400'}`}>Test Webhook URL</Label>
              {useTest && <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 text-[9px] h-4 py-0 px-1.5">ACTIVE</Badge>}
            </div>
            <Input 
              value={testUrl} 
              onChange={(e) => setTestUrl(e.target.value)} 
              className={`font-mono text-xs ${useTest ? 'border-amber-300 bg-amber-50/50 focus-visible:ring-amber-500 text-gray-900' : 'border-gray-200 bg-gray-50 text-gray-500'}`}
              placeholder="https://..." 
            />
          </div>
        </div>

        {/* Right Col: Actions */}
        <div className="flex items-start gap-2 w-full md:w-1/4 md:pt-5 justify-end h-full">
          <Button variant="outline" onClick={handleSave} disabled={isSaving} className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 shrink-0">
            {isSaving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save</>}
          </Button>
          <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0" onClick={() => onDelete(endpoint.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
