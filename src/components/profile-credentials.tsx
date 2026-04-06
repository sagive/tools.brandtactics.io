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
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [deletedIds, setDeletedIds] = useState<string[]>([]);

  useEffect(() => {
    fetchSites();
    fetchCredentials();
    fetchNotes();
  }, [profileId]);

  async function fetchSites() {
    const { data } = await supabase.from("profile_sites").select("*").order("name");
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

  async function fetchNotes() {
    const { data } = await supabase
      .from("profiles_data")
      .select("notes")
      .eq("id", profileId)
      .single();
    if (data?.notes) setNotes(data.notes);
  }

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    const { error } = await supabase
      .from("profiles_data")
      .update({ notes })
      .eq("id", profileId);

    if (error) {
      toast.error("Failed to save notes");
    } else {
      toast.success("Notes saved");
    }
    setIsSavingNotes(false);
  };

  const addCredentialLine = () => {
    setCredentials([...credentials, { username: "", password: "", login_url: "", site_id: null }]);
  };

  const removeCredentialLine = (index: number) => {
    const credToRemove = credentials[index];
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
      const validCreds = credentials.filter(c => c.username || c.password || c.login_url || (c.site_id && c.site_id !== "none"));
      
      if (validCreds.length === 0 && deletedIds.length === 0) {
        setIsSaving(false);
        return;
      }

      // 3. Prepare for upsert
      const credsToSave = validCreds.map(c => {
        const { id, ...rest } = c;
        const cleaned: any = {
          ...rest,
          profile_id: profileId,
          site_id: c.site_id === "none" ? null : c.site_id
        };
        // Only include ID if it's an existing record (UUID)
        if (id && id.length > 10) cleaned.id = id;
        return cleaned;
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
            onClick={() => setIsNotesOpen(!isNotesOpen)}
            className={cn(
               "h-9 px-4 text-[10px] font-black uppercase tracking-widest rounded-sm border transition-all",
               isNotesOpen ? "bg-amber-50 text-amber-600 border-amber-200" : "text-gray-500 hover:text-gray-900 border-gray-300"
            )}
          >
            <Info className="w-3 h-3 mr-2" /> Note
          </Button>
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

      {/* Slide-down Notebook */}
      {isNotesOpen && (
        <div className="animate-in slide-in-from-top duration-300 overflow-hidden border border-gray-300 rounded-sm bg-[#fdfcf0] relative">
          <div className="absolute top-0 bottom-0 left-10 border-l border-red-200" />
          <div className="relative z-10 p-10 pt-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black uppercase text-amber-900/40 tracking-widest pl-2">Persona Notebook</h4>
              <Button 
                onClick={handleSaveNotes} 
                disabled={isSavingNotes}
                variant="ghost"
                size="sm"
                className="h-7 text-[9px] font-black uppercase tracking-widest border border-amber-200 text-amber-700 hover:bg-amber-100/50"
              >
                {isSavingNotes ? "Saving..." : "Save Note"}
              </Button>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Paste cookies, browser history notes, or identity details here..."
              className="w-full min-h-[200px] bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-800 leading-[1.8] resize-none placeholder:text-amber-900/20"
              style={{
                backgroundImage: 'linear-gradient(transparent, transparent 1.7rem, #e2e8f0 1.7rem)',
                backgroundSize: '100% 1.8rem',
                lineHeight: '1.8rem'
              }}
            />
          </div>
        </div>
      )}

      {/* Table Interface */}
      <div className="border border-gray-300 rounded-sm overflow-hidden bg-gray-50/50">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Platform</th>
              <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Username</th>
              <th className="px-4 py-3 text-[9px] font-black text-gray-400 uppercase tracking-widest">Password</th>
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
                       <SelectValue />
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
