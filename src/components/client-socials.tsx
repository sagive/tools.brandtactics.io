"use client";

import React, { useState, useEffect } from "react";
import { Plus, Globe, Trash2, GripVertical, Pencil, ExternalLink, Loader2, User, Lock, Eye, EyeOff, Copy } from "lucide-react";
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
  username?: string;
  password?: string;
}

// Separate Sortable Item component because hooks must be at top level
function SortableSocialItem({ 
  social, 
  index,
  onEdit, 
  onRemove 
}: { 
  social: SocialLink; 
  index: number;
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
        "group flex items-center justify-between p-3 rounded-md border border-transparent hover:border-gray-200 transition-colors",
        index % 2 === 1 ? "bg-gray-50/50" : "bg-white",
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
      
      <div className="flex gap-2 items-center shrink-0">
        {(social.username || social.password) && (
          <div className="flex items-center gap-1.5 mr-2">
            {social.username && (
              <div 
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-gray-200 text-[11px] text-gray-600 font-medium cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(social.username || "");
                  toast.success("Username copied");
                }}
                title="Click to copy"
              >
                <User className="w-3 h-3 text-gray-400" />
                <span className="truncate max-w-[100px]">{social.username}</span>
              </div>
            )}
            {social.password && (
              <div 
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-white border border-gray-200 text-[11px] text-gray-600 font-medium cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => {
                  navigator.clipboard.writeText(social.password || "");
                  toast.success("Password copied");
                }}
                title="Click to copy password"
              >
                <Lock className="w-3 h-3 text-gray-400" />
                <span className="truncate max-w-[100px]">{social.password}</span>
              </div>
            )}
          </div>
        )}
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
    username?: string;
    password?: string;
  }>({
    title: "",
    url: "",
    username: "",
    password: ""
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
    setFormData({ title: "", url: "", username: "", password: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (social: SocialLink) => {
    setIsEditing(social);
    setFormData({
      title: social.title,
      url: social.url,
      username: social.username || "",
      password: social.password || ""
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
          url: valUrl,
          username: formData.username,
          password: formData.password
        })
        .eq("id", isEditing.id);

      if (error) {
        console.error("Save error:", error);
        toast.error("Failed to update: " + error.message);
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
          url: valUrl,
          username: formData.username,
          password: formData.password
        });

      if (error) {
        console.error("Insert error:", error);
        toast.error("Failed to add: " + error.message);
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
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Username</label>
                  <Input 
                    value={formData.username || ''} 
                    onChange={(e) => setFormData({...formData, username: e.target.value})} 
                    placeholder="Optional" 
                    className="font-medium"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Password</label>
                  <Input 
                    value={formData.password || ''} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    placeholder="Optional" 
                    className="font-medium"
                  />
                </div>
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
                {socials.map((social, idx) => (
                  <SortableSocialItem 
                    key={social.id} 
                    social={social} 
                    index={idx}
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
