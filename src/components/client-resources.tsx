"use client";

import React, { useState, useEffect } from "react";
import { Plus, Link as LinkIcon, Folder, Globe, Facebook, Key, Settings, Trash2, GripVertical, Pencil, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

function SortableResourceItem({
  resource,
  onEdit,
  onRemove
}: {
  resource: Resource;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: resource.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
  };

  const Icon = ICON_MAP[resource.icon_type] || LinkIcon;
  const isDefaultLink = resource.icon_type === 'link';
  
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
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "group flex items-center justify-between p-3 rounded-md border border-transparent hover:border-gray-200 hover:bg-gray-50 transition-colors bg-white",
        isDragging && "opacity-80 border-gray-300"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500 overflow-hidden flex shrink-0 border border-gray-200/50">
          {isDefaultLink && domain ? (
            <img 
              src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`} 
              alt="" 
              className="w-5 h-5 object-contain fallback-image"
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
        <div className="truncate pr-4 flex-1">
          <a
            href={resource.url.startsWith('http') ? resource.url : `https://${resource.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate transition-colors block w-full outline-none"
          >
            {resource.title || resource.url}
          </a>
        </div>
      </div>
      
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity items-center shrink-0">
        <a 
          href={resource.url.startsWith('http') ? resource.url : `https://${resource.url}`}
          target="_blank" 
          rel="noopener noreferrer"
          className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors rounded-sm hover:bg-blue-50"
        >
          <ExternalLink className="w-4 h-4" />
        </a>
        <Button variant="ghost" size="icon" onClick={onEdit} className="h-7 w-7 text-gray-400 hover:text-gray-900 hover:bg-gray-200">
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={onRemove} className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50">
          <Trash2 className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
      setResources((data || []).map((d: any) => ({
        ...d,
        id: String(d.id) // Ensure string for sortable context
      })));
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
      setResources(resources.filter(r => r.id !== id));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setResources((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        
        // Save new ranks to DB async
        const updates = newItems.map((item, index) => ({
          ...item,
          rank: index
        }));
        
        supabase.from("client_resources").upsert(updates).then(({ error }) => {
          if (error) {
            console.error("Failed to save ranks", error);
            toast.error("Failed to save reordered resources");
          }
        });
        
        return newItems;
      });
    }
  };

  return (
    <Card className="border-gray-200 shadow-sm mt-8 xl:mt-0">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-900 border-none">
          Resources
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>
            <div onClick={handleOpenAdd} className="cursor-pointer inline-flex items-center justify-center rounded-md h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-[11px] font-black uppercase tracking-widest px-3 transition-colors">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add New
            </div>
          </DialogTrigger>
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
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">
                {isEditing ? "Save Changes" : "Add Resource"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-8 text-[11px] text-gray-400 font-medium uppercase tracking-widest border border-dashed rounded-md border-gray-200">
            No resources added yet
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-1 mt-4">
              <SortableContext 
                items={resources.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {resources.map((resource) => (
                  <SortableResourceItem 
                    key={resource.id} 
                    resource={resource} 
                    onEdit={() => handleOpenEdit(resource)} 
                    onRemove={() => handleDelete(resource.id)} 
                  />
                ))}
              </SortableContext>
            </div>
          </DndContext>
        )}
      </CardContent>
    </Card>
  );
}
