"use client";

import React, { useState, useEffect } from "react";
import { Plus, Link as LinkIcon, Folder, Globe, Facebook, Key, Settings, Trash2, GripVertical, Pencil, ExternalLink, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Resource {
  id: string;
  client_id: string;
  title: string;
  url: string;
  icon_type: string;
  rank: number;
}

const ICON_MAP: Record<string, any> = {
  link: LinkIcon,
  folder: Folder,
  globe: Globe,
  facebook: Facebook,
  login: Key,
  settings: Settings,
};

export default function ClientResources({ clientId }: { clientId: string }) {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<Resource | null>(null);
  
  const [formData, setFormData] = useState<{
    title: string;
    url: string;
    icon_type: string;
  }>({
    title: "",
    url: "",
    icon_type: "link"
  });

  useEffect(() => {
    fetchResources();
  }, [clientId]);

  async function fetchResources() {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("client_resources")
      .select("*")
      .eq("client_id", clientId)
      .order("rank", { ascending: true });
    
    if (error) {
      console.error("Error fetching resources:", error);
    } else {
      setResources(data || []);
    }
    setIsLoading(false);
  }

  const handleOpenAdd = () => {
    setIsEditing(null);
    setFormData({ title: "", url: "", icon_type: "link" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (resource: Resource) => {
    setIsEditing(resource);
    setFormData({
      title: resource.title,
      url: resource.url,
      icon_type: resource.icon_type
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.url) {
      toast.error("Please fill in all fields");
      return;
    }

    if (isEditing) {
      const { error } = await supabase
        .from("client_resources")
        .update({
          title: formData.title,
          url: formData.url,
          icon_type: formData.icon_type
        })
        .eq("id", isEditing.id);

      if (error) toast.error("Failed to update resource");
      else {
        toast.success("Resource updated");
        setIsDialogOpen(false);
        fetchResources();
      }
    } else {
      const maxRank = resources.length > 0 ? Math.max(...resources.map(r => r.rank)) : -1;
      const { error } = await supabase
        .from("client_resources")
        .insert([{
          client_id: clientId,
          title: formData.title,
          url: formData.url,
          icon_type: formData.icon_type,
          rank: maxRank + 1
        }]);

      if (error) toast.error("Failed to add resource");
      else {
        toast.success("Resource added");
        setIsDialogOpen(false);
        fetchResources();
      }
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("client_resources")
      .delete()
      .eq("id", id);

    if (error) toast.error("Failed to delete resource");
    else {
      toast.success("Resource deleted");
      fetchResources();
    }
  };

  const moveRank = async (index: number, direction: 'up' | 'down') => {
    const newResources = [...resources];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newResources.length) return;

    // Swap ranks in database
    const itemA = newResources[index];
    const itemB = newResources[targetIndex];

    const { error } = await supabase
      .from("client_resources")
      .upsert([
        { id: itemA.id, rank: itemB.rank },
        { id: itemB.id, rank: itemA.rank }
      ]);

    if (error) toast.error("Failed to reorder");
    else fetchResources();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Resources</h3>
        <Button variant="ghost" size="sm" onClick={handleOpenAdd} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 font-bold text-xs uppercase">
          <Plus className="w-4 h-4 mr-1" /> Add New
        </Button>
      </div>

      <div className="space-y-2">
        {isLoading ? (
          <div className="text-xs text-gray-400 py-4">Loading resources...</div>
        ) : resources.length === 0 ? (
          <div className="text-xs text-gray-400 py-8 text-center border-2 border-dashed rounded-lg bg-gray-50/50">
            No resources added yet.
          </div>
        ) : (
          resources.map((resource, index) => {
            const Icon = ICON_MAP[resource.icon_type] || LinkIcon;
            const isDefaultLink = resource.icon_type === 'link';
            
            // Helper to get domain for favicon
            const getDomain = (url: string) => {
              try {
                const cleanUrl = url.startsWith('http') ? url : `https://${url}`;
                return new URL(cleanUrl).hostname;
              } catch {
                return null;
              }
            };
            const domain = getDomain(resource.url);

            return (
              <div key={resource.id} className="group flex items-center justify-between p-2 rounded-md hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded bg-gray-100 text-gray-500 flex items-center justify-center shrink-0 overflow-hidden border border-gray-200/50">
                    {isDefaultLink && domain ? (
                      <img 
                        src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} 
                        alt="" 
                        className="w-5 h-5 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).parentElement?.querySelector('.fallback-icon')?.classList.remove('hidden');
                        }}
                      />
                    ) : (
                      <Icon className="w-4 h-4" />
                    )}
                    <Icon className={cn("w-4 h-4 fallback-icon", isDefaultLink && domain ? "hidden" : "")} />
                  </div>
                  <div>
                    <a 
                      href={resource.url.startsWith('http') ? resource.url : `https://${resource.url}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-gray-900 hover:text-blue-600 flex items-center gap-1.5"
                    >
                      {resource.title}
                      <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600" onClick={() => moveRank(index, 'up')} disabled={index === 0}>
                    <ChevronUp className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600" onClick={() => moveRank(index, 'down')} disabled={index === resources.length - 1}>
                    <ChevronDown className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-blue-600" onClick={() => handleOpenEdit(resource)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDelete(resource.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Resource" : "Add New Resource"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase text-gray-500">Title</label>
              <Input 
                value={formData.title} 
                onChange={(e) => setFormData({...formData, title: e.target.value})} 
                placeholder="e.g., Website Analytics"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase text-gray-500">URL</label>
              <Input 
                value={formData.url} 
                onChange={(e) => setFormData({...formData, url: e.target.value})} 
                placeholder="https://..."
              />
            </div>
            <div className="grid gap-2">
              <label className="text-xs font-bold uppercase text-gray-500">Icon Type</label>
              <Select 
                value={formData.icon_type || "link"} 
                onValueChange={(v) => setFormData({...formData, icon_type: v || "link"})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="link">Link</SelectItem>
                  <SelectItem value="folder">Folder</SelectItem>
                  <SelectItem value="globe">Globe</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="login">Login/Key</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700">
              {isEditing ? "Save Changes" : "Add Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
