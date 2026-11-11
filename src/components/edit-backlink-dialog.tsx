"use client";

import { useState, useEffect, useRef } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export function EditBacklinkDialog({ 
  backlink, 
  onBacklinkSaved,
  onClose
}: { 
  backlink?: any, 
  onBacklinkSaved?: (savedBacklink?: any) => void,
  onClose?: () => void
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const isEditing = !!backlink;
  const [websiteName, setWebsiteName] = useState(backlink?.website_name || "");
  const [url, setUrl] = useState(backlink?.url || "");
  const [categoryId, setCategoryId] = useState(backlink?.category_id || "");
  const [rank, setRank] = useState(backlink?.rank || 0);
  const [globalUsername, setGlobalUsername] = useState(backlink?.global_username || "");
  const [globalPassword, setGlobalPassword] = useState(backlink?.global_password || "");
  const [language, setLanguage] = useState(backlink?.language || "english");
  const [description, setDescription] = useState(backlink?.description || "");
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    if (backlink) {
      setWebsiteName(backlink.website_name || "");
      setUrl(backlink.url || "");
      setCategoryId(backlink.category_id || "");
      setRank(backlink.rank || 0);
      setGlobalUsername(backlink.global_username || "");
      setGlobalPassword(backlink.global_password || "");
      setLanguage(backlink.language || "english");
      setDescription(backlink.description || "");
    }
  }, [backlink]);

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
        global_password: globalPassword,
        language,
        description: description?.trim() || null
      };
      
      let error;
      let savedRecord: any = null;
      if (isEditing) {
        const res = await supabase
          .from('backlinks')
          .update(payload)
          .eq('id', backlink.id)
          .select('*, backlink_categories(name)')
          .single();
        error = res.error;
        savedRecord = res.data;
      } else {
        const res = await supabase
          .from('backlinks')
          .insert([payload])
          .select('*, backlink_categories(name)')
          .single();
        error = res.error;
        savedRecord = res.data;
      }

      if (error) throw error;

      const selectedCategory = categories.find(c => c.id === categoryId);
      const finalSaved = savedRecord || {
        ...payload,
        id: backlink?.id,
        backlink_categories: selectedCategory ? { name: selectedCategory.name } : undefined
      };
      if (finalSaved && !finalSaved.backlink_categories && selectedCategory) {
        finalSaved.backlink_categories = { name: selectedCategory.name };
      }

      toast.success(`Backlink ${isEditing ? 'updated' : 'added'} successfully`);
      onBacklinkSaved?.(finalSaved);
      
      // Clear fields if adding a new backlink
      if (!isEditing) {
        setWebsiteName("");
        setUrl("");
        setGlobalUsername("");
        setGlobalPassword("");
        setDescription("");
      }
      
      // Close dialog
      if (closeRef.current) {
        closeRef.current.click();
      } else if (onClose) {
        onClose();
      } else {
        const closeButton = document.querySelector('[data-slot="dialog-close"]') as HTMLButtonElement;
        if (closeButton) closeButton.click();
      }
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
      <div className="space-y-4 py-4 max-h-[75vh] overflow-y-auto px-1">
        <div className="space-y-2">
          <Label htmlFor="backlink-name">Website Name</Label>
          <Input 
            id="backlink-name"
            data-type="name"
            data-value={websiteName}
            value={websiteName} 
            onChange={(e) => setWebsiteName(e.target.value)} 
            placeholder="e.g. Medium, Dev.to" 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="backlink-url">Website URL</Label>
          <Input 
            id="backlink-url"
            data-type="url"
            data-value={url}
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
            <Label htmlFor="backlink-category">Category</Label>
            {categories.length > 0 ? (
              <select
                id="backlink-category"
                data-type="category"
                data-value={categoryId}
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-10 rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-none outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring cursor-pointer"
              >
                <option value="">Select category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            ) : (
              <div className="h-10 w-full bg-gray-50 animate-pulse rounded-md border border-gray-200" />
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="backlink-rank">Rank</Label>
            <select
              id="backlink-rank"
              data-type="rank"
              data-value={rank.toString()}
              value={rank.toString()}
              onChange={(e) => setRank(parseInt(e.target.value) || 0)}
              className="w-full h-10 rounded-lg border border-input bg-white px-3 py-2 text-sm shadow-none outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring cursor-pointer"
            >
              {[...Array(11)].map((_, i) => (
                <option key={i} value={i.toString()}>
                  {i}
                </option>
              )).reverse()}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="backlink-username" className="flex justify-between">
              Global User
              <span className="text-[10px] text-gray-400 font-normal">Optional</span>
            </Label>
            <Input 
              id="backlink-username"
              data-type="global_username" 
              data-value={globalUsername} 
              value={globalUsername} 
              onChange={(e) => setGlobalUsername(e.target.value)} 
              placeholder="Username" 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="backlink-password" className="flex justify-between">
              Global Pass
              <span className="text-[10px] text-gray-400 font-normal">Optional</span>
            </Label>
            <Input 
              id="backlink-password"
              data-type="global_password" 
              data-value={globalPassword} 
              value={globalPassword} 
              onChange={(e) => setGlobalPassword(e.target.value)} 
              placeholder="Password" 
            />
          </div>
        </div>

        {/* Description / Notes field */}
        <div className="space-y-2">
          <Label htmlFor="backlink-description" className="flex justify-between">
            Description / Instructions
            <span className="text-[10px] text-gray-400 font-normal">Optional</span>
          </Label>
          <Textarea 
            id="backlink-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add guidelines, requirements, account rules or text snippet..."
            className="min-h-[85px] text-xs resize-y"
          />
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <Label htmlFor="backlink-language" className="text-xs text-gray-500 font-medium">Language:</Label>
          <select
            id="backlink-language"
            data-type="language"
            data-value={language}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="h-8 rounded-md border border-input bg-white px-2 py-1 text-xs shadow-none outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring cursor-pointer"
          >
            <option value="english">English 🇺🇸</option>
            <option value="hebrew">Hebrew 🇮🇱</option>
          </select>
        </div>
        <div className="flex items-center gap-3">
          <DialogClose ref={closeRef}>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button id="backlink-submit" onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Add Backlink"}
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
