"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Image as ImageIcon, Save, Loader2, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function QuickTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultClientId = searchParams.get("clientId") || "";

  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState<string>(defaultClientId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);
  
  // Speech Recognition State
  const [activeDictationTarget, setActiveDictationTarget] = useState<"title" | "description" | null>(null);
  const recognitionRef = useRef<any>(null);
  const [dictateLang, setDictateLang] = useState<"en-US" | "he-IL">("en-US");

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase.from("clients").select("id, name").order("name");
    if (data) setClients(data);
  };

  const toggleListening = (target: "title" | "description") => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Your browser does not support speech recognition.");
      return;
    }

    if (activeDictationTarget) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setActiveDictationTarget(null);
      if (activeDictationTarget === target) return; 
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = dictateLang;
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript + ' ';
        }
        if (transcript.trim()) {
          if (target === "title") {
             setTitle((prev) => (prev ? prev + " " : "") + transcript.trim());
          } else {
             setDescription((prev) => {
                if (!prev || prev === '<p><br></p>') return `<p>${transcript.trim()}</p>`;
                return prev + ` <p>${transcript.trim()}</p>`;
             });
          }
        }
      };

      recognition.onend = () => setActiveDictationTarget(null);

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setActiveDictationTarget(null);
        if (event.error !== 'no-speech') toast.error("Microphone error: " + event.error);
      };

      recognitionRef.current = recognition;
      recognition.start();
      setActiveDictationTarget(target);
      toast.info(`Listening in ${dictateLang === 'en-US' ? 'English' : 'Hebrew'}...`);
    } catch (err) {
      console.error(err);
      setActiveDictationTarget(null);
    }
  };

  const hiddenFileInput = useRef<HTMLInputElement>(null);
  const handleImageClick = () => { hiddenFileInput.current?.click(); };
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
       const base64 = event.target?.result;
       if (base64) {
          setDescription((prev) => prev + `<p><img src="${base64}" style="max-width:100%" /></p>`);
       }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSave = async () => {
    if (!title || !clientId) {
      toast.error("Please provide a title and select a client.");
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.from("tasks").insert([{
        client_id: clientId,
        title,
        description,
        status: "Pending"
      }]);

      if (error) throw error;
      
      toast.success("Task created successfully!");
      router.back(); // Return to previous page 
    } catch (err: any) {
      toast.error("Failed to save task: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="w-full sm:max-w-3xl sm:mx-auto space-y-4 sm:space-y-6 sm:pb-24 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4 px-4 pt-4 sm:px-0 sm:pt-0">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">Quick Task</h1>
          <p className="text-gray-500 text-xs sm:text-sm">Create a task on the go.</p>
        </div>
      </div>

      <Card className="shadow-none border-0 rounded-none sm:rounded-xl sm:shadow-sm sm:border sm:border-gray-200">
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-gray-500">Client</Label>
            <Select value={clientId} onValueChange={(val) => setClientId(val || "")}>
              <SelectTrigger className="bg-white h-12 w-full">
                <SelectValue placeholder="Select Client" />
              </SelectTrigger>
              <SelectContent>
                {clients.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-gray-500">Task Title</Label>
            <div className="relative">
              <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g. Update homepage banner" 
                className="h-12 bg-white pr-12"
              />
              <Button 
                type="button"
                variant="ghost" 
                size="icon"
                onClick={() => toggleListening("title")}
                className={`absolute right-1 top-1.5 h-9 w-9 rounded-full ${activeDictationTarget === "title" ? "bg-red-50 text-red-600 hover:text-red-700 hover:bg-red-100" : "text-gray-400 hover:text-gray-600"}`}
              >
                 {activeDictationTarget === "title" ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Label className="text-xs font-bold uppercase text-gray-500 w-full sm:w-auto">Task Description</Label>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDictateLang(prev => prev === "en-US" ? "he-IL" : "en-US")}
                  title={`Current: ${dictateLang === "en-US" ? "English" : "Hebrew"}. Click to swap.`}
                  className="px-3 bg-gray-50 text-gray-600 border-gray-200"
                >
                  {dictateLang === "en-US" ? "EN" : "HE"}
                </Button>
                <Button 
                  type="button"
                  variant="outline" 
                  onClick={() => toggleListening("description")}
                  className={`flex-1 sm:flex-none ${activeDictationTarget === "description" ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-50 text-gray-600"}`}
                >
                  {activeDictationTarget === "description" ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                  {activeDictationTarget === "description" ? "Stop" : "Dictate"}
                </Button>
                <Button 
                  type="button"
                  variant="default" 
                  onClick={handleImageClick}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <ImageIcon className="w-4 h-4 mr-2" />
                  Image
                  <input type="file" accept="image/*" ref={hiddenFileInput} onChange={handleImageChange} className="hidden" />
                </Button>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-md bg-white overflow-hidden">
               <ReactQuill 
                  theme="snow" 
                  value={description} 
                  onChange={setDescription} 
                  placeholder="Type or dictate your task details here..."
                  className="[&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-base [&_.ql-toolbar]:border-x-0 [&_.ql-toolbar]:border-t-0 [&_.ql-container]:border-none" 
                />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mobile Sticky Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200 z-50 md:relative md:bg-transparent md:border-t-0 md:p-0 md:z-auto">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full h-14 text-base font-bold bg-blue-600 hover:bg-blue-700 shadow-lg"
        >
          {isSaving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
          Create Task
        </Button>
      </div>

    </div>
  );
}
