"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Bot, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function NewClientArticle({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = React.use(params);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [internalUrl, setInternalUrl] = useState("");
  const [linksCount, setLinksCount] = useState("0");
  const [type, setType] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Draft");
  
  const [endpoints, setEndpoints] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function fetchEndpoints() {
      const { data } = await supabase.from('article_endpoints').select('*').order('name');
      if (data) setEndpoints(data);
    }
    fetchEndpoints();
  }, []);

  const handleGenerateAI = async () => {
    if (!title) {
      toast.error("Please enter a title before generating with AI.");
      return;
    }
    if (!type) {
      toast.error("Please select an article type to determine the AI endpoint.");
      return;
    }

    const endpoint = endpoints.find(e => e.name === type);
    if (!endpoint) {
      toast.error("No valid webhook configured for this article type in Settings.");
      return;
    }

    const targetUrl = endpoint.use_test_endpoint ? endpoint.endpoint_url_test : endpoint.endpoint_url;
    if (!targetUrl) {
      toast.error(`The ${endpoint.use_test_endpoint ? "test" : "live"} webhook URL is missing in Settings.`);
      return;
    }

    setIsGenerating(true);
    toast.info(`Generating article via ${endpoint.use_test_endpoint ? "test" : "live"} AI endpoint...`);
    try {
      // In a real scenario, this fetches from the n8n webhook
      // We pass the client ID and the title
      const res = await fetch(targetUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          clientId,
          type
        })
      });

      if (!res.ok) throw new Error("Webhook error: " + res.statusText);
      
      const data = await res.json();
      if (data.html) {
        setContent(data.html);
        toast.success("AI Generation complete!");
      } else if (data.content) {
        setContent(data.content);
        toast.success("AI Generation complete!");
      } else {
        throw new Error("Invalid response format from webhook. Expected { html: '...' }");
      }
    } catch (err: any) {
      toast.error("AI Generation failed: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const calculateLength = (htmlString: string) => {
    // Strip HTML tags to count words
    const tmp = document.createElement("DIV");
    tmp.innerHTML = htmlString;
    const text = tmp.textContent || tmp.innerText || "";
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    return words.length;
  };

  const handleSave = async () => {
    if (!title) {
      toast.error("Title is required.");
      return;
    }

    setIsSaving(true);
    const wordCount = calculateLength(content);

    try {
      const { error } = await supabase.from('articles').insert({
        client_id: clientId,
        title,
        live_url: liveUrl,
        internal_url: internalUrl,
        links_count: parseInt(linksCount) || 0,
        type,
        length: wordCount,
        is_ai_generated: content.length > 0 && isGenerating, // simplistic flag for now
        content,
        status
      });

      if (error) throw error;
      toast.success("Article saved successfully!");
      router.push(`/clients/${clientId}/articles`);
    } catch (err: any) {
      toast.error("Failed to save article: " + (err.message || "Ensure the database schema is applied."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/clients/${clientId}/articles`}>
          <Button variant="ghost" size="icon" className="hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Create New Article</h1>
          <p className="text-sm text-gray-500">Draft or generate a new article for your client.</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <Select value={status} onValueChange={(val) => setStatus(val || "Draft")}>
            <SelectTrigger className="w-32 bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Published">Published</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Article
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-semibold text-gray-700">Article Title</Label>
                <Input 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Enter a compelling title..." 
                  className="font-medium text-lg border-gray-200"
                />
              </div>

              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold text-gray-700">Content</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGenerateAI} 
                    disabled={isGenerating || !type || !title}
                    className="h-8 text-indigo-600 hover:text-indigo-700 border-indigo-200 hover:bg-indigo-50"
                  >
                    {isGenerating ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Bot className="w-3.5 h-3.5 mr-2" />}
                    Generate with AI
                  </Button>
                </div>
                <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
                  <ReactQuill 
                    theme="snow" 
                    value={content} 
                    onChange={setContent} 
                    className="[&_.ql-editor]:min-h-[400px] [&_.ql-editor]:text-base [&_.ql-toolbar]:border-x-0 [&_.ql-toolbar]:border-t-0 [&_.ql-container]:border-none" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Metadata */}
        <div className="space-y-6">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-gray-500 font-bold">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-600">Article Type</Label>
                <Select value={type} onValueChange={(val) => setType(val || "")}>
                  <SelectTrigger className="w-full bg-gray-50/50">
                    <SelectValue placeholder="Select type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {endpoints.map(ep => (
                      <SelectItem key={ep.id} value={ep.name}>{ep.name}</SelectItem>
                    ))}
                    {endpoints.length === 0 && (
                      <SelectItem value="empty" disabled>No endpoints configured</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold text-gray-600">Live URL</Label>
                <Input 
                  value={liveUrl} 
                  onChange={(e) => setLiveUrl(e.target.value)} 
                  placeholder="https://..." 
                  className="bg-gray-50/50 text-sm"
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold text-gray-600">Internal URL (No-Index)</Label>
                <Input 
                  value={internalUrl} 
                  onChange={(e) => setInternalUrl(e.target.value)} 
                  placeholder="https://..." 
                  className="bg-gray-50/50 text-sm"
                />
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold text-gray-600">Links Count</Label>
                <Input 
                  type="number"
                  min="0"
                  value={linksCount} 
                  onChange={(e) => setLinksCount(e.target.value)} 
                  className="bg-gray-50/50 text-sm w-24"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
