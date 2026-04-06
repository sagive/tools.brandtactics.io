"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Key, Globe, Lock, Loader2, Save, Search } from "lucide-react";
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
  const [searchTerm, setSearchTerm] = useState("");

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

  const filteredCredentials = credentials.filter(c => 
    c.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.login_url?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sites.find(s => s.id === c.site_id)?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h4 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
            <Lock className="w-4 h-4 text-blue-600" />
            Accounts & Credentials
          </h4>
        </div>
        
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 transition-colors group-focus-within:text-blue-500" />
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search accounts..." 
              className="h-10 pl-9 bg-gray-50/50 border-gray-100 rounded-xl text-xs font-medium focus:bg-white transition-all shadow-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={addCredentialLine} className="text-blue-600 hover:bg-blue-50 h-10 px-4 font-bold text-[10px] uppercase rounded-xl">
              <Plus className="w-3 h-3 mr-1" /> Add Account
            </Button>
            {credentials.length > 0 && (
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6 font-bold text-[10px] uppercase gap-2 shadow-lg shadow-blue-100 rounded-xl">
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save All
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {/* Header Row */}
        {filteredCredentials.length > 0 && (
          <div className="grid grid-cols-12 gap-4 px-6 mb-2">
            <div className="col-span-3 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Platform</div>
            <div className="col-span-3 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Username</div>
            <div className="col-span-3 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Password</div>
            <div className="col-span-3 text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Profile Link</div>
          </div>
        )}

        <div className="space-y-1">
          {filteredCredentials.map((cred, index) => {
            const originalIndex = credentials.findIndex(c => c === cred);
            return (
              <div key={index} className="group p-2 rounded-2xl border border-transparent hover:border-blue-50 hover:bg-blue-50/30 transition-all relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => removeCredentialLine(originalIndex)}
                  className="absolute -right-1 top-1/2 -translate-y-1/2 h-7 w-7 rounded-full bg-white border shadow-sm text-red-500 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
                
                <div className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-3">
                    <Select 
                      value={cred.site_id || "none"} 
                      onValueChange={(v) => updateCredential(originalIndex, "site_id", v === "none" ? null : v)}
                    >
                      <SelectTrigger className="h-10 bg-white border-gray-100 text-[11px] hover:shadow-sm transition-all rounded-xl shadow-none">
                        <SelectValue>
                          {cred.site_id 
                            ? sites.find(s => s.id === cred.site_id)?.name || "Loading..." 
                            : "Manual / Other"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-none shadow-xl">
                        <SelectItem value="none">Manual / Other</SelectItem>
                        {sites.map(site => (
                          <SelectItem key={site.id} value={site.id}>{site.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input 
                      value={cred.username}
                      onChange={(e) => updateCredential(originalIndex, "username", e.target.value)}
                      placeholder="Username / Email" 
                      className="h-10 text-xs bg-white border-gray-100 hover:shadow-sm transition-all rounded-xl shadow-none"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input 
                      type="text" 
                      value={cred.password}
                      onChange={(e) => updateCredential(originalIndex, "password", e.target.value)}
                      placeholder="Password" 
                      className="h-10 text-xs bg-white border-gray-100 hover:shadow-sm transition-all rounded-xl shadow-none font-mono"
                    />
                  </div>
                  <div className="col-span-3">
                    <div className="relative group/link">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 group-focus-within/link:text-blue-500" />
                      <Input 
                        value={cred.login_url}
                        onChange={(e) => updateCredential(originalIndex, "login_url", e.target.value)}
                        placeholder="https://..." 
                        className="h-10 text-xs pl-8 bg-white border-gray-100 hover:shadow-sm transition-all rounded-xl shadow-none truncate"
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        
        {filteredCredentials.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed rounded-[2.5rem] bg-gray-50/30 text-gray-400">
            <div className="bg-white w-16 h-16 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6">
              <Key className="w-8 h-8 opacity-20" />
            </div>
            <h4 className="text-sm font-bold text-gray-600 uppercase tracking-widest mb-1">
              {searchTerm ? "No matches found" : "No accounts added yet"}
            </h4>
            <p className="text-[10px] font-medium text-gray-400 max-w-[200px] mx-auto leading-relaxed">
              {searchTerm ? "Try searching for a different platform or username." : "Click 'Add Account' to start building this persona's digital identity."}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
