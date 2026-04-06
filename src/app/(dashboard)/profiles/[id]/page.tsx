"use client";

import React, { useState, useEffect, use } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, User as UserIcon, MapPin, Camera, ArrowLeft, Trash2, ShieldCheck, Info } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import ProfileCredentials from "@/components/profile-credentials";

interface ProfileData {
  id: string;
  name: string;
  address: string | null;
  gender: string | null;
  image_url: string | null;
}

export default function PersonaDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [formData, setFormData] = useState<Partial<ProfileData>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  async function fetchProfile() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("profiles_data")
      .select("*")
      .eq("id", id)
      .single();
    
    if (data) {
      setProfile(data);
      setFormData(data);
    }
    setIsLoading(false);
  }

  const handleUpdate = async () => {
    if (!formData.name) {
      toast.error("Name is required");
      return;
    }

    setIsSaving(true);
    const { error } = await supabase
      .from("profiles_data")
      .update({
        name: formData.name,
        address: formData.address,
        gender: formData.gender,
        image_url: formData.image_url
      })
      .eq("id", id);

    if (error) {
      toast.error("Failed to update profile: " + error.message);
    } else {
      toast.success("Profile updated");
      setIsDirty(false);
      fetchProfile();
    }
    setIsSaving(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      setIsDirty(true);
      toast.success("Image uploaded. Remember to save changes.");
    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
        <h2 className="text-2xl font-bold text-gray-900">Persona Not Found</h2>
        <p className="text-gray-500">The record you're looking for does not exist.</p>
        <Link href="/profiles">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  const inputClasses = "h-auto px-2 py-1 -ml-2 w-full bg-transparent hover:bg-gray-50 border-transparent hover:border-gray-300 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-gray-900 shadow-none rounded-md";
  return (
    <div className="w-full pb-20 px-4 sm:px-8">
      {/* Top Navigation */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/profiles" className="group">
          <Button variant="ghost" className="text-gray-500 group-hover:text-blue-600 px-0">
            <ArrowLeft className="w-4 h-4 mr-2 transition-transform group-hover:-translate-x-1" />
            Back to Profiles
          </Button>
        </Link>
        <div className="flex items-center gap-3">
          {isDirty && (
            <Button onClick={handleUpdate} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white px-6 font-bold h-10 gap-2 shadow-none rounded-sm">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          )}
          <Button variant="outline" className="text-red-500 hover:bg-red-50 hover:text-red-600 border-red-300 h-10 px-4 font-bold text-xs uppercase tracking-wider rounded-sm shadow-none">
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Profile Card */}
        <div className="lg:col-span-3 space-y-6">
          <Card className="rounded-xl border border-gray-300 overflow-hidden bg-white">
            <CardContent className="p-10 text-center space-y-8">
              <div className="relative inline-block mx-auto">
                <div className="w-40 h-40 rounded-xl border border-gray-300 bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center overflow-hidden">
                  {formData.image_url ? (
                    <img key={formData.image_url} src={formData.image_url} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-16 h-16 text-blue-200" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-20">
                      <Loader2 className="w-10 h-10 text-white animate-spin" />
                    </div>
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1.5 rounded-sm cursor-pointer hover:bg-blue-700 transition-all z-30 border border-blue-700">
                  <Camera className="w-3 h-3" />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={isUploading} />
                </label>
              </div>

              <div className="space-y-6">
                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] block mb-2">Display name</Label>
                  <Input 
                    value={formData.name || ""} 
                    onChange={(e) => {
                      setFormData({...formData, name: e.target.value});
                      setIsDirty(true);
                    }}
                    className={cn(inputClasses, "text-2xl font-black text-center tracking-tight h-auto py-2 -ml-0 bg-gray-50/50 border-gray-300")}
                    placeholder="Enter full name..."
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] block mb-2">Residence Address</Label>
                  <div className="relative group mx-auto w-full">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 transition-colors group-focus-within:text-blue-500" />
                    <Input 
                      value={formData.address || ""} 
                      onChange={(e) => {
                        setFormData({...formData, address: e.target.value});
                        setIsDirty(true);
                      }}
                      className={cn(inputClasses, "pl-10 text-xs font-bold text-gray-600 text-center bg-gray-50/50 border-gray-300")}
                      placeholder="Street, City, Country"
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 flex items-center justify-center gap-6">
                  <div className="text-center w-full">
                    <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Gender</span>
                    <Select 
                      value={formData.gender || "male"} 
                      onValueChange={(v) => {
                        setFormData({...formData, gender: v});
                        setIsDirty(true);
                      }}
                    >
                      <SelectTrigger className="border border-gray-300 focus:ring-0 bg-gray-50/50 h-10 text-xs font-bold text-gray-700 px-4 rounded-xl w-full uppercase tracking-wider">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border border-gray-300 shadow-none">
                        <SelectItem value="male" className="text-xs font-bold uppercase tracking-wider">Male</SelectItem>
                        <SelectItem value="female" className="text-xs font-bold uppercase tracking-wider">Female</SelectItem>
                        <SelectItem value="other" className="text-xs font-bold uppercase tracking-wider">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Dynamic Data */}
        <div className="lg:col-span-9 space-y-8">
          <Card className="rounded-xl border border-gray-300 bg-white min-h-[600px]">
            <CardContent className="p-8 space-y-8">
              <ProfileCredentials profileId={id} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
