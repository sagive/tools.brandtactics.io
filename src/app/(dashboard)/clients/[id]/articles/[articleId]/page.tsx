"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Bot, Loader2, Pencil, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";
import Link from "next/link";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

export default function ArticleDetail({ params }: { params: Promise<{ id: string, articleId: string }> }) {
  const { id: clientId, articleId } = React.use(params);
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [internalUrl, setInternalUrl] = useState("");
  const [linksCount, setLinksCount] = useState("0");
  const [type, setType] = useState("");
  const [content, setContent] = useState("");
  const [status, setStatus] = useState("Draft");
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  useEffect(() => {
    if (content) {
      // Auto word count
      const tmp = document.createElement("DIV");
      tmp.innerHTML = content;
      const text = tmp.textContent || tmp.innerText || "";
      const words = text.trim().split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);

      // Auto link count
      const links = tmp.querySelectorAll("a");
      setLinksCount(String(links.length));
    }
  }, [content]);
  
  useEffect(() => {
    async function fetchArticle() {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*')
          .eq('id', articleId)
          .single();

        if (error) throw error;
        if (data) {
          setTitle(data.title || "");
          setLiveUrl(data.live_url || "");
          setInternalUrl(data.internal_url || "");
          setLinksCount(String(data.links_count || 0));
          setType(data.type || "");
          setContent(data.content || "");
          setStatus(data.status || "Draft");
        }
      } catch (err: any) {
        toast.error("Failed to load article");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchArticle();
  }, [articleId]);

  const calculateLength = (htmlString: string) => {
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
      const { error } = await supabase.from('articles').update({
        title,
        live_url: liveUrl,
        internal_url: internalUrl,
        links_count: parseInt(linksCount) || 0,
        type,
        length: wordCount,
        content,
        status,
        updated_at: new Date().toISOString()
      }).eq('id', articleId);

      if (error) throw error;
      toast.success("Article updated successfully!");
      setIsEditing(false);
    } catch (err: any) {
      toast.error("Failed to update article: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 lg:px-8 pb-10">
      <style dangerouslySetInnerHTML={{ __html: `
        .article-content p { margin-bottom: 1.5rem !important; }
        .article-content h1, 
        .article-content h2, 
        .article-content h3, 
        .article-content h4, 
        .article-content h5, 
        .article-content h6 { margin-top: 2rem !important; margin-bottom: 1rem !important; font-weight: 700 !important; }
        .article-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 2rem 0; }
        .article-content ul, .article-content ol { margin-bottom: 1.5rem !important; padding-right: 2rem !important; }
        .article-content li { margin-bottom: 0.5rem !important; }
      `}} />
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/clients/${clientId}/articles`}>
          <Button variant="ghost" size="icon" className="hover:bg-gray-100">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 truncate max-w-2xl">{title}</h1>
          <p className="text-sm text-gray-500">View or edit article details.</p>
        </div>
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)} variant="outline" className="text-blue-600 border-blue-200">
              <Pencil className="w-4 h-4 mr-2" />
              Edit Article
            </Button>
          ) : (
            <>
              <Button onClick={() => setIsEditing(false)} variant="ghost">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving} className="bg-green-600 hover:bg-green-700">
                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-6">
          <Card className="shadow-sm">
            <CardContent className="p-6 space-y-4">
              {isEditing ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Article Title</Label>
                    <Input 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      className="font-medium text-lg border-gray-200"
                    />
                  </div>
                  <div className="space-y-2 pt-2">
                    <Label className="text-sm font-semibold text-gray-700">Content</Label>
                    <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
                      <ReactQuill 
                        theme="snow" 
                        value={content} 
                        onChange={setContent} 
                        className="[&_.ql-editor]:min-h-[400px] [&_.ql-editor]:text-base [&_.ql-toolbar]:border-x-0 [&_.ql-toolbar]:border-t-0 [&_.ql-container]:border-none" 
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="prose prose-blue max-w-none">
                    <div 
                      dangerouslySetInnerHTML={{ __html: content }} 
                      className="text-gray-800 leading-relaxed ql-editor article-content px-0" 
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 lg:w-[320px] w-full shrink-0">
          <Card className="shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm uppercase tracking-wider text-gray-500 font-bold">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-600">Status</Label>
                {isEditing ? (
                  <Select value={status} onValueChange={(val) => setStatus(val || "Draft")}>
                    <SelectTrigger className="w-full bg-gray-50/50">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div>
                    <Badge variant="secondary" className={status === 'Published' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-700'}>
                      {status}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-600">Article Type</Label>
                {isEditing ? (
                  <Input 
                    value={type} 
                    onChange={(e) => setType(e.target.value)} 
                    placeholder="Guest post, Blog, etc."
                    className="bg-gray-50/50 text-sm"
                  />
                ) : (
                  <div className="text-sm font-medium text-gray-900">{type || "-"}</div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold text-gray-600">Live URL</Label>
                {isEditing ? (
                  <Input 
                    value={liveUrl} 
                    onChange={(e) => setLiveUrl(e.target.value)} 
                    placeholder="https://..." 
                    className="bg-gray-50/50 text-sm"
                  />
                ) : (
                  articleId && (
                    <div className="truncate">
                      <a href={liveUrl} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">
                        {liveUrl || "No live URL"}
                      </a>
                    </div>
                  )
                )}
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold text-gray-600">Internal URL (No-Index)</Label>
                {isEditing ? (
                  <Input 
                    value={internalUrl} 
                    onChange={(e) => setInternalUrl(e.target.value)} 
                    placeholder="https://..." 
                    className="bg-gray-50/50 text-sm"
                  />
                ) : (
                  <div className="text-sm text-gray-600 truncate">{internalUrl || "-"}</div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold text-gray-600">Links Count (Auto)</Label>
                <div className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md inline-block">
                  {linksCount} links
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold text-gray-600">Word Count</Label>
                <div className="text-sm font-bold text-gray-700 bg-gray-100 px-2 py-1 rounded-md inline-block">
                  {wordCount} words
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
