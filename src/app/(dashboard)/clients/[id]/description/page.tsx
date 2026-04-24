"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const DESCRIPTION_QUILL_MODULES = {
  toolbar: [
    [{ 'header': [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }, { 'align': [] }],
    ['link', 'image', 'code-block'],
    ['clean']
  ],
};

export default function ClientDescription({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [description, setDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [isRtl, setIsRtl] = useState(false);

  useEffect(() => {
    // Load RTL preference for this specific client from local storage
    const savedRtl = localStorage.getItem(`rtl-pref-${id}`);
    if (savedRtl) {
      setIsRtl(savedRtl === 'true');
    }

    async function fetchData() {
      try {
        const { data: clientData } = await supabase
          .from("clients")
          .select("description")
          .eq("id", id)
          .single();
          
        if (clientData) {
          setDescription(clientData.description || "");
        }
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching client description:", error);
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("clients")
      .update({ description })
      .eq("id", id);

    setIsSaving(false);
    if (error) {
      toast.error("Failed to save: " + error.message);
      return;
    }
    
    setIsEditing(false);
    toast.success("Description updated successfully.");
  };

  const handleRtlToggle = (checked: boolean) => {
    setIsRtl(checked);
    localStorage.setItem(`rtl-pref-${id}`, String(checked));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-gray-200 min-h-[500px] flex flex-col">
        <CardContent className="p-8 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-gray-900">Client Description</h2>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-600 cursor-pointer hover:text-gray-900 transition-colors">
                <input 
                  type="checkbox" 
                  checked={isRtl}
                  onChange={(e) => handleRtlToggle(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                RTL Mode (Hebrew)
              </label>

              {!isEditing ? (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit Description
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setIsEditing(false)}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </Button>
                  <Button 
                    size="sm" 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col relative">
            {isRtl && (
              <style dangerouslySetInnerHTML={{__html: `
                [dir="rtl"] .ql-editor ol, 
                [dir="rtl"] .ql-editor ul {
                  margin: 0 20px 0 0 !important;
                  padding: 0 !important;
                }
                [dir="rtl"] .ql-editor ol {
                  list-style: decimal outside !important;
                }
                [dir="rtl"] .ql-editor ul {
                  list-style: disc outside !important;
                }
                [dir="rtl"] .ql-editor li {
                  list-style: inherit !important;
                  padding-left: 0 !important;
                  padding-right: 10px !important;
                }
                [dir="rtl"] .ql-editor li::before {
                  display: none !important;
                }
                [dir="rtl"] .ql-editor li.ql-indent-1 { margin-right: 2em !important; }
                [dir="rtl"] .ql-editor li.ql-indent-2 { margin-right: 4em !important; }
                [dir="rtl"] .ql-editor li.ql-indent-3 { margin-right: 6em !important; }
                [dir="rtl"] .ql-editor li.ql-indent-4 { margin-right: 8em !important; }
                [dir="rtl"] .ql-editor li.ql-indent-5 { margin-right: 10em !important; }
                [dir="rtl"] .ql-editor li.ql-indent-6 { margin-right: 12em !important; }
                [dir="rtl"] .ql-editor li.ql-indent-7 { margin-right: 14em !important; }
                [dir="rtl"] .ql-editor li.ql-indent-8 { margin-right: 16em !important; }
                [dir="rtl"] .ql-editor li.ql-indent-9 { margin-right: 18em !important; }
              `}} />
            )}
            
            {isEditing ? (
              <div 
                dir={isRtl ? "rtl" : "ltr"}
                className="flex-1 border rounded-md bg-white focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:bg-gray-50/50 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[400px] [&_.ql-editor]:text-base"
              >
                <ReactQuill 
                  theme="snow"
                  value={description}
                  onChange={setDescription}
                  modules={DESCRIPTION_QUILL_MODULES}
                  placeholder="Describe this client in detail..."
                />
              </div>
            ) : (
              <div 
                dir={isRtl ? "rtl" : "ltr"}
                className="flex-1 min-h-[400px] ql-snow"
              >
                <div 
                  className="ql-editor p-2 text-lg text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: description || "<p class='text-gray-400 italic font-normal'>No description provided yet.</p>" }} 
                />
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
