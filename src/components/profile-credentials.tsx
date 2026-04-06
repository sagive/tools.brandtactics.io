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
              className="h-10 pl-9 bg-gray-50/50 border-gray-100 rounded-xl text-xs font-medium focus:bg-white transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={addCredentialLine} className="text-blue-600 hover:bg-blue-50 border-blue-100 h-10 px-4 font-bold text-[10px] uppercase rounded-xl">
              <Plus className="w-3 h-3 mr-1" /> Add Account
            </Button>
            {credentials.length > 0 && (
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6 font-bold text-[10px] uppercase gap-2 shadow-md shadow-blue-100 rounded-xl">
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save All
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-100 rounded-sm overflow-hidden bg-white shadow-sm">
          {/* Header Row */}
          {filteredCredentials.length > 0 && (
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100 shadow-inner">
              <div className="col-span-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">Platform</div>
              <div className="col-span-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Username</div>
              <div className="col-span-3 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Password</div>
              <div className="col-span-2 text-[10px] font-black text-gray-500 uppercase tracking-widest text-center">Profile Link</div>
              <div className="col-span-1"></div>
            </div>
          )}

          <div className="divide-y divide-gray-50">
            {filteredCredentials.map((cred, index) => {
              const originalIndex = credentials.findIndex(c => c === cred);
              return (
                <div 
                  key={index} 
                  className={cn(
                    "grid grid-cols-12 gap-3 items-center px-4 py-2.5 transition-colors hover:bg-blue-50/30",
                    index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                  )}
                >
                  <div className="col-span-3">
                    <Select 
                      value={cred.site_id || "none"} 
                      onValueChange={(v) => updateCredential(originalIndex, "site_id", v === "none" ? null : v)}
                    >
                      <SelectTrigger className="h-9 bg-white border-gray-100 text-[11px] rounded-sm w-full font-bold uppercase shadow-none ring-0">
                        <SelectValue>
                          {cred.site_id 
                            ? sites.find(s => s.id === cred.site_id)?.name || "Loading..." 
                            : "Manual / Other"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-sm border-gray-100 shadow-xl">
                        <SelectItem value="none" className="text-xs font-bold uppercase tracking-wider">Manual / Other</SelectItem>
                        {sites.map(site => (
                          <SelectItem key={site.id} value={site.id} className="text-xs font-bold uppercase tracking-wider">{site.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input 
                      value={cred.username}
                      onChange={(e) => updateCredential(originalIndex, "username", e.target.value)}
                      placeholder="Username / Email" 
                      className="h-9 text-[11px] bg-white border-gray-100 rounded-sm w-full font-medium"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input 
                      type="text" 
                      value={cred.password}
                      onChange={(e) => updateCredential(originalIndex, "password", e.target.value)}
                      placeholder="Password" 
                      className="h-9 text-[11px] bg-white border-gray-100 rounded-sm w-full font-mono font-medium"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="relative group/link w-full">
                      <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <Input 
                        value={cred.login_url}
                        onChange={(e) => updateCredential(originalIndex, "login_url", e.target.value)}
                        placeholder="https://..." 
                        className="h-9 text-[11px] pl-7 bg-white border-gray-100 rounded-sm w-full truncate font-medium"
                      />
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeCredentialLine(originalIndex)}
                      className="h-8 w-8 text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all rounded-sm"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
        {filteredCredentials.length === 0 && (
          <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-xl bg-gray-50/30 text-gray-400">
            <div className="bg-white w-16 h-16 rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-6">
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
