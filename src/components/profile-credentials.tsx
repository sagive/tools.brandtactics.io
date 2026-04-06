"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Key, Globe, Lock, Loader2, Save, Search, Info } from "lucide-react";
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
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  useEffect(() => {
    fetchSites();
    fetchCredentials();
    fetchNotes();
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

  async function fetchNotes() {
    const { data } = await supabase
      .from("profiles_data")
      .select("notes")
      .eq("id", profileId)
      .single();
    
    if (data?.notes) {
      setNotes(data.notes);
    }
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
      // Upsert the credentials
      const credsToSave = credentials.map(c => ({
        ...c,
        profile_id: profileId,
        site_id: c.site_id === "none" ? null : c.site_id
      }));

      const { error } = await supabase
        .from("profile_credentials")
        .upsert(credsToSave);

      if (error) throw error;
      toast.success("Credentials saved successfully");
      fetchCredentials();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCredentials = credentials.filter(c => {
    const siteName = sites.find(s => s.id === c.site_id)?.name || "Manual / Other";
    return (
      siteName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.username.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

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
          <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
            <Lock className="w-2.5 h-2.5 text-blue-600" />
            Accounts & Credentials
          </h4>
        </div>
        
        <div className="flex items-center gap-4 flex-1 max-w-2xl">
          <div className="relative flex-1 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors group-focus-within:text-blue-600" />
            <Input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search accounts..." 
              className="h-10 pl-11 bg-white border-gray-300 rounded-sm text-xs font-medium focus:ring-1 focus:ring-blue-300 transition-all shadow-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsNotesOpen(!isNotesOpen)} 
                className={cn(
                    "border-gray-300 h-10 px-4 font-bold text-[10px] uppercase rounded-sm shadow-none gap-2",
                    isNotesOpen ? "bg-amber-50 text-amber-700 border-amber-300" : "text-gray-600 hover:bg-gray-50"
                )}
            >
              <Info className="w-3 h-3" /> Note
            </Button>
            <Button variant="outline" size="sm" onClick={addCredentialLine} className="text-blue-600 hover:bg-blue-50 border-blue-300 h-10 px-4 font-bold text-[10px] uppercase rounded-sm shadow-none">
              <Plus className="w-3 h-3 mr-1" /> Add Account
            </Button>
            {credentials.length > 0 && (
              <Button size="sm" onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-6 font-bold text-[10px] uppercase gap-2 rounded-sm shadow-none transition-all active:scale-95">
                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save All
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Notebook Section */}
      <div className={cn(
        "overflow-hidden transition-all duration-500 ease-in-out border-gray-300",
        isNotesOpen ? "max-h-[600px] mb-8 border" : "max-h-0 mb-0 border-transparent pointer-events-none"
      )}>
        <div className="bg-[#fdfcf0] p-0 relative min-h-[300px] flex flex-col">
            {/* Lined Paper effect */}
            <div className="absolute inset-0 z-0 pointer-events-none opacity-50" 
                 style={{ 
                     backgroundImage: 'repeating-linear-gradient(transparent, transparent 27px, #e5e7eb 27px, #e5e7eb 28px)', 
                     backgroundSize: '100% 28px' 
                 }} 
            />
            {/* Vertical Margin line */}
            <div className="absolute left-10 top-0 bottom-0 w-[1px] bg-red-200/60 z-0" />
            
            <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Start typing your notes here..."
                className="relative z-10 w-full min-h-[300px] bg-transparent border-none focus:ring-0 p-10 pl-16 text-sm font-medium text-gray-700 leading-[28px] resize-none"
                style={{ lineHeight: '28px' }}
            />
            
            <div className="relative z-10 p-4 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm flex justify-end">
                <Button 
                    onClick={handleSaveNotes} 
                    disabled={isSavingNotes}
                    className="bg-blue-600 hover:bg-blue-700 h-8 px-4 text-[10px] font-black uppercase rounded-sm shadow-none"
                >
                    {isSavingNotes ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                    Save Note
                </Button>
            </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="border border-gray-300 rounded-sm overflow-hidden bg-white shadow-none">
          {/* Header Row */}
          {filteredCredentials.length > 0 && (
            <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-100 border-b border-gray-300">
              <div className="col-span-3 text-[10px] font-black text-gray-600 uppercase tracking-widest">Platform</div>
              <div className="col-span-3 text-[10px] font-black text-gray-600 uppercase tracking-widest text-center">Username</div>
              <div className="col-span-3 text-[10px] font-black text-gray-600 uppercase tracking-widest text-center">Password</div>
              <div className="col-span-2 text-[10px] font-black text-gray-600 uppercase tracking-widest text-center">Profile Link</div>
              <div className="col-span-1"></div>
            </div>
          )}

          <div className="divide-y divide-gray-200">
            {filteredCredentials.map((cred, index) => {
              const originalIndex = credentials.findIndex(c => c === cred);
              return (
                <div 
                  key={index} 
                  className={cn(
                    "grid grid-cols-12 gap-3 items-center px-4 py-2.5 transition-colors hover:bg-blue-50/50",
                    index % 2 === 0 ? "bg-white" : "bg-gray-100/30"
                  )}
                >
                  <div className="col-span-3">
                    <Select 
                      value={cred.site_id || "none"} 
                      onValueChange={(v) => updateCredential(originalIndex, "site_id", v === "none" ? null : v)}
                    >
                      <SelectTrigger className="h-9 bg-white border-gray-300 text-[11px] rounded-sm w-full font-bold uppercase shadow-none ring-0 focus:ring-1 focus:ring-blue-300">
                        <SelectValue>
                          {cred.site_id 
                            ? sites.find(s => s.id === cred.site_id)?.name || "Loading..." 
                            : "Manual / Other"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="rounded-sm border-gray-300 shadow-none">
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
                      className="h-9 text-[11px] bg-white border-gray-300 rounded-sm w-full font-medium shadow-none focus:ring-1 focus:ring-blue-300"
                    />
                  </div>
                  <div className="col-span-3">
                    <Input 
                      type="text" 
                      value={cred.password}
                      onChange={(e) => updateCredential(originalIndex, "password", e.target.value)}
                      placeholder="Password" 
                      className="h-9 text-[11px] bg-white border-gray-300 rounded-sm w-full font-mono font-medium shadow-none focus:ring-1 focus:ring-blue-300"
                    />
                  </div>
                  <div className="col-span-2">
                    <div className="relative group/link w-full">
                      <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                      <Input 
                        value={cred.login_url}
                        onChange={(e) => updateCredential(originalIndex, "login_url", e.target.value)}
                        placeholder="https://..." 
                        className="h-9 text-[11px] pl-7 bg-white border-gray-300 rounded-sm w-full truncate font-medium shadow-none focus:ring-1 focus:ring-blue-300"
                      />
                    </div>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeCredentialLine(originalIndex)}
                      className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-all rounded-sm shadow-none"
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
          <div className="text-center py-20 border border-dashed border-gray-300 rounded-sm bg-gray-50/30 text-gray-400 shadow-none">
            <div className="bg-white w-16 h-16 rounded-sm border border-gray-300 flex items-center justify-center mx-auto mb-6 shadow-none">
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
