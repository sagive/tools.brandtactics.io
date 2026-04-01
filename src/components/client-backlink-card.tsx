"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink, User, Lock, Save, Loader2, Share2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ClientBacklinkCardProps {
  clientId: string;
  backlink: any; // Global backlink data
  clientData: any; // Client-specific data (from client_backlinks)
  onUpdated: () => void;
}

export function ClientBacklinkCard({ clientId, backlink, clientData, onUpdated }: ClientBacklinkCardProps) {
  const [isUsed, setIsUsed] = useState(clientData?.is_used || false);
  const [username, setUsername] = useState(clientData?.client_username || "");
  const [password, setPassword] = useState(clientData?.client_password || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        client_id: clientId,
        backlink_id: backlink.id,
        is_used: isUsed,
        client_username: username,
        client_password: password,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('client_backlinks')
        .upsert(payload, { onConflict: 'client_id,backlink_id' });

      if (error) throw error;
      
      toast.success(`Backlink updated for client`);
      setIsDirty(false);
      onUpdated();
    } catch (err: any) {
      toast.error(err.message || "Failed to update backlink");
    } finally {
      setIsSaving(false);
    }
  };

  const toggleUsed = (checked: boolean) => {
    setIsUsed(checked);
    setIsDirty(true);
  };

  return (
    <Card className={cn(
      "group transition-all border-gray-200 bg-white overflow-hidden",
      isUsed ? "border-blue-200 shadow-sm" : "opacity-75 grayscale-[0.5] hover:grayscale-0 hover:opacity-100"
    )}>
      <CardContent className="p-4 space-y-4">
        {/* Header: Name and Toggle */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
               <h3 className="font-bold text-gray-900 text-sm truncate">{backlink.website_name}</h3>
               <a href={backlink.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-colors">
                 <ExternalLink className="w-3 h-3" />
               </a>
               <button 
                 onClick={(e) => {
                   e.preventDefault();
                   const url = new URL(window.location.href);
                   url.searchParams.set("search", backlink.website_name);
                   navigator.clipboard.writeText(url.toString());
                   toast.success(`Share link for ${backlink.website_name} copied!`);
                 }}
                 className="text-gray-400 hover:text-blue-600 transition-colors"
                 title="Copy link to this website"
               >
                 <Share2 className="w-3 h-3" />
               </button>
            </div>
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-tight">
              {backlink.backlink_categories?.name || "General"}
            </p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Checkbox 
              checked={isUsed} 
              onCheckedChange={toggleUsed}
              className="h-5 w-5"
            />
            <span className="text-[9px] font-bold text-gray-400 uppercase">Used</span>
          </div>
        </div>

        {/* Credentials Area */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <User className="absolute left-2 top-2.5 h-3 w-3 text-gray-400" />
              <Input 
                placeholder="Client User" 
                value={username} 
                onChange={(e) => { setUsername(e.target.value); setIsDirty(true); }}
                className="pl-7 h-8 text-[11px] bg-gray-50/50 border-gray-100 focus:bg-white"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-2 top-2.5 h-3 w-3 text-gray-400" />
              <Input 
                type="text"
                placeholder="Client Pass" 
                value={password} 
                onChange={(e) => { setPassword(e.target.value); setIsDirty(true); }}
                className="pl-7 h-8 text-[11px] bg-gray-50/50 border-gray-100 focus:bg-white"
              />
            </div>
          </div>

          {/* Global Reference (Small) */}
          {(backlink.global_username || backlink.global_password) && (
            <div className="flex items-center gap-2 px-2 py-1 bg-blue-50/50 rounded border border-blue-100/50 text-[9px] text-blue-600/70">
              <span className="font-bold uppercase shrink-0">Global:</span>
              <span className="truncate">{backlink.global_username || '---'} / {backlink.global_password ? '****' : '---'}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        {isDirty && (
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full h-8 text-xs bg-[#4640A0] hover:bg-[#342e81] gap-2"
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save Alignment
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
