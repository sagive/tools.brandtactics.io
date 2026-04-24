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
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    ['link', 'image'],
    ['clean']
  ],
};

export default function ClientDescription({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [description, setDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
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

          <div className="flex-1 flex flex-col">
            {isEditing ? (
              <div className="flex-1 border rounded-md bg-white focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500 [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:bg-gray-50/50 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[400px] [&_.ql-editor]:text-base">
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
                className="flex-1 prose prose-blue max-w-none text-gray-700 p-2 min-h-[400px] text-lg leading-relaxed"
                dangerouslySetInnerHTML={{ __html: description || "<p class='text-gray-400 italic font-normal'>No description provided yet.</p>" }} 
              />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
