"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Key, 
  Globe, 
  Lock, 
  Loader2, 
  Save, 
  Search, 
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Site {
  id: string;
  name: string;
  url: string;
}

interface Credential {
  id?: string;
  site_id: string | null;
  username: string;
  password: string;
  login_url: string;
  two_factor?: string;
}

interface ProfileCredentialsProps {
  profileId: string;
}

export default function ProfileCredentials({ profileId }: ProfileCredentialsProps) {
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [sites, setSites] = useState<Site[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchSites();
    fetchCredentials();
  }, [profileId]);

  async function fetchSites() {
    const { data } = await supabase.from("profile_sites").select("*").order("rank");
    if (data) setSites(data);
  }

  async function fetchCredentials() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("profile_credentials")
      .select("*")
      .eq("profile_id", profileId);
    
    if (data) {
      setCredentials(data);
      setDeletedIds([]); // Reset tracking on load
    }
    setIsLoading(false);
  }

  const addCredentialLine = () => {
    setCredentials([...credentials, { 
      id: crypto.randomUUID(), 
      username: "", 
      password: "", 
      login_url: "", 
      two_factor: "",
      site_id: null 
    }]);
  };

  const removeCredentialLine = (index: number) => {
    const credToRemove = credentials[index];
    // Since we now auto-generate UUIDs for new lines on the client, 
    // only track for DB deletion if it's an existing row we loaded from the database.
    // We can assume it's from the DB if it was successfully fetched (not just typed in).
    // A simple check is if it's already in the DB state. To be safe, we just try to delete all removed IDs.
    if (credToRemove.id) {
      setDeletedIds(prev => [...prev, credToRemove.id!]);
    }
    setCredentials(credentials.filter((_, i) => i !== index));
  };

  const updateCredential = (index: number, field: keyof Credential, value: string | null) => {
    const newCredentials = [...credentials];
    newCredentials[index] = { ...newCredentials[index], [field]: value };
    setCredentials(newCredentials);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Process explicit deletions first
      if (deletedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from("profile_credentials")
          .delete()
          .in("id", deletedIds);
        
        if (deleteError) throw deleteError;
      }

      // 2. Filter out completely empty new rows
      const validCreds = credentials.filter(c => c.username || c.password || c.login_url || c.two_factor || (c.site_id && c.site_id !== "none"));
      
      if (validCreds.length === 0 && deletedIds.length === 0) {
        setIsSaving(false);
        return;
      }

      // 3. Prepare for upsert: Generate UUIDs and Timestamps for any new rows that don't have them
      const credsToSave = validCreds.map(c => {
        const finalId = c.id && c.id.length > 10 ? c.id : crypto.randomUUID();
        return {
          ...c,
          id: finalId,
          profile_id: profileId,
          site_id: c.site_id === "none" ? null : c.site_id,
          created_at: (c as any).created_at || new Date().toISOString()
        };
      });

      // 4. Upsert (Update existing / Insert new)
      if (credsToSave.length > 0) {
        const { error: upsertError } = await supabase
          .from("profile_credentials")
          .upsert(credsToSave, { onConflict: 'id' });

        if (upsertError) throw upsertError;
      }

      toast.success("Credentials saved successfully");
      setDeletedIds([]);
      fetchCredentials();
    } catch (error: any) {
      toast.error("Save failed: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCredentials = credentials.filter(c => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const siteName = sites.find(s => s.id === c.site_id)?.name.toLowerCase() || "";
    return (
      c.username.toLowerCase().includes(term) ||
      siteName.includes(term)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Note toggle and Add Account */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em] flex items-center gap-2">
            <Lock className="w-3 h-3 text-blue-600" /> Accounts & Credentials
          </h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            <Input 
              placeholder="Search accounts..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-8 w-48 text-[11px] font-bold border-gray-300 rounded-sm focus:ring-0 focus:border-blue-500 shadow-none bg-gray-50/50"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={addCredentialLine}
            className="text-blue-600 hover:bg-blue-50 border border-blue-300 h-9 px-4 font-bold text-[10px] uppercase rounded-sm shadow-none"
          >
            <Plus className="w-3 h-3 mr-2" /> Add Account
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-6 font-black text-[10px] uppercase tracking-widest rounded-sm shadow-none transition-all active:scale-95 flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save All
          </Button>
        </div>
      </div>

      {/* Table Interface */}
      <div className="border border-gray-300 rounded-sm overflow-hidden bg-gray-50/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Platform</th>
              <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Username</th>
              <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Password</th>
              <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">2FA</th>
              <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Profile Link</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {(searchTerm ? filteredCredentials : credentials).map((cred, index) => (
              <tr key={index} className={cn(
                "group transition-all hover:bg-blue-50/50 border-b border-gray-200 last:border-0",
                index % 2 === 0 ? "bg-white" : "bg-gray-50/30"
              )}>
                <td className="p-2 border-r border-gray-100">
                  <Select 
                    value={cred.site_id || "none"} 
                    onValueChange={(val) => updateCredential(index, "site_id", val)}
                  >
                    <SelectTrigger className="h-9 border-none bg-transparent font-black text-[10px] uppercase tracking-wider focus:ring-0 shadow-none flex items-center gap-2">
                       <SelectValue placeholder="Select Platform">
                         {cred.site_id && cred.site_id !== "none" ? sites.find(s => s.id === cred.site_id)?.name : "Select Platform"}
                       </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="rounded-sm border-gray-300">
                      <SelectItem value="none" className="text-[10px] font-black uppercase">Select Platform</SelectItem>
                      {sites.map(site => (
                        <SelectItem key={site.id} value={site.id} className="text-[10px] font-black uppercase tracking-wider">
                          {site.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-2 border-r border-gray-100">
                  <Input 
                    value={cred.username} 
                    onChange={(e) => updateCredential(index, "username", e.target.value)}
                    className="h-9 border-none bg-transparent font-bold text-xs focus:ring-0 shadow-none"
                    placeholder="Username/Email"
                  />
                </td>
                <td className="p-2 border-r border-gray-100">
                  <Input 
                    value={cred.password} 
                    onChange={(e) => updateCredential(index, "password", e.target.value)}
                    className="h-9 border-none bg-transparent font-mono text-xs focus:ring-0 shadow-none"
                    placeholder="Password"
                  />
                </td>
                <td className="p-2 border-r border-gray-100">
                  <Input 
                    value={cred.two_factor || ""} 
                    onChange={(e) => updateCredential(index, "two_factor", e.target.value)}
                    className="h-9 border-none bg-transparent font-mono text-[10px] font-bold focus:ring-0 shadow-none"
                    placeholder="2FA Key/Code"
                  />
                </td>
                <td className="p-2">
                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-300" />
                      <Input 
                        value={cred.login_url} 
                        onChange={(e) => updateCredential(index, "login_url", e.target.value)}
                        className="h-9 pl-8 border-none bg-transparent font-bold text-[10px] text-gray-500 focus:ring-0 shadow-none truncate"
                        placeholder="https://..."
                      />
                    </div>
                    {cred.login_url && (
                        <a href={cred.login_url} target="_blank" rel="noreferrer" className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                    )}
                  </div>
                </td>
                <td className="p-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => removeCredentialLine(index)}
                    className="h-8 w-8 text-gray-300 hover:text-red-600 hover:bg-red-50 rounded-sm opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {credentials.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 bg-white">
            <Lock className="w-8 h-8 text-gray-200 mb-4" />
            <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">No accounts stored for this persona</p>
          </div>
        )}
      </div>
    </div>
  );
}
