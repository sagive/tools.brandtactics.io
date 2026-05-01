"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Plus, Trash2, Save, Loader2, ExternalLink, GripVertical, FileText, Layout, Table as TableIcon, Maximize2, Minimize2, X as CloseIcon, Link as LinkIcon, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { useAuth } from "@/components/auth-provider";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

function SortableItemWrapper({ id, children }: { id: string, children: React.ReactNode }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 0,
    position: 'relative' as const,
  };

  return (
    <div ref={setNodeRef} style={style} className="flex items-center gap-3 group/item py-1.5 px-3 rounded-lg hover:bg-gray-50/80 transition-all border border-transparent hover:border-gray-100 bg-white">
      <div {...attributes} {...listeners} className="cursor-grab text-gray-300 hover:text-gray-500 touch-none flex items-center justify-center p-1 -ml-2 rtl:-mr-2 rtl:-ml-0">
        <GripVertical className="w-4 h-4" />
      </div>
      {children}
    </div>
  );
}

interface GroupItem {
  id: string;
  label: string;
  urls: string[]; // Supports multiple links
  checked?: boolean;
  checkedBy?: string;
  comment?: string;
}

interface LinkGroup {
  id: string;
  title: string;
  items: GroupItem[];
}

export default function StrategyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = React.use(params);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (groupId: string, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setRepeaterData(prev => prev.map(g => {
      if (g.id === groupId) {
        const oldIndex = g.items.findIndex(i => i.id === active.id);
        const newIndex = g.items.findIndex(i => i.id === over.id);
        return {
          ...g,
          items: arrayMove(g.items, oldIndex, newIndex)
        };
      }
      return g;
    }));
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  // Strategy Data
  const [repeaterData, setRepeaterData] = useState<LinkGroup[]>([]);
  const [sheetUrl, setSheetUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [direction, setDirection] = useState<'ltr' | 'rtl'>('ltr');
  const [lastAddedItemId, setLastAddedItemId] = useState<string | null>(null);
  const [lastAddedGroupId, setLastAddedGroupId] = useState<string | null>(null);

  useEffect(() => {
    const savedDirection = localStorage.getItem(`strategy-direction-${clientId}`);
    if (savedDirection === 'rtl' || savedDirection === 'ltr') {
      setDirection(savedDirection);
    }
  }, [clientId]);

  const handleDirectionChange = (newDir: 'ltr' | 'rtl') => {
    setDirection(newDir);
    localStorage.setItem(`strategy-direction-${clientId}`, newDir);
  };

  const { profile, user } = useAuth();
  const currentUser = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || "Unknown User";

  const toggleItemCheck = (groupId: string, itemId: string, checked: boolean) => {
    setRepeaterData(prev => prev.map(g => 
      g.id === groupId 
        ? { ...g, items: g.items.map(i => i.id === itemId ? { ...i, checked, checkedBy: checked ? currentUser : undefined } : i) }
        : g
    ));
  };

  useEffect(() => {
    async function fetchStrategy() {
      try {
        const { data, error } = await supabase
          .from('client_strategies')
          .select('*')
          .eq('client_id', clientId)
          .single();

        if (data) {
          // Migrate old data (url -> urls)
          const migratedData = (data.repeater_data || []).map((group: any) => ({
            ...group,
            items: (group.items || []).map((item: any) => ({
              ...item,
              urls: item.urls || (item.url ? [item.url] : [""])
            }))
          }));
          setRepeaterData(migratedData);
          setSheetUrl(data.google_sheet_url || "");
          setNotes(data.notes || "");
        }
      } catch (err) {
        console.error("No strategy found or error:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStrategy();
  }, [clientId]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('client_strategies')
        .upsert({
          client_id: clientId,
          repeater_data: repeaterData,
          google_sheet_url: sheetUrl,
          notes: notes,
          updated_at: new Date().toISOString()
        }, { onConflict: 'client_id' });

      if (error) throw error;
      toast.success("Strategy updated successfully!");
    } catch (err: any) {
      toast.error("Failed to save strategy: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Repeater Logic
  const addGroup = () => {
    const newGroupId = crypto.randomUUID();
    const newGroup: LinkGroup = {
      id: newGroupId,
      title: "New Group",
      items: [{ id: crypto.randomUUID(), label: "", urls: [""] }]
    };
    setLastAddedGroupId(newGroupId);
    setLastAddedItemId(null);
    setRepeaterData([...repeaterData, newGroup]);
  };

  const removeGroup = (groupId: string) => {
    setRepeaterData(repeaterData.filter(g => g.id !== groupId));
  };

  const updateGroupTitle = (groupId: string, title: string) => {
    setRepeaterData(repeaterData.map(g => g.id === groupId ? { ...g, title } : g));
  };

  const addItem = (groupId: string) => {
    const newItemId = crypto.randomUUID();
    setLastAddedItemId(newItemId);
    setLastAddedGroupId(null);
    setRepeaterData(prev => prev.map(g => 
      g.id === groupId 
        ? { ...g, items: [...g.items, { id: newItemId, label: "", urls: [""] }] }
        : g
    ));
  };

  const removeItem = (groupId: string, itemId: string) => {
    setRepeaterData(prev => prev.map(g => 
      g.id === groupId 
        ? { ...g, items: g.items.filter(i => i.id !== itemId) }
        : g
    ));
  };

  const updateItem = (groupId: string, itemId: string, field: string, value: any) => {
    setRepeaterData(prev => prev.map(g => 
      g.id === groupId 
        ? { ...g, items: g.items.map(i => i.id === itemId ? { ...i, [field]: value } : i) }
        : g
    ));
  };

  const addLinkToItem = (groupId: string, itemId: string) => {
    setRepeaterData(prev => prev.map(g => 
      g.id === groupId 
        ? { ...g, items: g.items.map(i => i.id === itemId ? { ...i, urls: [...(i.urls || []), ""] } : i) }
        : g
    ));
  };

  const updateLinkInItem = (groupId: string, itemId: string, linkIndex: number, value: string) => {
    setRepeaterData(prev => prev.map(g => 
      g.id === groupId 
        ? { ...g, items: g.items.map(i => i.id === itemId ? { 
            ...i, 
            urls: (i.urls || []).map((u, idx) => idx === linkIndex ? value : u) 
          } : i) }
        : g
    ));
  };

  const removeLinkFromItem = (groupId: string, itemId: string, linkIndex: number) => {
    setRepeaterData(prev => prev.map(g => 
      g.id === groupId 
        ? { ...g, items: g.items.map(i => i.id === itemId ? { 
            ...i, 
            urls: (i.urls || []).filter((_, idx) => idx !== linkIndex) 
          } : i) }
        : g
    ));
  };

  const getFavicon = (url: string) => {
    if (!url) return null;
    try {
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith('http')) cleanUrl = `https://${cleanUrl}`;
      const hostname = new URL(cleanUrl).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 relative min-h-[800px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Client Strategy</h1>
          <p className="text-sm text-gray-500">Plan and organize the long-term SEO roadmap.</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={direction} onValueChange={(val: any) => val && handleDirectionChange(val)}>
            <SelectTrigger className="w-[140px] bg-white">
              <SelectValue placeholder="Direction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ltr">Left to Right</SelectItem>
              <SelectItem value="rtl">Right to Left</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Strategy
          </Button>
        </div>
      </div>

      <Tabs defaultValue="links" className="w-full">
        <TabsList className="bg-white border p-1 h-auto gap-1 mb-6">
          <TabsTrigger value="links" className="flex items-center gap-2 py-2 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <Layout className="w-4 h-4" />
            Grouped Links
          </TabsTrigger>
          <TabsTrigger value="sheets" className="flex items-center gap-2 py-2 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <TableIcon className="w-4 h-4" />
            Google Sheets
          </TabsTrigger>
          <TabsTrigger value="notes" className="flex items-center gap-2 py-2 px-4 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
            <FileText className="w-4 h-4" />
            Strategy Notes
          </TabsTrigger>
        </TabsList>

        {/* Grouped Links Tab */}
        <TabsContent value="links" className="space-y-6 animate-in fade-in-50 duration-300" dir={direction}>
          {/* Fixed Add Group Button */}
          <div className="fixed bottom-8 right-8 z-50">
            <Button onClick={addGroup} variant="outline" className="bg-white hover:bg-gray-50 text-gray-600 border-gray-200 rounded-lg shadow-sm h-10 px-4 flex items-center gap-2">
              <Plus className="w-4 h-4" /> <span className="font-medium text-sm">Add Group</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {repeaterData.map((group) => (
              <Card key={group.id} className="shadow-sm border-gray-200">
                <CardHeader className="pb-3 flex flex-row items-center justify-between bg-gray-50/50 gap-4">
                  <div className="flex-1">
                    <Input 
                      value={group.title} 
                      onChange={(e) => updateGroupTitle(group.id, e.target.value)}
                      className="font-bold border-none bg-transparent hover:bg-white focus:bg-white focus:ring-1 p-0 h-8 text-base"
                      placeholder="Group Title"
                      dir="auto"
                      autoFocus={group.id === lastAddedGroupId}
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeGroup(group.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-6 space-y-2">
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={(e) => handleDragEnd(group.id, e)}
                  >
                    <SortableContext 
                      items={group.items.map(i => i.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <TooltipProvider>
                        {group.items.map((item) => (
                          <SortableItemWrapper key={item.id} id={item.id}>
                            <Tooltip>
                              <TooltipTrigger>
                                <div className="flex items-center justify-center shrink-0">
                                  <Checkbox 
                                    checked={item.checked} 
                                    onCheckedChange={(c) => toggleItemCheck(group.id, item.id, c === true)}
                                    className="data-[state=checked]:bg-green-500 data-[state=checked]:text-white data-[state=checked]:border-green-500 border-gray-300 w-5 h-5 rounded"
                                  />
                                </div>
                              </TooltipTrigger>
                              {item.checked && item.checkedBy && (
                                <TooltipContent side="top">Checked by {item.checkedBy}</TooltipContent>
                              )}
                            </Tooltip>

                            <div className="flex-1 min-w-0">
                          <Input 
                            placeholder="Link Label (e.g. Facebook Page)" 
                            value={item.label}
                            onChange={(e) => updateItem(group.id, item.id, 'label', e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addItem(group.id);
                              }
                            }}
                            className="text-sm h-8 border-none bg-transparent focus:ring-0 shadow-none px-0 font-medium text-gray-700 placeholder:text-gray-300"
                            dir="auto"
                            autoFocus={item.id === lastAddedItemId}
                          />
                        </div>
                        
                        <div className="flex items-center gap-1.5">
                          {/* Render existing links */}
                          {(item.urls || []).map((url, idx) => {
                            const favicon = getFavicon(url);
                            return (
                              <div key={idx} className="flex items-center gap-1">
                                <Popover>
                                  <Tooltip>
                                    <TooltipTrigger>
                                      <PopoverTrigger>
                                        <button className={cn(
                                          "w-7 h-7 rounded-md border flex items-center justify-center transition-all shadow-sm",
                                          url ? "bg-white border-gray-200 hover:border-blue-400" : "bg-gray-50 border-dashed border-gray-300 text-gray-400 hover:text-blue-500 hover:border-blue-300"
                                        )}>
                                          {favicon ? (
                                            <img src={favicon} alt="icon" className="w-4 h-4 rounded-sm" />
                                          ) : (
                                            <LinkIcon className="w-3.5 h-3.5" />
                                          )}
                                        </button>
                                      </PopoverTrigger>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-[10px]">
                                      {url || "Add URL"}
                                    </TooltipContent>
                                  </Tooltip>
                                  <PopoverContent className="w-80 p-3 shadow-xl border-gray-100 rounded-xl" side="bottom" align="end">
                                    <div className="space-y-3">
                                      <div className="flex items-center justify-between">
                                        <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Edit Link {idx + 1}</Label>
                                        <Button 
                                          variant="ghost" 
                                          size="icon" 
                                          className="h-6 w-6 text-red-400 hover:text-red-600"
                                          onClick={() => removeLinkFromItem(group.id, item.id, idx)}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </Button>
                                      </div>
                                      <div className="flex gap-2">
                                        <Input 
                                          placeholder="https://..." 
                                          value={url}
                                          onChange={(e) => updateLinkInItem(group.id, item.id, idx, e.target.value)}
                                          className="text-xs h-8"
                                          autoFocus
                                        />
                                        {url && (
                                          <a 
                                            href={url.startsWith('http') ? url : `https://${url}`} 
                                            target="_blank" 
                                            rel="noreferrer"
                                            className={cn(
                                              buttonVariants({ variant: 'outline', size: 'icon' }),
                                              "h-8 w-8 shrink-0"
                                            )}
                                          >
                                            <ExternalLink className="w-3.5 h-3.5" />
                                          </a>
                                        )}
                                      </div>
                                    </div>
                                  </PopoverContent>
                                </Popover>
                              </div>
                            );
                          })}

                          {/* Add Link Button */}
                          <Tooltip>
                            <TooltipTrigger>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => addLinkToItem(group.id, item.id)} 
                                className="h-7 w-7 text-blue-400 hover:text-blue-600 hover:bg-blue-50 border border-dashed border-blue-200"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Add another link</TooltipContent>
                          </Tooltip>

                          {/* Comment Info Icon */}
                          <Popover>
                            <PopoverTrigger>
                              <Button variant="ghost" size="icon" className={cn("h-7 w-7", item.comment ? "text-blue-500 hover:text-blue-600 bg-blue-50 hover:bg-blue-100" : "text-gray-300 hover:text-gray-500")}>
                                <Info className="w-4 h-4" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80 p-3 shadow-xl border-gray-100 rounded-xl" side="bottom" align="end" dir={direction}>
                              <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Item Comment</Label>
                                <Textarea 
                                  value={item.comment || ""} 
                                  onChange={(e) => updateItem(group.id, item.id, 'comment', e.target.value)}
                                  className="min-h-[100px] text-sm bg-white"
                                  placeholder="Add a comment or note about this item..."
                                />
                              </div>
                            </PopoverContent>
                          </Popover>

                          <div className="w-px h-4 bg-gray-200 mx-1" />

                          {/* Delete Item */}
                          <Tooltip>
                            <TooltipTrigger>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeItem(group.id, item.id)} 
                                className="h-7 w-7 text-gray-300 hover:text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Delete Item</TooltipContent>
                          </Tooltip>
                        </div>
                      </SortableItemWrapper>
                    ))}
                  </TooltipProvider>
                    </SortableContext>
                  </DndContext>
                  
                  <Button variant="ghost" size="sm" onClick={() => addItem(group.id)} className="w-full mt-3 text-blue-600 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-bold border border-dashed border-blue-100 rounded-lg py-4">
                    <Plus className="w-3 h-3 mr-1" /> Add New Item
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {repeaterData.length === 0 && (
            <div className="text-center py-20 bg-white border-2 border-dashed rounded-xl">
              <Layout className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No strategy groups yet</h3>
              <p className="text-gray-500 mb-6">Create groups to organize your strategy links and resources.</p>
              <Button onClick={addGroup} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" /> Create First Group
              </Button>
            </div>
          )}
        </TabsContent>

        {/* Google Sheets Tab */}
        <TabsContent value="sheets" className="animate-in fade-in-50 duration-300">
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Google Sheets Embed</CardTitle>
                <CardDescription>Paste a public Google Sheets URL to embed it here for quick access.</CardDescription>
              </div>
              {sheetUrl && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsFullScreen(true)}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Full Screen
                </Button>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-3">
                <div className="flex-1">
                  <Label htmlFor="sheet-url" className="sr-only">Google Sheet URL</Label>
                  <Input 
                    id="sheet-url"
                    placeholder="https://docs.google.com/spreadsheets/d/..." 
                    value={sheetUrl}
                    onChange={(e) => setSheetUrl(e.target.value)}
                  />
                </div>
              </div>

              {sheetUrl ? (
                <div className="aspect-[16/9] w-full border rounded-xl overflow-hidden bg-gray-50 ring-1 ring-gray-200">
                  <iframe 
                    src={sheetUrl.includes('/edit') ? sheetUrl.replace('/edit', '/preview') : sheetUrl} 
                    className="w-full h-full border-none"
                    title="Google Sheet"
                  />
                </div>
              ) : (
                <div className="aspect-[16/9] w-full flex flex-col items-center justify-center border-2 border-dashed rounded-xl bg-gray-50/50 text-gray-400">
                  <TableIcon className="w-12 h-12 mb-4 opacity-20" />
                  <p>Paste a Google Sheet URL above to see the embed</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Expanded View Overlay using Portal */}
          {isFullScreen && sheetUrl && mounted && createPortal(
            <div className="fixed inset-0 z-[99999] bg-white flex flex-col animate-in fade-in zoom-in duration-300">
              <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-600 flex items-center justify-center text-white">
                    <TableIcon className="w-5 h-5" />
                  </div>
                  <h2 className="font-bold text-gray-900">Google Sheet - Full Screen View</h2>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsFullScreen(false)}
                  className="bg-white border-gray-200 shadow-sm"
                >
                  <Minimize2 className="w-4 h-4 mr-2" />
                  Exit Full Screen
                </Button>
              </div>
              <div className="flex-1 w-full h-full">
                <iframe 
                  src={sheetUrl.includes('/edit') ? sheetUrl.replace('/edit', '/preview') : sheetUrl} 
                  className="w-full h-full border-none"
                  title="Google Sheet Full"
                />
              </div>
            </div>,
            document.body
          )}
        </TabsContent>

        {/* Notes Tab */}
        <TabsContent value="notes" className="animate-in fade-in-50 duration-300">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Strategy Notes</CardTitle>
              <CardDescription>Free-form notes, ideas, and roadmap details.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-md overflow-hidden bg-white">
                <ReactQuill 
                  theme="snow" 
                  value={notes} 
                  onChange={setNotes} 
                  className="[&_.ql-editor]:min-h-[500px] [&_.ql-editor]:text-base [&_.ql-toolbar]:border-x-0 [&_.ql-toolbar]:border-t-0 [&_.ql-container]:border-none" 
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
