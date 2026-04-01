"use client";

import { useState, useEffect } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Link2, X, Plus, Settings2, User, Lock } from "lucide-react";

export function EditBacklinkDialog({ backlink, onBacklinkSaved }: { backlink?: any, onBacklinkSaved?: () => void }) {
  const isEditing = !!backlink;
  const [websiteName, setWebsiteName] = useState(backlink?.website_name || "");
  const [url, setUrl] = useState(backlink?.url || "");
  const [categoryId, setCategoryId] = useState(backlink?.category_id || "");
  const [rank, setRank] = useState(backlink?.rank || 0);
  const [globalUsername, setGlobalUsername] = useState(backlink?.global_username || "");
  const [globalPassword, setGlobalPassword] = useState(backlink?.global_password || "");
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase.from('backlink_categories').select('*').order('rank');
    if (data) {
      setCategories(data);
      if (!categoryId && data.length > 0) setCategoryId(data[0].id);
    }
  }

  const handleSave = async () => {
    if (!websiteName.trim()) { toast.error("Website name is required"); return; }
    if (!url.trim()) { toast.error("URL is required"); return; }
    if (!categoryId) { toast.error("Category is required"); return; }

    setIsSaving(true);
    try {
      const payload = { 
        website_name: websiteName, 
        url, 
        category_id: categoryId, 
        rank: parseInt(rank.toString()) || 0,
        global_username: globalUsername,
        global_password: globalPassword
      };
      
      let error;
      if (isEditing) {
        ({ error } = await supabase.from('backlinks').update(payload).eq('id', backlink.id));
      } else {
        ({ error } = await supabase.from('backlinks').insert([payload]));
      }

      if (error) throw error;

      toast.success(`Backlink ${isEditing ? 'updated' : 'added'} successfully`);
      onBacklinkSaved?.();
      
      // Clear fields if adding a new backlink
      if (!isEditing) {
        setWebsiteName("");
        setUrl("");
        setGlobalUsername("");
        setGlobalPassword("");
      }
      
      // Close dialog
      const closeButton = document.querySelector('[data-slot="dialog-close"]') as HTMLButtonElement;
      if (closeButton) closeButton.click();
    } catch (err: any) {
      toast.error(err.message || "Failed to save backlink");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit Backlink Source" : "Add New Backlink Source"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Website Name</Label>
          <Input value={websiteName} onChange={(e) => setWebsiteName(e.target.value)} placeholder="e.g. Clutch.co" />
        </div>
        <div className="space-y-2">
          <Label>Website URL</Label>
          <Input 
            value={url} 
            onChange={(e) => {
              const newUrl = e.target.value;
              setUrl(newUrl);
              if (!isEditing && !websiteName && newUrl.includes('.')) {
                try {
                  const hostname = newUrl.startsWith('http') ? new URL(newUrl).hostname : new URL(`https://${newUrl}`).hostname;
                  const part = hostname.replace(/^www\./, '').split('.')[0];
                  if (part) setWebsiteName(part.charAt(0).toUpperCase() + part.slice(1));
                } catch (err) {}
              }
            }} 
            placeholder="https://..." 
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            {categories.length > 0 ? (
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full">
                  <SelectValue>
                    {categories.find(c => c.id === categoryId)?.name || "Select category"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="h-10 w-full bg-gray-50 animate-pulse rounded-md border border-gray-200" />
            )}
          </div>
          <div className="space-y-2">
            <Label>Rank</Label>
            <Select value={rank.toString()} onValueChange={(val) => setRank(parseInt(val))}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Rank" />
              </SelectTrigger>
              <SelectContent>
                {[...Array(10)].map((_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {i + 1}
                  </SelectItem>
                )).reverse()}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="flex justify-between">
              Global User
              <span className="text-[10px] text-gray-400 font-normal">Optional</span>
            </Label>
            <Input value={globalUsername} onChange={(e) => setGlobalUsername(e.target.value)} placeholder="Username" />
          </div>
          <div className="space-y-2">
            <Label className="flex justify-between">
              Global Pass
              <span className="text-[10px] text-gray-400 font-normal">Optional</span>
            </Label>
            <Input value={globalPassword} onChange={(e) => setGlobalPassword(e.target.value)} placeholder="Password" />
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <DialogClose>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
          {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Add Backlink"}
        </Button>
      </div>
    </DialogContent>
  );
}
