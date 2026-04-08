"use client";

import React, { useState, useEffect } from "react";
import { Plus, Globe, Trash2, GripVertical, Pencil, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SocialLink {
  id: string; // Ensure this is a string
  client_id: string;
  title: string;
  url: string;
}

// Separate Sortable Item component because hooks must be at top level
function SortableSocialItem({ 
  social, 
  onEdit, 
  onRemove 
}: { 
  social: SocialLink; 
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
  } = useSortable({ id: social.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
  };

  const getFaviconUrl = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
    } catch {
      return null;
    }
  };

  const favicon = getFaviconUrl(social.url);

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
        <div className="w-8 h-8 rounded bg-gray-100 flexitems-center justify-center text-gray-500 overflow-hidden flex shrink-0 items-center">
            {favicon ? (
               <img src={favicon} alt="" className="w-full h-full object-contain p-1" />
            ) : (
               <Globe className="w-4 h-4" />
            )}
        </div>
        <div className="truncate pr-4 flex-1">
          <a
            href={social.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate transition-colors block w-full outline-none"
          >
            {social.title || social.url}
          </a>
        </div>
      </div>
      
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity items-center shrink-0">
        <a 
          href={social.url} 
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

export default function ClientSocials({ clientId }: { clientId: string }) {
  const [socials, setSocials] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState<SocialLink | null>(null);
  
  const [formData, setFormData] = useState<{
    title: string;
    url: string;
  }>({
    title: "",
    url: ""
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    fetchSocials();
  }, [clientId]);

  async function fetchSocials() {
    setIsLoading(true);
    // They used 'resource' as the type for social accounts previously
    const { data, error } = await supabase
      .from("client_links")
      .select("*")
      .eq("client_id", clientId)
      .eq("type", "resource")
      .order("created_at", { ascending: true });
    
    if (error) {
      console.error("Error fetching socials:", error);
    } else {
      setSocials((data || []).map((d: any) => ({
        ...d,
        id: String(d.id) // Ensure string for sortable context
      })));
    }
    setIsLoading(false);
  }

  const handleOpenAdd = () => {
    setIsEditing(null);
    setFormData({ title: "", url: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (social: SocialLink) => {
    setIsEditing(social);
    setFormData({
      title: social.title,
      url: social.url
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.url) {
      toast.error("URL is required");
      return;
    }

    let valUrl = formData.url.trim();
    if (valUrl && !/^https?:\/\//i.test(valUrl)) {
      valUrl = `https://${valUrl}`;
    }

    if (isEditing) {
      const { error } = await supabase
        .from("client_links")
        .update({
          title: formData.title || valUrl,
          url: valUrl
        })
        .eq("id", isEditing.id);

      if (error) {
        toast.error("Failed to update social account");
      } else {
        toast.success("Social account updated");
      }
    } else {
      const { error } = await supabase
        .from("client_links")
        .insert({
          client_id: clientId,
          type: "resource",
          title: formData.title || valUrl,
          url: valUrl
        });

      if (error) {
        toast.error("Failed to add social account");
      } else {
        toast.success("Social account added");
      }
    }

    setIsDialogOpen(false);
    fetchSocials(); // Reload list to get IDs
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("client_links")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete social account");
    } else {
      toast.success("Social account deleted");
      setSocials(socials.filter(s => s.id !== id));
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setSocials((items) => {
        const oldIndex = items.findIndex(item => item.id === active.id);
        const newIndex = items.findIndex(item => item.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        return newItems;
      });
      // Not saving order to DB because client_links lacks order_index, but we maintain UX visually
    }
  };

  return (
    <Card className="border-gray-200 shadow-sm mt-8 xl:mt-0">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-900 border-none">
          Social Accounts
        </CardTitle>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger>
            <div onClick={handleOpenAdd} className="cursor-pointer inline-flex items-center justify-center rounded-md h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-[11px] font-black uppercase tracking-widest px-3 transition-colors">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Social
            </div>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Social Account' : 'Add Social Account'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Title / Name</label>
                <Input 
                  value={formData.title} 
                  onChange={(e) => setFormData({...formData, title: e.target.value})} 
                  placeholder="e.g. Instagram" 
                  className="font-medium"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">URL</label>
                <Input 
                  value={formData.url} 
                  onChange={(e) => setFormData({...formData, url: e.target.value})} 
                  placeholder="https://" 
                  className="font-medium"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white font-bold">Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 text-gray-300 animate-spin" />
          </div>
        ) : socials.length === 0 ? (
          <div className="text-center py-8 text-[11px] text-gray-400 font-medium uppercase tracking-widest border border-dashed rounded-md border-gray-200">
            No social accounts added
          </div>
        ) : (
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="space-y-1 mt-4">
              <SortableContext 
                items={socials.map(s => s.id)}
                strategy={verticalListSortingStrategy}
              >
                {socials.map((social) => (
                  <SortableSocialItem 
                    key={social.id} 
                    social={social} 
                    onEdit={() => handleOpenEdit(social)} 
                    onRemove={() => handleDelete(social.id)} 
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
