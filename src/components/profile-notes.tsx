"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { Loader2, Save, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProfileNotesProps {
  profileId: string;
}

export default function ProfileNotes({ profileId }: ProfileNotesProps) {
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [profileId]);

  async function fetchNotes() {
    setIsLoading(true);
    const { data } = await supabase
      .from("profiles_data")
      .select("notes")
      .eq("id", profileId)
      .single();
    
    if (data?.notes) {
      setNotes(data.notes);
    }
    setIsLoading(false);
  }

  const handleSaveNotes = async () => {
    setIsSaving(true);
    const { error } = await supabase
      .from("profiles_data")
      .update({ notes })
      .eq("id", profileId);

    if (error) {
      toast.error("Failed to save notes: " + error.message);
    } else {
      toast.success("Notes saved successfully");
      setIsDirty(false);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-[0.2em] flex items-center gap-2">
          <FileText className="w-2.5 h-2.5 text-blue-600" />
          Persona Notes
        </h4>
        
        {isDirty && (
          <Button 
            onClick={handleSaveNotes} 
            disabled={isSaving}
            className="bg-amber-500 hover:bg-amber-600 text-white h-9 px-6 font-black text-[10px] uppercase tracking-widest rounded-sm shadow-none transition-all active:scale-95 flex items-center gap-2"
          >
            {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
            Save Notes
          </Button>
        )}
      </div>

      <div className="border border-gray-300 rounded-sm bg-[#fdfcf0] relative overflow-hidden h-[500px]">
        {/* Red margin line */}
        <div className="absolute top-0 bottom-0 left-10 border-l border-red-200" />
        
        <div className="relative z-10 w-full h-full">
          <textarea
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              setIsDirty(true);
            }}
            placeholder="Paste cookies, browser history notes, or identity details here..."
            className="w-full h-full bg-transparent border-none focus:ring-0 text-sm font-medium text-gray-800 p-8 pl-14 resize-none placeholder:text-amber-900/20"
            style={{
              backgroundImage: 'linear-gradient(transparent, transparent 1.7rem, #e2e8f0 1.7rem)',
              backgroundSize: '100% 1.8rem',
              lineHeight: '1.8rem'
            }}
          />
        </div>
      </div>
    </div>
  );
}
