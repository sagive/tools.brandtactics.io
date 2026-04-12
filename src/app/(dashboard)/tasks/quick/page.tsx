"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Mic, MicOff, Sparkles, Save, Loader2, ArrowLeft } from "lucide-react";
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
  const [isCleaning, setIsCleaning] = useState(false);
  
  // Speech Recognition State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    fetchClients();
    initSpeechRecognition();
  }, []);

  const fetchClients = async () => {
    const { data, error } = await supabase.from("clients").select("id, name").order("name");
    if (data) setClients(data);
  };

  const initSpeechRecognition = () => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        
        recognition.onresult = (event: any) => {
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' ';
            }
          }
          if (finalTranscript) {
            // Append the dictated text to the description
            setDescription((prev) => {
               // Simple trick to append plain text to Quill's HTML
               if (!prev || prev === '<p><br></p>') return `<p>${finalTranscript}</p>`;
               return prev + ` <p>${finalTranscript}</p>`;
            });
          }
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognition.onerror = (event: any) => {
          console.error("Speech recognition error", event.error);
          setIsListening(false);
          toast.error("Microphone error: " + event.error);
        };

        recognitionRef.current = recognition;
      }
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast.error("Your browser does not support speech recognition.");
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
        toast.info("Listening...");
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleMagicClean = async () => {
    if (!description || description === '<p><br></p>') {
      toast.error("Please add some text first before cleaning.");
      return;
    }

    setIsCleaning(true);
    
    // Strip HTML to get raw text for better Gemini parsing, or just send raw HTML
    // We send the HTML safely
    try {
      const res = await fetch("/api/ai-task-helper", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rawText: description })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setDescription(data.result);
      toast.success("Task text cleaned and organized!");

    } catch (err: any) {
      toast.error(err.message || "Failed to use AI Helper");
    } finally {
      setIsCleaning(false);
    }
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
    <div className="max-w-3xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Quick Add Task</h1>
          <p className="text-gray-500 text-sm">Create a task on the go.</p>
        </div>
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase text-gray-500">Client</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="bg-white h-12">
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
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="e.g. Update homepage banner" 
              className="h-12 bg-white"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold uppercase text-gray-500">Task Description</Label>
              <div className="flex gap-2">
                <Button 
                  type="button"
                  variant="outline" 
                  size="sm" 
                  onClick={toggleListening}
                  className={isListening ? "bg-red-50 text-red-600 border-red-200" : "bg-gray-50 text-gray-600"}
                >
                  {isListening ? <MicOff className="w-4 h-4 mr-2" /> : <Mic className="w-4 h-4 mr-2" />}
                  {isListening ? "Stop" : "Dictate"}
                </Button>
                <Button 
                  type="button"
                  variant="default" 
                  size="sm" 
                  onClick={handleMagicClean}
                  disabled={isCleaning}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  {isCleaning ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  Clean with AI
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
