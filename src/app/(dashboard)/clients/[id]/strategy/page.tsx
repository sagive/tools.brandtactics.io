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
import { Plus, Trash2, Save, Loader2, ExternalLink, GripVertical, FileText, Layout, Table as TableIcon, Maximize2, Minimize2, X as CloseIcon, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface GroupItem {
  id: string;
  label: string;
  url: string;
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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Strategy Data
  const [repeaterData, setRepeaterData] = useState<LinkGroup[]>([]);
  const [sheetUrl, setSheetUrl] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    async function fetchStrategy() {
      try {
        const { data, error } = await supabase
          .from('client_strategies')
          .select('*')
          .eq('client_id', clientId)
          .single();

        if (data) {
          setRepeaterData(data.repeater_data || []);
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
    const newGroup: LinkGroup = {
      id: crypto.randomUUID(),
      title: "New Group",
      items: [{ id: crypto.randomUUID(), label: "", url: "" }]
    };
    setRepeaterData([...repeaterData, newGroup]);
  };

  const removeGroup = (groupId: string) => {
    setRepeaterData(repeaterData.filter(g => g.id !== groupId));
  };

  const updateGroupTitle = (groupId: string, title: string) => {
    setRepeaterData(repeaterData.map(g => g.id === groupId ? { ...g, title } : g));
  };

  const addItem = (groupId: string) => {
    setRepeaterData(repeaterData.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          items: [...g.items, { id: crypto.randomUUID(), label: "", url: "" }]
        };
      }
      return g;
    }));
  };

  const removeItem = (groupId: string, itemId: string) => {
    setRepeaterData(repeaterData.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          items: g.items.filter(i => i.id !== itemId)
        };
      }
      return g;
    }));
  };

  const updateItem = (groupId: string, itemId: string, field: 'label' | 'url', value: string) => {
    setRepeaterData(repeaterData.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          items: g.items.map(i => i.id === itemId ? { ...i, [field]: value } : i)
        };
      }
      return g;
    }));
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
        <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
          {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
          Save Strategy
        </Button>
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
        <TabsContent value="links" className="space-y-6 animate-in fade-in-50 duration-300">
          <div className="flex justify-end">
            <Button onClick={addGroup} variant="outline" className="text-blue-600 border-blue-200 hover:bg-blue-50">
              <Plus className="w-4 h-4 mr-2" /> Add Group
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {repeaterData.map((group) => (
              <Card key={group.id} className="shadow-sm border-gray-200">
                <CardHeader className="pb-3 flex flex-row items-center justify-between bg-gray-50/50">
                  <div className="flex-1 mr-4">
                    <Input 
                      value={group.title} 
                      onChange={(e) => updateGroupTitle(group.id, e.target.value)}
                      className="font-bold border-none bg-transparent hover:bg-white focus:bg-white focus:ring-1 p-0 h-8 text-base"
                      placeholder="Group Title"
                    />
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeGroup(group.id)} className="text-red-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-6 space-y-3">
                  <TooltipProvider>
                    {group.items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 group/item bg-white p-1 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                        <div className="flex-1">
                          <Input 
                            placeholder="Link Label" 
                            value={item.label}
                            onChange={(e) => updateItem(group.id, item.id, 'label', e.target.value)}
                            className="text-sm h-9 border-none bg-transparent focus:ring-0 shadow-none px-2 font-medium"
                          />
                        </div>
                        
                        <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity pr-2">
                          {/* Edit URL Popover */}
                          <Popover>
                            <Tooltip>
                              <TooltipTrigger>
                                <PopoverTrigger>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                                    <LinkIcon className={cn("w-4 h-4", item.url ? "text-blue-500" : "")} />
                                  </Button>
                                </PopoverTrigger>
                              </TooltipTrigger>
                              <TooltipContent side="top">Edit URL</TooltipContent>
                            </Tooltip>
                            <PopoverContent className="w-80 p-3 shadow-xl border-gray-100 rounded-xl" side="bottom" align="end">
                              <div className="space-y-2">
                                <Label className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Destination URL</Label>
                                <div className="flex gap-2">
                                  <Input 
                                    placeholder="https://..." 
                                    value={item.url}
                                    onChange={(e) => updateItem(group.id, item.id, 'url', e.target.value)}
                                    className="text-xs h-8"
                                    autoFocus
                                  />
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>

                          {/* Open Link */}
                          {item.url && (
                            <Tooltip>
                              <TooltipTrigger>
                                <a 
                                  href={item.url.startsWith('http') ? item.url : `https://${item.url}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className={cn(
                                    buttonVariants({ variant: 'ghost', size: 'icon' }),
                                    "h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 flex items-center justify-center"
                                  )}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </TooltipTrigger>
                              <TooltipContent side="top">Visit Link</TooltipContent>
                            </Tooltip>
                          )}

                          {/* Delete Item */}
                          <Tooltip>
                            <TooltipTrigger>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => removeItem(group.id, item.id)} 
                                className="h-8 w-8 text-gray-400 hover:text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="top">Delete Item</TooltipContent>
                          </Tooltip>
                        </div>
                      </div>
                    ))}
                  </TooltipProvider>
                  
                  <Button variant="ghost" size="sm" onClick={() => addItem(group.id)} className="w-full mt-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 text-[11px] font-bold border border-dashed border-blue-100">
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
