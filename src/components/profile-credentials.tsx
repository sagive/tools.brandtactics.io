"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Key, Globe, Lock, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
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

interface ProfileCredentialsProps {
  profileId: string;
}

export default function ProfileCredentials({ profileId }: ProfileCredentialsProps) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSites();
    fetchCredentials();
  }, [profileId]);

  async function fetchCredentials() {
    setIsLoading(true);
    const { data } = await supabase
      .from("profile_credentials")
      .select("*")
      .eq("profile_id", profileId)
      .order("created_at", { ascending: true });
    
    if (data) setCredentials(data);
    setIsLoading(false);
  }

  async function fetchSites() {
    const { data } = await supabase.from("profile_sites").select("*").order("rank", { ascending: true });
    if (data) setSites(data);
  }

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
    setIsSaving(true);
    try {
      // 1. Delete existing for this profile
      await supabase.from("profile_credentials").delete().eq("profile_id", profileId);
      
      // 2. Insert filtered list
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
        const { error } = await supabase.from("profile_credentials").insert(credsToInsert);
        if (error) throw error;
      }

      toast.success("Accounts updated successfully");
      fetchCredentials(); // Refresh to get proper IDs from DB
    } catch (error: any) {
      toast.error("Failed to save accounts: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
          <Lock className="w-4 h-4 text-blue-600" />
          Credentials & Accounts
        </h4>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={addCredentialLine} className="text-blue-600 hover:bg-blue-50 h-8 font-bold text-[10px] uppercase">
            <Plus className="w-3 h-3 mr-1" /> Add Account
          </Button>
          {credentials.length > 0 && (
            <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white h-8 font-bold text-[10px] uppercase gap-2 px-4 shadow-md shadow-blue-100">
              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              Save All
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-3">
        {credentials.map((cred, index) => (
          <div key={index} className="group p-4 rounded-2xl border border-gray-100 bg-white hover:border-blue-100 hover:shadow-sm transition-all space-y-4 relative">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => removeCredentialLine(index)}
              className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-white border shadow-sm text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Platform / Site</Label>
                <Select 
                  value={cred.site_id || "none"} 
                  onValueChange={(v) => updateCredential(index, "site_id", v === "none" ? null : v)}
                >
                  <SelectTrigger className="h-10 bg-gray-50/50 border-gray-100 text-[11px] hover:bg-white transition-colors">
                    <SelectValue>
                      {cred.site_id 
                        ? sites.find(s => s.id === cred.site_id)?.name || "Loading..." 
                        : "Manual / Other"}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Manual / Other</SelectItem>
                    {sites.map(site => (
                      <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Username</Label>
                <Input 
                  value={cred.username}
                  onChange={(e) => updateCredential(index, "username", e.target.value)}
                  placeholder="User / Email" 
                  className="h-10 text-xs bg-gray-50/50 border-gray-100 hover:bg-white transition-colors"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Password</Label>
                <Input 
                  type="text" 
                  value={cred.password}
                  onChange={(e) => updateCredential(index, "password", e.target.value)}
                  placeholder="Password" 
                  className="h-10 text-xs bg-gray-50/50 border-gray-100 hover:bg-white transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold text-gray-400 uppercase ml-1">Profile Link</Label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <Input 
                  value={cred.login_url}
                  onChange={(e) => updateCredential(index, "login_url", e.target.value)}
                  placeholder="https://facebook.com/profile..." 
                  className="h-10 text-xs pl-9 bg-gray-50/50 border-gray-100 hover:bg-white transition-colors"
                />
              </div>
            </div>
          </div>
        ))}
        
        {credentials.length === 0 && (
          <div className="text-center py-12 border-2 border-dashed rounded-3xl bg-gray-50/50 text-gray-400">
            <Key className="w-8 h-8 mx-auto mb-3 opacity-20" />
            <p className="text-xs font-semibold uppercase tracking-wider">No accounts added yet</p>
            <Button variant="link" onClick={addCredentialLine} className="text-blue-600 text-xs font-bold mt-2 hover:no-underline">
              Click to add your first account
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
