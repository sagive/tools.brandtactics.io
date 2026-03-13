"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, Loader2, GripVertical, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

interface KeywordEntry {
  id: string; // Required for dnd-kit
  keyword: string;
  target_url: string;
  search_volume: number;
  importance?: 'low' | 'normal' | 'high';
  order_index?: number;
}

interface ClientLink {
  id?: string;
  title: string;
  url: string;
}

function LinkRepeaterWidget({ clientId, type, title }: { clientId: string, type: 'competitor' | 'resource', title: string }) {
  const [links, setLinks] = useState<ClientLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    fetchLinks();
  }, [clientId]);

  const fetchLinks = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("client_links")
        .select("*")
        .eq("client_id", clientId)
        .eq("type", type)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setLinks((data || []).map((d: any) => ({
        id: d.id,
        title: d.title,
        url: d.url
      })));
    } catch (error: any) {
      if (error.code !== '42P01') {
        console.error("Error fetching links:", error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setLinks([...links, { id: Math.random().toString(36).substr(2, 9), title: "", url: "" }]);
    setIsDirty(true);
  };

  const handleRemove = (index: number) => {
    const newLinks = [...links];
    newLinks.splice(index, 1);
    setLinks(newLinks);
    setIsDirty(true);
  };

  const handleChange = (index: number, field: 'title'|'url', value: string) => {
    const newLinks = [...links];
    newLinks[index] = { ...newLinks[index], [field]: value };
    setLinks(newLinks);
    setIsDirty(true);
  };

  const handleUrlBlur = (e: React.FocusEvent<HTMLInputElement>, index: number) => {
    let val = e.target.value.trim();
    if (val && !/^https?:\/\//i.test(val)) {
      val = `https://${val}`;
      handleChange(index, 'url', val);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error: deleteError } = await supabase
        .from("client_links")
        .delete()
        .eq("client_id", clientId)
        .eq("type", type);
      if (deleteError) throw deleteError;

      if (links.length > 0) {
        const toInsert = links.map(l => ({
          client_id: clientId,
          type: type,
          title: l.title,
          url: l.url
        }));
        const { error: insertError } = await supabase
          .from("client_links")
          .insert(toInsert);
        if (insertError) throw insertError;
      }
      setIsDirty(false);
      setIsEditing(false);
      fetchLinks(); 
      toast.success(`${title} saved successfully.`);
    } catch (err: any) {
      toast.error(`Failed to save ${title}: ` + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const getFaviconUrl = (url: string) => {
    try {
      const hostname = new URL(url).hostname;
      return `https://www.google.com/s2/favicons?domain=${hostname}&sz=32`;
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <Card className="shadow-sm border-gray-200">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
           <h3 className="font-semibold text-gray-900 text-sm">{title}</h3>
        </div>
        <CardContent className="p-12 flex justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-gray-200 flex flex-col h-full bg-white">
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 text-[15px]">{title}</h3>
        <Button 
          variant={isEditing ? (isDirty ? "default" : "outline") : "ghost"} 
          size="sm" 
          onClick={() => {
            if (isEditing) {
              if (isDirty) {
                handleSave();
              } else {
                setIsEditing(false);
              }
            } else {
              setIsEditing(true);
            }
          }}
          disabled={isSaving}
          className={`h-7 px-3 text-xs shadow-none ${isEditing && isDirty ? 'bg-blue-500 hover:bg-blue-600 text-white border-transparent' : ''}`}
        >
          {isSaving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
          {isEditing ? (isDirty ? "Save" : "Done") : "Edit"}
        </Button>
      </div>
      <CardContent className="p-0 flex-1 flex flex-col">
        <div className="divide-y divide-gray-50 flex-1">
          {!isEditing ? (
            links.length > 0 ? (
              links.map((link, idx) => {
                const favicon = getFaviconUrl(link.url);
                return (
                  <div key={link.id || idx} className="px-5 py-3 flex items-center hover:bg-gray-50/50 transition-colors group">
                    {favicon ? (
                      <img src={favicon} alt="" className="w-4 h-4 mr-3 rounded-sm object-contain" />
                    ) : (
                      <ExternalLink className="w-4 h-4 mr-3 text-gray-400" />
                    )}
                    <a 
                      href={link.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-sm font-medium text-gray-700 hover:text-blue-600 flex-1 truncate transition-colors"
                    >
                      {link.title || link.url}
                    </a>
                  </div>
                );
              })
            ) : (
              <div className="px-5 py-8 text-center text-xs text-gray-400 italic">
                No {title.toLowerCase()} added yet. Click edit to add them.
              </div>
            )
          ) : (
            <div className="p-4 space-y-3 bg-gray-50/30">
              {links.map((link, index) => (
                <div key={link.id || index} className="flex gap-2 items-start">
                  <Input 
                    value={link.title} 
                    onChange={(e) => handleChange(index, 'title', e.target.value)}
                    placeholder="Title"
                    className="h-8 text-xs flex-1 bg-white"
                  />
                  <Input 
                    value={link.url} 
                    onChange={(e) => handleChange(index, 'url', e.target.value)}
                    onBlur={(e) => handleUrlBlur(e, index)}
                    placeholder="https://"
                    className="h-8 text-xs flex-[1.5] bg-white"
                  />
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemove(index)}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 p-0 shrink-0"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ))}
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleAdd}
                className="w-full h-8 border-dashed text-xs hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 bg-white"
              >
                <Plus className="w-3 h-3 mr-1" /> Add {title.slice(0, -1)}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Separate component for sortable row
function SortableKeywordRow({ 
  entry, 
  index, 
  onChange, 
  onRemove 
}: { 
  entry: KeywordEntry; 
  index: number; 
  onChange: (index: number, field: keyof KeywordEntry, value: any) => void; 
  onRemove: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: entry.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    boxShadow: isDragging ? '0 5px 15px rgba(0,0,0,0.1)' : 'none',
  };

  const getImportanceBadge = (importance?: string) => {
    switch(importance) {
      case 'high': return <Badge className="bg-red-50 text-red-700 hover:bg-red-100 border-red-200 shadow-none">High</Badge>;
      case 'low': return <Badge className="bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200 shadow-none">Low</Badge>;
      case 'normal':
      default: return <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 shadow-none">Normal</Badge>;
    }
  };

  const handleUrlBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    let val = e.target.value.trim();
    if (val && !/^https?:\/\//i.test(val)) {
      val = `https://${val}`;
      onChange(index, "target_url", val);
    }
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <div ref={setNodeRef} style={style} className={`px-4 py-3 flex items-center gap-4 hover:bg-gray-50/50 transition-colors bg-white ${isDragging ? 'opacity-90 relative' : ''}`}>
      <div 
        {...attributes} 
        {...listeners}
        className="cursor-move text-gray-300 hover:text-gray-500 py-2 -ml-2"
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <div className="w-[30%]">
        <Input 
          value={entry.keyword} 
          onChange={(e) => onChange(index, "keyword", e.target.value)}
          placeholder="e.g. best seo tools"
          className="h-9 text-sm focus-visible:ring-1 focus-visible:border-blue-500"
        />
      </div>
      <div className="w-[30%] relative">
        <Input 
          value={entry.target_url} 
          onChange={(e) => onChange(index, "target_url", e.target.value)}
          onBlur={handleUrlBlur}
          placeholder="https://example.com/page"
          className="h-9 text-sm focus-visible:ring-1 focus-visible:border-blue-500 pr-8"
        />
        {entry.target_url && isValidUrl(entry.target_url) && (
          <a
            href={entry.target_url}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-blue-600 hover:bg-gray-100 rounded transition-colors"
            title="Open in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
      <div className="w-[15%]">
        <Input 
          type="number"
          value={entry.search_volume === 0 ? "" : entry.search_volume} 
          onChange={(e) => onChange(index, "search_volume", parseInt(e.target.value) || 0)}
          placeholder="0"
          className="h-9 text-sm focus-visible:ring-1 focus-visible:border-blue-500"
        />
      </div>
      <div className="w-[15%]">
        <Select 
          value={entry.importance || 'normal'} 
          onValueChange={(val: any) => onChange(index, "importance", val)}
        >
          <SelectTrigger className="h-9 focus:ring-1 focus:ring-blue-500 bg-white shadow-none">
            <div className="flex items-center gap-2">
               {getImportanceBadge(entry.importance)}
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low"><Badge className="bg-gray-100 text-gray-600 border-gray-200 shadow-none hover:bg-gray-100">Low</Badge></SelectItem>
            <SelectItem value="normal"><Badge className="bg-blue-50 text-blue-700 border-blue-200 shadow-none hover:bg-blue-50">Normal</Badge></SelectItem>
            <SelectItem value="high"><Badge className="bg-red-50 text-red-700 border-red-200 shadow-none hover:bg-red-50">High</Badge></SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="w-[10%] text-right flex justify-end">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onRemove(index)}
          className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-9 w-9 p-0"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function KeywordsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = React.use(params);
  const [keywords, setKeywords] = useState<KeywordEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    if (clientId) {
      fetchKeywords();
    }
  }, [clientId]);

  const fetchKeywords = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("client_keywords")
        .select("*")
        .eq("client_id", clientId)
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Ensure all rows have an ID for dnd-kit
      const mappedData = (data || []).map((k: any) => ({
        ...k,
        id: k.id || Math.random().toString(36).substr(2, 9)
      }));
      setKeywords(mappedData);
    } catch (error: any) {
      console.error("Error fetching keywords:", error.message);
      // If table doesn't exist yet, we'll just show an empty list
      if (error.code === '42P01') {
        toast.error("Table 'client_keywords' not found. Please create it in Supabase.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddRow = () => {
    setKeywords([...keywords, { 
      id: Math.random().toString(36).substr(2, 9), 
      keyword: "", 
      target_url: "", 
      search_volume: 0,
      importance: 'normal'
    }]);
    setIsDirty(true);
  };

  const handleRemoveRow = (index: number) => {
    const newKeywords = [...keywords];
    newKeywords.splice(index, 1);
    setKeywords(newKeywords);
    setIsDirty(true);
  };

  const handleChange = (index: number, field: keyof KeywordEntry, value: any) => {
    const newKeywords = [...keywords];
    newKeywords[index] = { ...newKeywords[index], [field]: value };
    setKeywords(newKeywords);
    setIsDirty(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setKeywords((items: KeywordEntry[]) => {
        const oldIndex = items.findIndex((item: KeywordEntry) => item.id === active.id);
        const newIndex = items.findIndex((item: KeywordEntry) => item.id === over.id);
        setIsDirty(true);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // 1. Delete all existing keywords for this client
      // (Simple approach for a repeater: delete and re-insert)
      const { error: deleteError } = await supabase
        .from("client_keywords")
        .delete()
        .eq("client_id", clientId);

      if (deleteError) throw deleteError;

      // 2. Insert new list
      if (keywords.length > 0) {
        const toInsert = keywords.map((k: KeywordEntry, idx: number) => ({
          client_id: clientId,
          keyword: k.keyword,
          target_url: k.target_url,
          search_volume: k.search_volume || 0,
          importance: k.importance || 'normal',
          order_index: idx
        }));

        const { error: insertError } = await supabase
          .from("client_keywords")
          .insert(toInsert);

        if (insertError) throw insertError;
      }

      toast.success("Keywords saved successfully.");
      setIsDirty(false);
    } catch (error: any) {
      toast.error("Failed to save keywords: " + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LinkRepeaterWidget clientId={clientId as string} type="competitor" title="Competitors" />
        <LinkRepeaterWidget clientId={clientId as string} type="resource" title="Resources" />
      </div>

      <Card className="shadow-sm border-gray-200 overflow-hidden bg-white">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-[17px] font-semibold text-gray-900 tracking-tight">Manage Keywords</h2>
          <Button 
            onClick={handleSave} 
            disabled={!isDirty || isSaving}
            className="bg-[#7B96E4] hover:bg-[#6882E0] text-white shadow-none h-8 px-4 text-xs font-medium rounded-[6px]"
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
            ) : (
              <Save className="w-3 h-3 mr-1.5" />
            )}
            Save Changes
          </Button>
        </div>

        <CardContent className="p-0">
          <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
            <div className="w-6 mr-4 flex-shrink-0"></div> {/* Drag handle space */}
            <div className="w-[30%] text-left">Keyword</div>
            <div className="w-[30%]">Target URL</div>
            <div className="w-[15%]">Search Volume</div>
            <div className="w-[15%]">Importance</div>
            <div className="w-[10%] text-right">Actions</div>
          </div>
          
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="divide-y divide-gray-100 min-h-[50px]">
              <SortableContext 
                items={keywords.map((k: KeywordEntry) => k.id)}
                strategy={verticalListSortingStrategy}
              >
                {keywords.map((entry: KeywordEntry, index: number) => (
                  <SortableKeywordRow 
                    key={entry.id} 
                    entry={entry} 
                    index={index} 
                    onChange={handleChange} 
                    onRemove={handleRemoveRow} 
                  />
                ))}
              </SortableContext>

            {keywords.length === 0 && (
              <div className="py-12 text-center text-gray-500 text-sm italic">
                No keywords added yet. Click the button below to add your first keyword.
              </div>
            )}
            </div>
          </DndContext>
          
          <div className="p-4 bg-gray-50/30 border-t border-gray-100">
            <Button 
              variant="outline" 
              onClick={handleAddRow}
              className="w-full border-dashed border-2 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-700 transition-all font-medium py-6"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Keyword Row
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <div className="text-[13px] text-gray-500 bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex gap-3">
        <div className="font-bold text-blue-700">Ref:</div>
        <div>
          Keywords tracking helps monitor target pages and their search potential. Make sure to update accurately for SEO reports.
        </div>
      </div>
    </div>
  );
}
