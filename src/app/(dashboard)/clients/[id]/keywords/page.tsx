"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface KeywordEntry {
  id?: string;
  keyword: string;
  target_url: string;
  search_volume: number;
}

export default function KeywordsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = React.use(params);
  const [keywords, setKeywords] = useState<KeywordEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

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
        .order("created_at", { ascending: true });

      if (error) throw error;
      setKeywords(data || []);
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
    setKeywords([...keywords, { keyword: "", target_url: "", search_volume: 0 }]);
    setIsDirty(true);
  };

  const handleRemoveRow = (index: number) => {
    const newKeywords = [...keywords];
    newKeywords.splice(index, 1);
    setKeywords(newKeywords);
    setIsDirty(true);
  };

  const handleChange = (index: number, field: keyof KeywordEntry, value: string | number) => {
    const newKeywords = [...keywords];
    newKeywords[index] = { ...newKeywords[index], [field]: value };
    setKeywords(newKeywords);
    setIsDirty(true);
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
        const toInsert = keywords.map(k => ({
          client_id: clientId,
          keyword: k.keyword,
          target_url: k.target_url,
          search_volume: k.search_volume || 0
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
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Manage Keywords</h2>
        <Button 
          onClick={handleSave} 
          disabled={!isDirty || isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>

      <Card className="shadow-sm border-gray-200 overflow-hidden">
        <CardContent className="p-0">
          <div className="bg-gray-50/80 px-4 py-3 border-b border-gray-100 flex items-center text-xs font-bold text-gray-500 uppercase tracking-wider">
            <div className="w-[30%]">Keyword</div>
            <div className="w-[30%]">Target URL</div>
            <div className="w-[20%]">Search Volume</div>
            <div className="w-[20%] text-right">Actions</div>
          </div>
          
          <div className="divide-y divide-gray-100">
            {keywords.map((entry, index) => (
              <div key={index} className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                <div className="w-[30%]">
                  <Input 
                    value={entry.keyword} 
                    onChange={(e) => handleChange(index, "keyword", e.target.value)}
                    placeholder="e.g. best seo tools"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="w-[30%]">
                  <Input 
                    value={entry.target_url} 
                    onChange={(e) => handleChange(index, "target_url", e.target.value)}
                    placeholder="https://example.com/page"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="w-[20%]">
                  <Input 
                    type="number"
                    value={entry.search_volume} 
                    onChange={(e) => handleChange(index, "search_volume", parseInt(e.target.value) || 0)}
                    placeholder="0"
                    className="h-9 text-sm"
                  />
                </div>
                <div className="w-[20%] text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleRemoveRow(index)}
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-9 w-9 p-0"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}

            {keywords.length === 0 && (
              <div className="py-12 text-center text-gray-500 text-sm italic">
                No keywords added yet. Click the button below to add your first keyword.
              </div>
            )}
          </div>
          
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
