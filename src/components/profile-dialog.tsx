"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Key, Globe, User, MapPin, Mail, Save, X, Camera, Loader2, Link as LinkIcon, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Credential {
  id?: string;
  username: string;
  password: string;
  login_url: string;
  site_id?: string | null;
}

interface Profile {
  id?: string;
  name: string;
  address: string | null;
  gender: string | null;
  image_url: string | null;
}

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: Profile | null;
  onSuccess: () => void;
}

export function ProfileDialog({ open, onOpenChange, profile, onSuccess }: ProfileDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState<Profile>({
    name: "",
    address: "",
    gender: "male",
    image_url: ""
  });

  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [sites, setSites] = useState<any[]>([]);

  useEffect(() => {
    fetchSites();
    if (profile) {
      setFormData(profile);
      fetchCredentials(profile.id!);
    } else {
      setFormData({
        name: "",
        address: "",
        gender: "male",
        image_url: ""
      });
      setCredentials([]);
    }
  }, [profile, open]);

  async function fetchCredentials(profileId: string) {
    const { data, error } = await supabase
      .from("profile_credentials")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: true });
    
    if (data) setCredentials(data);
  }

  async function fetchSites() {
    const { data } = await supabase.from("profile_sites").select("*").order("rank", { ascending: true });
    if (data) setSites(data);
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("avatars") // We'll use the existing avatars bucket
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setFormData({ ...formData, image_url: publicUrl });
      toast.success("Image uploaded");
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const addCredentialLine = () => {
    setCredentials([...credentials, { username: "", password: "", login_url: "", site_id: null }]);
  };

  const removeCredentialLine = (index: number) => {
    setCredentials(credentials.filter((_, i) => i !== index));
  };

  const updateCredential = (index: number, field: keyof Credential, value: any) => {
    const newCreds = [...credentials];
    newCreds[index] = { ...newCreds[index], [field]: value };
    setCredentials(newCreds);
  };

  const handleSave = async () => {
    if (!formData.name) {
      toast.error("Please enter a name");
      return;
    }

    setIsSaving(true);
    try {
      let profileId = profile?.id;

      if (profileId) {
        // Update profile
        const { error } = await supabase
          .from("profiles_data")
          .update(formData)
          .eq("id", profileId);
        if (error) throw error;
      } else {
        // Create profile
        const { data, error } = await supabase
          .from("profiles_data")
          .insert([formData])
          .select()
          .single();
        if (error) throw error;
        profileId = data.id;
      }

      // Handle credentials (Delete all and re-insert for simplicity in this version)
      // A more robust way would be to track changes, but this is cleaner for local state mgmt
      await supabase.from("profile_credentials").delete().eq("profile_id", profileId);
      
      const credsToInsert = credentials
        .filter(c => c.username || c.password || c.login_url)
        .map(c => ({
          profile_id: profileId,
          username: c.username,
          password: c.password,
          login_url: c.login_url,
          site_id: c.site_id
        }));

      if (credsToInsert.length > 0) {
        const { error: credError } = await supabase.from("profile_credentials").insert(credsToInsert);
        if (credError) throw credError;
      }

      toast.success(profile ? "Profile updated" : "Profile created");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Save failed: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl w-full max-h-[90vh] overflow-y-auto overflow-x-hidden rounded-[2rem] border-none shadow-2xl p-0">
        <DialogHeader className="p-8 pb-4 border-b border-gray-100">
          <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">{profile ? "Update Persona" : "Create New Persona"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 p-8">
          {/* Left Column: Image & Basic Info (Now smaller) */}
          <div className="lg:col-span-3 space-y-8">
            <div className="flex flex-col items-center gap-4">
              <div className="relative group">
                <div className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {formData.image_url ? (
                    <img src={formData.image_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-12 h-12 text-gray-300" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-2 -right-2 bg-blue-600 text-white p-2 rounded-full shadow-lg cursor-pointer hover:bg-blue-700 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                </label>
              </div>
              <p className="text-[10px] text-gray-400 uppercase font-bold tracking-widest text-center">Profile Identity</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Gender</Label>
                <Select value={formData.gender || "male"} onValueChange={(v) => setFormData({...formData, gender: v})}>
                  <SelectTrigger className="bg-white border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Right Column: Form Fields & Credentials (Now larger) */}
          <div className="lg:col-span-9 space-y-10">
            <div className="space-y-4">
              <div className="grid gap-2">
                <Label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., John Doe" 
                    className="pl-10 bg-white border-gray-200"
                  />
                </div>
              </div>

              <div className="grid gap-2">
                <Label className="text-xs uppercase font-bold text-gray-500 tracking-wider">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input 
                    value={formData.address || ""}
                    onChange={(e) => setFormData({...formData, address: e.target.value})}
                    placeholder="e.g., 123 Main St, New York" 
                    className="pl-10 bg-white border-gray-200"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  Credentials
                </h4>
                <Button variant="ghost" size="sm" onClick={addCredentialLine} className="text-blue-600 hover:bg-blue-50 h-8 font-bold text-[10px] uppercase">
                  <Plus className="w-3 h-3 mr-1" /> Add Account
                </Button>
              </div>

              <div className="space-y-3">
                {credentials.map((cred, index) => (
                  <div key={index} className="group p-3 rounded-xl border border-gray-100 bg-gray-50/50 space-y-3 relative">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeCredentialLine(index)}
                      className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white border shadow-sm text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Platform / Site</Label>
                        <Select 
                          value={cred.site_id || "none"} 
                          onValueChange={(v) => updateCredential(index, "site_id", v === "none" ? null : v)}
                        >
                          <SelectTrigger className="h-8 bg-white border-gray-200 text-xs">
                            <SelectValue placeholder="Select platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Manual / Other</SelectItem>
                            {sites.map(site => (
                              <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Username</Label>
                        <Input 
                          value={cred.username}
                          onChange={(e) => updateCredential(index, "username", e.target.value)}
                          placeholder="User / Email" 
                          className="h-8 text-[11px] bg-white border-gray-200"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Password</Label>
                        <Input 
                          type="text" 
                          value={cred.password}
                          onChange={(e) => updateCredential(index, "password", e.target.value)}
                          placeholder="Password" 
                          className="h-8 text-[11px] bg-white border-gray-200"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Profile Link</Label>
                      <div className="relative">
                        <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                        <Input 
                          value={cred.login_url}
                          onChange={(e) => updateCredential(index, "login_url", e.target.value)}
                          placeholder="https://facebook.com/profile..." 
                          className="h-8 text-sm pl-8 bg-white border-gray-200"
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {credentials.length === 0 && (
                  <div className="text-center py-6 border-2 border-dashed rounded-xl bg-gray-50/50 text-gray-400">
                    <Key className="w-6 h-6 mx-auto mb-2 opacity-20" />
                    <p className="text-xs font-medium">No credentials added yet</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 border-t p-8 bg-gray-50/80 backdrop-blur-md rounded-b-[2rem]">
          <Button variant="ghost" className="rounded-xl font-bold h-12 px-6" onClick={() => onOpenChange(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 h-12 px-10 rounded-xl shadow-lg shadow-blue-100 font-bold min-w-[160px]" disabled={isSaving}>
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            {profile ? "Save Changes" : "Create Profile"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
