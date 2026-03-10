"use client";

import { useState, useEffect } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Trash2, GripVertical, Plus, Save } from "lucide-react";

export function ManageCategoriesDialog({ onCategoriesChanged }: { onCategoriesChanged?: () => void }) {
  const [categories, setCategories] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  async function fetchCategories() {
    const { data } = await supabase.from('tool_categories').select('*').order('rank');
    if (data) setCategories(data);
  }

  const handleAddCategory = async () => {
    if (!newName.trim()) return;
    const maxRank = categories.reduce((max, c) => Math.max(max, c.rank), 0);
    const { error } = await supabase.from('tool_categories').insert([{ name: newName, rank: maxRank + 1 }]);
    if (error) {
      toast.error("Failed to add category");
    } else {
      toast.success("Category added");
      setNewName("");
      fetchCategories();
      onCategoriesChanged?.();
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Are you sure? This might affect tools using this category.")) return;
    const { error } = await supabase.from('tool_categories').delete().eq('id', id);
    if (error) {
      toast.error("Failed to delete category");
    } else {
      toast.success("Category deleted");
      fetchCategories();
      onCategoriesChanged?.();
    }
  };

  const handleUpdateRank = async (id: string, newRank: number) => {
    const { error } = await supabase.from('tool_categories').update({ rank: newRank }).eq('id', id);
    if (error) {
      toast.error("Failed to update rank");
    } else {
      fetchCategories();
      onCategoriesChanged?.();
    }
  };

  const handleUpdateName = async (id: string, name: string) => {
     const { error } = await supabase.from('tool_categories').update({ name }).eq('id', id);
     if (error) {
       toast.error("Failed to update name");
     } else {
       toast.success("Category updated");
       fetchCategories();
       onCategoriesChanged?.();
     }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Manage Categories</DialogTitle>
      </DialogHeader>
      <div className="space-y-4 py-4">
        <div className="flex gap-2">
          <Input 
            placeholder="New category name..." 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <Button size="icon" onClick={handleAddCategory}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
          {categories.map((cat) => (
            <div key={cat.id} className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100 group">
              <Input 
                className="h-8 text-sm" 
                defaultValue={cat.name} 
                onBlur={(e) => e.target.value !== cat.name && handleUpdateName(cat.id, e.target.value)}
              />
              <Input 
                type="number" 
                className="w-16 h-8 text-sm" 
                defaultValue={cat.rank} 
                onBlur={(e) => {
                  const val = parseInt(e.target.value);
                  if (val !== cat.rank) handleUpdateRank(cat.id, val);
                }}
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleDeleteCategory(cat.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-end pt-2">
        <DialogClose>
          <Button variant="outline">Close</Button>
        </DialogClose>
      </div>
    </DialogContent>
  );
}
