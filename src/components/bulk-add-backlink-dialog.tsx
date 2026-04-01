"use client";

import { useState, useEffect } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { LayoutGrid, Loader2 } from "lucide-react";

export function BulkAddBacklinkDialog({ onBacklinksSaved }: { onBacklinksSaved?: () => void }) {
  const [urlsText, setUrlsText] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [rank, setRank] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase.from('backlink_categories').select('*').order('rank');
    if (data) {
      setCategories(data);
      if (data.length > 0) setCategoryId(data[0].id);
    }
  }

  const extractNameFromUrl = (url: string) => {
    try {
      // Normalize URL
      const normalizedUrl = url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`;
      const hostname = new URL(normalizedUrl).hostname;
      // Remove www. and grab the first part of the domain
      const part = hostname.replace(/^www\./, '').split('.')[0];
      if (part) return part.charAt(0).toUpperCase() + part.slice(1);
      return url.trim(); // Fallback to raw URL
    } catch (err) {
      return url.trim(); // Fallback for invalid URLs
    }
  };

  const handleSave = async () => {
    const lines = urlsText.split(/[\n,]+/).map(l => l.trim()).filter(l => l.length > 3);
    
    if (lines.length === 0) {
      toast.error("Please enter at least one valid URL");
      return;
    }
    
    if (!categoryId) {
      toast.error("Please select a category");
      return;
    }

    setIsSaving(true);
    try {
      const payloads = lines.map(url => {
        // Ensure URL starts with http
        const finalUrl = url.startsWith('http') ? url : `https://${url}`;
        const websiteName = extractNameFromUrl(finalUrl);
        
        return {
          website_name: websiteName,
          url: finalUrl,
          category_id: categoryId,
          rank: parseInt(rank.toString()) || 0
        };
      });

      const { error } = await supabase.from('backlinks').insert(payloads);

      if (error) throw error;

      toast.success(`Successfully added ${payloads.length} backlinks`);
      onBacklinksSaved?.();
      
      // Clear fields
      setUrlsText("");
      
      // Close dialog
      const closeButton = document.querySelector('[data-slot="dialog-close"]') as HTMLButtonElement;
      if (closeButton) closeButton.click();
    } catch (err: any) {
      toast.error(err.message || "Failed to bulk add backlinks");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-xl">
      <DialogHeader>
        <DialogTitle>Bulk Add Backlink Sources</DialogTitle>
      </DialogHeader>
      <div className="space-y-6 py-4">
        <div className="space-y-2">
          <Label className="flex justify-between">
            Website URLs
            <span className="text-[10px] text-gray-400 font-normal uppercase">ONE PER LINE OR COMMA SEPARATED</span>
          </Label>
          <Textarea 
            value={urlsText} 
            onChange={(e) => setUrlsText(e.target.value)} 
            placeholder="https://clutch.co&#10;https://www.g2.com&#10;trustpilot.com"
            className="h-48 font-mono text-sm leading-relaxed"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Apply Category to All</Label>
            {categories.length > 0 ? (
              <Select value={categoryId} onValueChange={(val) => setCategoryId(val || "")}>
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
            <Label>Default Rank</Label>
            <Select value={rank.toString()} onValueChange={(val) => setRank(parseInt(val || "0"))}>
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

        <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg">
          <p className="text-[11px] text-blue-700 leading-relaxed font-medium">
            💡 <strong>Pro Tip:</strong> We'll automatically identify the website names from your URLs and capitalize them while inserting. You can always edit individual names later in the lobby.
          </p>
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-2">
        <DialogClose>
          <Button variant="outline">Cancel</Button>
        </DialogClose>
        <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 gap-2 min-w-[140px]">
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <LayoutGrid className="w-4 h-4" />}
          {isSaving ? "Inserting..." : "Bulk Insert"}
        </Button>
      </div>
    </DialogContent>
  );
}
