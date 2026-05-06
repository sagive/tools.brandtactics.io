"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ExternalLink, User, Lock, Save, Loader2, Share2, Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { EditTaskDialog } from "@/components/edit-task-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ClientBacklinkCardProps {
  clientId: string;
  backlink: any; // Global backlink data
  clientData: any; // Client-specific data (from client_backlinks)
  onUpdated: () => void;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
}

export function ClientBacklinkCard({ 
  clientId, 
  backlink, 
  clientData, 
  onUpdated, 
  isSelected, 
  onSelect 
}: ClientBacklinkCardProps) {
  const [isUsed, setIsUsed] = useState(clientData?.is_used || false);
  const [isTasked, setIsTasked] = useState(clientData?.is_tasked || false);
  const [username, setUsername] = useState(clientData?.client_username || "");
  const [password, setPassword] = useState(clientData?.client_password || "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);

  // Sync state with props when clientData changes (e.g. after bulk update)
  useEffect(() => {
    setIsUsed(clientData?.is_used || false);
    setIsTasked(clientData?.is_tasked || false);
    setUsername(clientData?.client_username || "");
    setPassword(clientData?.client_password || "");
    setIsDirty(false);
  }, [clientData?.is_used, clientData?.is_tasked, clientData?.client_username, clientData?.client_password]);

  const copyToClipboard = (text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload = {
        client_id: clientId,
        backlink_id: backlink.id,
        is_used: isUsed,
        is_tasked: isTasked,
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

  const toggleTasked = (checked: boolean) => {
    setIsTasked(checked);
    setIsDirty(true);
    if (checked) {
      setIsTaskDialogOpen(true);
    }
  };

  return (
    <Card className={cn(
      "group transition-all border-gray-200 bg-white overflow-hidden relative",
      isSelected ? "ring-2 ring-blue-500 border-blue-500 shadow-md" : (isUsed ? "border-blue-200 shadow-sm" : "opacity-75 grayscale-[0.5] hover:grayscale-0 hover:opacity-100")
    )}>
      {/* Clickable Top Area for Selection */}
      <div 
        onClick={() => onSelect?.(!isSelected)}
        className={cn(
          "absolute top-0 left-0 right-0 h-10 z-20 cursor-pointer flex items-center px-3 transition-colors rounded-t-xl",
          isSelected ? "bg-blue-500/5" : "hover:bg-gray-50/50"
        )}
      >
        <Checkbox 
          checked={isSelected} 
          onCheckedChange={(checked) => onSelect?.(checked as boolean)}
          className="h-4 w-4 bg-white/80 data-[state=checked]:bg-blue-600 border-blue-200"
          onClick={(e) => e.stopPropagation()}
        />
      </div>

      {/* Global Credentials Tooltip (Absolute Top Right) */}
      {(backlink.global_username || backlink.global_password) && (
        <div className="absolute top-3 right-3 z-30">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger render={
                <div className="flex items-center gap-1.5 px-2 py-1 bg-blue-50/50 rounded-lg border border-blue-100/50 cursor-help transition-colors hover:bg-blue-100/50">
                  {backlink.global_username && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(backlink.global_username, "Global Username"); }}
                      className="p-0.5 hover:bg-blue-600 hover:text-white rounded transition-all text-blue-600"
                    >
                      <User className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {backlink.global_password && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); copyToClipboard(backlink.global_password, "Global Password"); }}
                      className="p-0.5 hover:bg-blue-600 hover:text-white rounded transition-all text-blue-600"
                    >
                      <Lock className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              } />
              <TooltipContent>
                <p className="font-bold">Global Directory Credentials</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      )}

      <CardContent className="p-4 space-y-4 pt-10">
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
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center gap-1">
              <Checkbox 
                checked={isTasked} 
                onCheckedChange={toggleTasked}
                className="h-5 w-5 border-blue-200 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
              />
              <span className="text-[9px] font-bold text-gray-400 uppercase">Tasked</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <Checkbox 
                checked={isUsed} 
                onCheckedChange={toggleUsed}
                className="h-5 w-5"
              />
              <span className="text-[9px] font-bold text-gray-400 uppercase">Used</span>
            </div>
          </div>
        </div>

        {/* Credentials Area */}
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="relative group/input">
              <button 
                onClick={() => copyToClipboard(username, "Username")}
                className="absolute left-2 top-2.5 z-10 text-gray-400 hover:text-blue-600 transition-colors"
                title="Copy Username"
              >
                <User className="h-3 w-3" />
              </button>
              <Input 
                placeholder="Client User" 
                value={username} 
                onChange={(e) => { setUsername(e.target.value); setIsDirty(true); }}
                className="pl-7 h-8 text-[11px] bg-gray-50/50 border-gray-200 focus:bg-white"
              />
            </div>
            <div className="relative group/input">
              <button 
                onClick={() => copyToClipboard(password, "Password")}
                className="absolute left-2 top-2.5 z-10 text-gray-400 hover:text-blue-600 transition-colors"
                title="Copy Password"
              >
                <Lock className="h-3 w-3" />
              </button>
              <Input 
                type="text"
                placeholder="Client Pass" 
                value={password} 
                onChange={(e) => { setPassword(e.target.value); setIsDirty(true); }}
                className="pl-7 h-8 text-[11px] bg-gray-50/50 border-gray-200 focus:bg-white"
              />
            </div>
          </div>

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

      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <EditTaskDialog 
          defaultClientId={clientId} 
          defaultDescription={`<br /><br />${backlink.website_name}<br />${backlink.url}`}
          onTaskCreated={() => {
            setIsTaskDialogOpen(false);
            onUpdated();
          }}
        />
      </Dialog>
    </Card>
  );
}
