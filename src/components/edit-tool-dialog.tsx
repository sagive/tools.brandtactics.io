"use client";

import { useState, useEffect } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Blocks, X, Plus, Settings2 } from "lucide-react";

export function EditToolDialog({ tool, onToolSaved }: { tool?: any, onToolSaved?: () => void }) {
  const isEditing = !!tool;
  const [name, setName] = useState(tool?.name || "");
  const [url, setUrl] = useState(tool?.url || "");
  const [category, setCategory] = useState(tool?.category || "");
  const [iconName, setIconName] = useState(tool?.icon_name || "Blocks");
  const [rank, setRank] = useState(tool?.rank || 0);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase.from('tool_categories').select('*').order('rank');
    if (data) {
      setCategories(data);
      if (!category && data.length > 0) setCategory(data[0].name);
    }
  }

  const handleSave = async () => {
    if (!name.trim()) { toast.error("Name is required"); return; }
    if (!url.trim()) { toast.error("URL is required"); return; }
    if (!category) { toast.error("Category is required"); return; }

    setIsSaving(true);
    try {
      const payload = { name, url, category, icon_name: iconName, rank: parseInt(rank.toString()) || 0 };
      
      let error;
      if (isEditing) {
        ({ error } = await supabase.from('agency_tools').update(payload).eq('id', tool.id));
      } else {
        ({ error } = await supabase.from('agency_tools').insert([payload]));
      }

      if (error) throw error;

      toast.success(`Tool ${isEditing ? 'updated' : 'added'} successfully`);
      onToolSaved?.();
      
      // Close dialog
      const closeButton = document.querySelector('[data-slot="dialog-close"]') as HTMLButtonElement;
      if (closeButton) closeButton.click();
    } catch (err: any) {
      toast.error(err.message || "Failed to save tool");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{isEditing ? "Edit Tool" : "Add New Tool"}</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label>Tool Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Google Analytics" />
        </div>
        <div className="space-y-2">
          <Label>Website URL</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Rank</Label>
            <Input 
              type="number" 
              value={rank} 
              onChange={(e) => setRank(parseInt(e.target.value) || 0)} 
              placeholder="0" 
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Icon Name (Lucide)</Label>
          <Input value={iconName} onChange={(e) => setIconName(e.target.value)} placeholder="Blocks" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <DialogClose>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? "Saving..." : isEditing ? "Save Changes" : "Add Tool"}
        </Button>
      </div>
    </DialogContent>
  );
}
