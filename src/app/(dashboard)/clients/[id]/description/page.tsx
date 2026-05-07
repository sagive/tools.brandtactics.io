"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Save, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

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
            <style dangerouslySetInnerHTML={{ __html: `
              .description-preview-content {
                font-family: Inter, sans-serif;
                line-height: 1.8;
                color: #374151;
              }
              .description-preview-content p { margin-bottom: 24px; }
              .description-preview-content h1 { font-size: 32px; margin-top: 40px; margin-bottom: 20px; font-weight: 800; }
              .description-preview-content h2 { font-size: 28px; margin-top: 36px; margin-bottom: 18px; font-weight: 700; }
              .description-preview-content h3 { font-size: 24px; margin-top: 32px; margin-bottom: 16px; font-weight: 700; }
              .description-preview-content h4 { font-size: 20px; margin-top: 28px; margin-bottom: 14px; font-weight: 600; }
              .description-preview-content img { max-width: 100%; border-radius: 8px; margin: 20px 0; }
              .description-preview-content ul, .description-preview-content ol { margin-bottom: 24px; padding-inline-start: 40px; }
              .description-preview-content li { margin-bottom: 8px; }
              .description-preview-content table { border-collapse: collapse; width: 100%; margin-bottom: 24px; border: 1px solid #e5e7eb; }
              .description-preview-content table td, .description-preview-content table th { border: 1px solid #e5e7eb; padding: 12px; }
              .description-preview-content code { background: #f3f4f6; padding: 2px 4px; rounded: 4px; font-family: monospace; }
              .description-preview-content pre { background: #1f2937; color: #f9fafb; padding: 16px; rounded: 8px; margin-bottom: 24px; overflow-x: auto; }
            `}} />
            
            {isEditing ? (
              <div 
                dir={isRtl ? "rtl" : "ltr"}
                className="flex-1 border rounded-md bg-white overflow-hidden"
              >
                <JoditEditor
                  value={description}
                  config={{
                    readonly: false,
                    height: 500,
                    direction: isRtl ? 'rtl' : 'ltr',
                    uploader: {
                      insertImageAsBase64URI: true
                    },
                    placeholder: 'Describe this client in detail...',
                    style: {
                      fontFamily: 'Inter, sans-serif',
                      fontSize: '16px',
                      color: '#374151',
                      lineHeight: '1.6',
                      padding: '20px'
                    },
                    iframe: true,
                    iframeStyle: `
                      body { 
                        padding: 20px !important; 
                        font-family: Inter, sans-serif !important; 
                        line-height: 1.6 !important;
                        color: #374151 !important;
                      }
                      p { margin-bottom: 24px !important; }
                      h1 { font-size: 32px !important; margin-top: 40px !important; margin-bottom: 20px !important; font-weight: 800 !important; }
                      h2 { font-size: 28px !important; margin-top: 36px !important; margin-bottom: 18px !important; font-weight: 700 !important; }
                      h3 { font-size: 24px !important; margin-top: 32px !important; margin-bottom: 16px !important; font-weight: 700 !important; }
                      h4 { font-size: 20px !important; margin-top: 28px !important; margin-bottom: 14px !important; font-weight: 600 !important; }
                      img { max-width: 100%; border-radius: 8px; margin: 20px 0; }
                      ul, ol { margin-bottom: 24px !important; padding-inline-start: 40px !important; }
                      li { margin-bottom: 8px !important; }
                      table { border-collapse: collapse; width: 100%; margin-bottom: 24px !important; border: 1px solid #e5e7eb !important; }
                      table td, table th { border: 1px solid #e5e7eb !important; padding: 12px !important; }
                    `,
                    buttons: [
                      'source', '|',
                      'bold', 'italic', 'underline', 'strikethrough', '|',
                      'superscript', 'subscript', '|',
                      'ul', 'ol', '|',
                      'outdent', 'indent', '|',
                      'font', 'fontsize', 'brush', 'paragraph', '|',
                      'image', 'table', 'link', '|',
                      'align', 'undo', 'redo', '|',
                      'hr', 'eraser', 'fullsize', 'print'
                    ]
                  }}
                  onBlur={(newContent) => setDescription(newContent)}
                />
              </div>
            ) : (
              <div 
                dir={isRtl ? "rtl" : "ltr"}
                className="flex-1 min-h-[400px] description-preview-content"
              >
                <div 
                  className="p-2 text-lg text-gray-700"
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
