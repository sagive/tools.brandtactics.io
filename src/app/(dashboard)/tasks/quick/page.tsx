"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Image as ImageIcon, Save, Loader2, ArrowLeft, ArrowRight, ChevronDownIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, false] }],
    ['bold', 'underline', 'link'],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }]
  ]
};

function stripHtml(html: string) {
  if (typeof document === 'undefined') return html;
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  const text = tmp.textContent || tmp.innerText || "";
  return text.trim();
}

export default function QuickTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultClientId = searchParams.get("clientId") || "";

  const [clients, setClients] = useState<any[]>([]);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(defaultClientId ? [defaultClientId] : []);
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
    const { data, error } = await supabase.from("clients").select("id, name").eq("status", "Active").order("name");
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
    const plainText = stripHtml(description);
    if (!plainText || selectedClientIds.length === 0) {
      toast.error("Please provide a description and select at least one client.");
      return;
    }

    const generatedTitle = plainText.substring(0, 100);

    setIsSaving(true);
    try {
      const tasksToInsert = selectedClientIds.map(cId => ({
        client_id: cId,
        title: generatedTitle,
        description,
        status: "Pending"
      }));

      const { error } = await supabase.from("tasks").insert(tasksToInsert);

      if (error) throw error;
      
      const count = tasksToInsert.length;
      toast.success(count > 1 ? `Successfully created ${count} tasks!` : "Task created successfully!");
      setTitle("");
      setDescription("");
      setSelectedClientIds([]);
    } catch (err: any) {
      toast.error("Failed to save task: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="-mx-6 -mt-6 sm:mx-auto sm:mt-0 sm:max-w-3xl sm:space-y-6 sm:pb-24 pb-20">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 px-4 pt-4 pb-2 sm:px-0 sm:pt-0 sm:pb-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-900">Quick Task</h1>
        </div>
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowRight className="w-5 h-5 text-gray-500 hover:text-gray-900" />
        </Button>
      </div>

      <div className="px-4 py-2 space-y-6 sm:p-6 sm:bg-white sm:rounded-xl sm:shadow-sm sm:border sm:border-gray-200">
        <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-gray-500">Clients <span className="text-red-500">*</span></Label>
            {clients.length > 0 ? (
              <Popover>
                <PopoverTrigger className="flex h-14 sm:h-12 w-full items-center justify-between rounded-lg border border-input bg-white px-4 py-2 text-base sm:text-sm text-gray-900 shadow-none outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-ring">
                  <span className="truncate">
                    {selectedClientIds.length === 0 
                      ? "Select clients" 
                      : selectedClientIds.length === 1 
                      ? clients.find(c => c.id === selectedClientIds[0])?.name || "Loading..." 
                      : `${selectedClientIds.length} clients selected`}
                  </span>
                  <ChevronDownIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                </PopoverTrigger>
                <PopoverContent align="end" className="w-56 p-2 bg-white rounded-lg border shadow-md max-h-60 overflow-y-auto z-[9999]">
                  <div className="space-y-2">
                    {clients.map(c => {
                      const isChecked = selectedClientIds.includes(c.id);
                      return (
                        <div 
                          key={c.id}
                          data-name={c.name}
                          data-selected={isChecked}
                          data-role="client-option"
                          onClick={() => {
                            if (isChecked) {
                              setSelectedClientIds(selectedClientIds.filter(id => id !== c.id));
                            } else {
                              setSelectedClientIds([...selectedClientIds, c.id]);
                            }
                          }}
                          className="flex items-center space-x-2 p-1.5 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <Checkbox 
                            checked={isChecked}
                            data-name={c.name}
                            onClick={(e) => e.stopPropagation()} 
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedClientIds([...selectedClientIds, c.id]);
                              } else {
                                setSelectedClientIds(selectedClientIds.filter(id => id !== c.id));
                              }
                            }}
                          />
                          <span data-name={c.name} className="text-xs font-semibold text-gray-700 truncate">{c.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            ) : (
              <div className="h-14 sm:h-12 w-full border border-gray-200 rounded-md flex items-center px-4 bg-gray-50 text-gray-500 text-sm">
                Loading clients...
              </div>
            )}
          </div>

          {/* Task Title hidden per user request - auto-generated from description */}
          <div className="hidden">
            <Label className="text-xs font-bold uppercase text-gray-500">Task Title</Label>
            <div className="relative">
              <Input 
                value={title} 
                onChange={e => setTitle(e.target.value)} 
                placeholder="e.g. Update homepage banner" 
                className="h-14 sm:h-12 bg-white text-base pr-12"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <Label className="text-xs font-bold uppercase text-gray-900 w-full sm:w-auto">Task Description <span className="text-red-500">*</span></Label>
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
                  className={`flex-1 ${activeDictationTarget === "description" ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-50 text-gray-600"}`}
                >
                  {activeDictationTarget === "description" ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                  {activeDictationTarget === "description" ? "Stop" : "Dictate"}
                </Button>
                <Button 
                  type="button"
                  variant="default" 
                  onClick={handleImageClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3"
                  title="Insert Image"
                >
                  <ImageIcon className="w-5 h-5" />
                  <input type="file" accept="image/*" ref={hiddenFileInput} onChange={handleImageChange} className="hidden" />
                </Button>
              </div>
            </div>
            
            <div className="border border-gray-200 rounded-md bg-white overflow-hidden">
               <ReactQuill 
                  theme="snow" 
                  value={description} 
                  onChange={setDescription} 
                  modules={quillModules}
                  placeholder="Type or dictate your task details here..."
                  className="[&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-base [&_.ql-toolbar]:border-x-0 [&_.ql-toolbar]:border-t-0 [&_.ql-container]:border-none" 
                />
            </div>
          </div>
      </div>

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
