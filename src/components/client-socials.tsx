"use client";

import React, { useState, useEffect } from "react";
import { Plus, Globe, Trash2, GripVertical, Pencil, ExternalLink, Loader2, User, Lock, Eye, EyeOff, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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
  two_fa?: string;
  rank?: number;
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
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

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
      const hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
    } catch {
      return null;
    }
  };

  const getWebsiteBaseUrl = (url: string) => {
    if (!url) return "";
    try {
      const rawUrl = url.trim();
      const formattedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`;
      const parsed = new URL(formattedUrl);
      return parsed.hostname.replace(/^www\./, "");
    } catch {
      return url;
    }
  };

  const favicon = getFaviconUrl(social.url);
  const websiteBase = getWebsiteBaseUrl(social.url);

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      data-website={websiteBase}
      data-user={social.username || ""}
      data-pass={social.password || ""}
      data-2fa={social.two_fa || ""}
      data-id={social.id}
      className={cn(
        "group flex items-center justify-between p-3 rounded-md border border-transparent hover:border-gray-200 transition-colors",
        index % 2 === 1 ? "bg-gray-50/50" : "bg-white",
        isDragging && "opacity-80 border-gray-300"
      )}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div {...attributes} {...listeners} className="cursor-grab text-gray-400 hover:text-gray-600 shrink-0">
          <GripVertical className="w-4 h-4" />
        </div>
        <div className="w-8 h-8 rounded bg-gray-100 flex items-center justify-center text-gray-500 overflow-hidden flex shrink-0">
            {favicon ? (
               <img src={favicon} alt="" className="w-full h-full object-contain p-1" />
            ) : (
               <Globe className="w-4 h-4" />
            )}
        </div>
        <div className="truncate pr-4 flex-1 flex items-center gap-2 min-w-0">
          <a
            href={social.url.startsWith("http") ? social.url : `https://${social.url}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-semibold text-gray-900 hover:text-blue-600 truncate transition-colors block outline-none"
          >
            {social.title || social.url}
          </a>
          <input 
            type="hidden" 
            data-website={websiteBase} 
            value={social.url} 
            readOnly 
          />
          <input 
            type="hidden" 
            data-2fa={social.two_fa || ""} 
            value={social.two_fa || ""} 
            readOnly 
          />
        </div>
      </div>
      
      <div className="flex gap-2 items-center shrink-0">
        {(social.username || social.password) && (
          <div className="flex items-center gap-1.5 mr-2">
            {social.username && (
              <div className="relative flex items-center">
                <User className="absolute left-2 w-3 h-3 text-gray-400 pointer-events-none z-10" />
                <Input
                  type="text"
                  readOnly
                  disabled
                  value={social.username}
                  data-user={social.username}
                  className="h-7 text-[11px] pl-6 pr-2 w-[120px] bg-white border-gray-200 font-medium text-gray-700 cursor-pointer select-all truncate focus-visible:ring-0 disabled:opacity-100 disabled:cursor-pointer"
                  onClick={(e) => {
                    (e.target as HTMLInputElement).select();
                    navigator.clipboard.writeText(social.username || "");
                    toast.success("Username copied");
                  }}
                  title="Click to copy username"
                />
              </div>
            )}
            {social.password && (
              <div className="relative flex items-center">
                <Lock className="absolute left-2 w-3 h-3 text-gray-400 pointer-events-none z-10" />
                <Input
                  type="text"
                  readOnly
                  disabled
                  value={social.password}
                  data-pass={social.password}
                  className="h-7 text-[11px] pl-6 pr-2 w-[110px] bg-white border-gray-200 font-medium text-gray-700 cursor-pointer select-all truncate focus-visible:ring-0 disabled:opacity-100 disabled:cursor-pointer"
                  onClick={(e) => {
                    (e.target as HTMLInputElement).select();
                    navigator.clipboard.writeText(social.password || "");
                    toast.success("Password copied");
                  }}
                  title="Click to copy password"
                />
              </div>
            )}
          </div>
        )}
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onEdit} 
          data-type="edit-account"
          data-action="edit"
          className="h-7 w-7 text-gray-400 hover:text-gray-900 hover:bg-gray-200"
          title="Edit account"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
        {isConfirmingDelete ? (
          <div className="flex items-center gap-1">
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => {
                setIsConfirmingDelete(false);
                onRemove();
              }}
              data-type="delete-account"
              data-action="confirm-delete"
              className="h-7 px-2.5 text-[10px] font-bold uppercase tracking-wider bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
            >
              Confirm to delete
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsConfirmingDelete(false)} 
              className="h-7 px-2 text-[10px] text-gray-500 hover:bg-gray-100 rounded"
            >
              Cancel
            </Button>
          </div>
        ) : (
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsConfirmingDelete(true)} 
            data-type="delete-account"
            data-action="delete"
            className="h-7 w-7 text-gray-400 hover:text-red-600 hover:bg-red-50"
            title="Delete account"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        )}
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
    two_fa?: string;
  }>({
    title: "",
    url: "",
    username: "",
    password: "",
    two_fa: ""
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
    // Fetch socials ordered by rank first, then created_at
    const { data, error } = await supabase
      .from("client_links")
      .select("*")
      .eq("client_id", clientId)
      .eq("type", "resource")
      .order("rank", { ascending: true })
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
    setFormData({ title: "", url: "", username: "", password: "", two_fa: "" });
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (social: SocialLink) => {
    setIsEditing(social);
    setFormData({
      title: social.title,
      url: social.url,
      username: social.username || "",
      password: social.password || "",
      two_fa: social.two_fa || ""
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
          password: formData.password,
          two_fa: formData.two_fa
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
          password: formData.password,
          two_fa: formData.two_fa,
          rank: socials.length
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

        // Save new ranks to DB async
        const updates = newItems.map((item, index) => ({
          ...item,
          rank: index
        }));

        supabase.from("client_links").upsert(updates).then(({ error }) => {
          if (error) {
            console.error("Failed to save ranks", error);
            toast.error("Failed to save reordered socials");
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
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Username</label>
                  <Input 
                    value={formData.username || ''} 
                    onChange={(e) => setFormData({...formData, username: e.target.value})} 
                    placeholder="Optional" 
                    className="font-medium text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">Password</label>
                  <Input 
                    value={formData.password || ''} 
                    onChange={(e) => setFormData({...formData, password: e.target.value})} 
                    placeholder="Optional" 
                    className="font-medium text-xs"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">2FA Password</label>
                  <Input 
                    value={formData.two_fa || ''} 
                    onChange={(e) => setFormData({...formData, two_fa: e.target.value})} 
                    placeholder="Optional" 
                    className="font-medium text-xs"
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
        <hr className="mt-4 mb-2.5 border-gray-100" />
        <p className="text-[11px] text-gray-400 font-normal leading-relaxed">
          Please note: to have automated tasks work, you need to create a hotmail account with an app password saved under 2fa.{" "}
          <Popover>
            <PopoverTrigger className="text-gray-500 hover:text-gray-700 underline font-medium cursor-pointer">
              Learn more
            </PopoverTrigger>
            <PopoverContent align="start" side="top" className="w-[360px] sm:w-[420px] p-4 text-xs shadow-xl border border-gray-200 bg-white rounded-lg z-50">
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b pb-2">
                  <h4 className="font-bold text-gray-900 text-xs uppercase tracking-wide">
                    Hotmail 2FA & App Password Setup
                  </h4>
                </div>

                <div className="p-2.5 bg-gray-50 rounded-md border border-gray-200/80 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Recovery Email</span>
                    <button 
                      type="button"
                      className="text-[11px] text-gray-700 hover:text-gray-900 font-medium flex items-center gap-1 cursor-pointer"
                      onClick={() => {
                        navigator.clipboard.writeText("growth@brandtactics.io");
                        toast.success("Recovery email copied");
                      }}
                    >
                      growth@brandtactics.io
                      <Copy className="w-3 h-3 text-gray-400" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between pt-1.5 border-t border-gray-200/60">
                    <span className="text-[10px] text-gray-500 font-bold uppercase">Direct Link</span>
                    <a 
                      href="https://account.live.com/proofs/manage/additional" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-[11px] text-gray-700 hover:text-gray-900 font-semibold hover:underline"
                    >
                      Visit Security Page
                    </a>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <p className="font-bold text-gray-800 text-[10px] uppercase tracking-wider">Goal: Activate App Passwords</p>
                  <ol className="list-decimal ml-4 space-y-1 text-[11px] text-gray-700 leading-normal">
                    <li>
                      <strong>Passwordless account</strong> &rarr; turn <strong>ON</strong>
                      <span className="text-gray-500 font-normal"> (if prompted with <i>lilach.nave.1982@gmail.com</i>, click <strong>Cancel</strong>)</span>.
                    </li>
                    <li>
                      Go to <strong>Two-step verification</strong>.
                    </li>
                    <li>
                      Click <strong>Set up the Microsoft Authenticator app</strong> &rarr; hit <strong>Cancel</strong> &rarr; Two-step verification will be turned <strong>ON</strong> &rarr; click <strong>Next</strong> &rarr; <strong>Next</strong>.
                    </li>
                    <li>
                      Scroll down to <strong>App passwords</strong> &rarr; click <strong>Create a new app password</strong> &rarr; save the password in client <strong>Social Accounts &rarr; Hotmail</strong>.
                    </li>
                  </ol>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </p>
      </CardContent>
    </Card>
  );
}
