"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Save, Bot, Loader2, Pencil, X, Share2, Globe, Lock, MessageSquare, Trash2, ExternalLink, RotateCw } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import dynamic from "next/dynamic";
import Script from "next/script";
const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

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
  const [direction, setDirection] = useState("ltr");
  const [isApproved, setIsApproved] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [clientComment, setClientComment] = useState("");
  const [clientCommentAt, setClientCommentAt] = useState("");
  const [clientName, setClientName] = useState("");
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);
  const [isGeneratingMeta, setIsGeneratingMeta] = useState(false);

  const generateMeta = async (currentTitle: string, currentContent: string) => {
    try {
      const res = await fetch("/api/generate-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: currentTitle, content: currentContent })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to generate metadata");
      }
      const data = await res.json();
      return data;
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to generate SEO metadata");
      return null;
    }
  };

  const handleRecreateMeta = async () => {
    if (!title) {
      toast.error("Please enter a title first");
      return;
    }
    setIsGeneratingMeta(true);
    toast.info("Generating SEO metadata with Gemini...");
    const data = await generateMeta(title, content);
    if (data) {
      setMetaTitle(data.meta_title);
      setMetaDescription(data.meta_description);
      toast.success("SEO metadata generated successfully!");
    }
    setIsGeneratingMeta(false);
  };

  const [articleTypes, setArticleTypes] = useState<any[]>([]);
  const [clientCategories, setClientCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const previewRef = React.useRef<HTMLDivElement>(null);
  const [scripts, setScripts] = useState("");
  const [tailwindLoaded, setTailwindLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).tailwind) {
      setTailwindLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!isEditing && content && previewRef.current && tailwindLoaded) {
      const foundScripts = Array.from(previewRef.current.querySelectorAll("script"));
      if (foundScripts.length === 0) return;

      // Temporarily patch addEventListener
      const originalDocAdd = document.addEventListener;
      const originalWinAdd = window.addEventListener;
      
      document.addEventListener = function(type: string, listener: any, options?: any) {
        if (type === "DOMContentLoaded") {
          listener(new Event("DOMContentLoaded"));
        } else {
          originalDocAdd.call(document, type, listener, options);
        }
      } as any;

      window.addEventListener = function(type: string, listener: any, options?: any) {
        if (type === "load") {
          listener(new Event("load"));
        } else {
          originalWinAdd.call(window, type, listener, options);
        }
      } as any;

      let index = 0;
      function runNext() {
        if (index >= foundScripts.length) {
          // Restore original functions
          document.addEventListener = originalDocAdd;
          window.addEventListener = originalWinAdd;
          return;
        }

        const oldScript = foundScripts[index];
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });

        const src = oldScript.getAttribute("src");
        if (src) {
          newScript.onload = () => {
            index++;
            runNext();
          };
          newScript.onerror = () => {
            console.error(`Failed to load script: ${src}`);
            index++;
            runNext();
          };
          oldScript.parentNode?.replaceChild(newScript, oldScript);
        } else {
          newScript.textContent = oldScript.textContent;
          oldScript.parentNode?.replaceChild(newScript, oldScript);
          index++;
          runNext();
        }
      }

      runNext();
    }
  }, [isEditing, content, scripts, tailwindLoaded]);

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

  const handleDeleteComment = async () => {
    if (!window.confirm("Are you sure you want to delete this comment?")) return;
    
    try {
      const { error } = await supabase
        .from('articles')
        .update({
          client_comment: null,
          client_comment_at: null
        })
        .eq('id', articleId);

      if (error) throw error;
      
      setClientComment("");
      setClientCommentAt("");
      toast.success("Comment deleted successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to delete comment: " + err.message);
    }
  };
  
  useEffect(() => {
    async function fetchInitialData() {
      try {
        // Fetch Custom Types
        const { data: typesData } = await supabase.from('article_types').select('*').order('rank', { ascending: true });
        if (typesData && typesData.length > 0) {
          setArticleTypes(typesData);
        } else {
          setArticleTypes([
            { id: '1', name: 'Blog Post' },
            { id: '2', name: 'Guest Post' },
            { id: '3', name: 'PR' },
            { id: '4', name: 'AI Generated' }
          ]);
        }

        const { data, error } = await supabase
          .from('articles')
          .select('*, clients(name, article_categories)')
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
          setDirection(data.direction || "ltr");
          setIsApproved(data.client_approved || false);
          setIsPublic(data.is_public || false);
          setMetaTitle(data.meta_title || "");
          setMetaDescription(data.meta_description || "");
          setMetaKeywords(data.meta_keywords || "");
          setClientComment(data.client_comment || "");
          setClientCommentAt(data.client_comment_at || "");
          setClientName(data.clients?.name || "");
          setSelectedCategories(data.categories || []);
          setScripts(data.scripts || "");
          if (data.clients?.article_categories) {
            const cats = data.clients.article_categories
              .split("\n")
              .map((c: string) => c.trim())
              .filter(Boolean);
            setClientCategories(cats);
          }
        }
      } catch (err: any) {
        toast.error("Failed to load article");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchInitialData();
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

    let finalMetaTitle = metaTitle;
    let finalMetaDescription = metaDescription;

    // Auto-generate if a link is generated (isPublic or liveUrl are present) and meta values are empty
    if ((isPublic || liveUrl) && (!metaTitle.trim() || !metaDescription.trim())) {
      toast.info("Auto-generating empty SEO metadata...");
      const data = await generateMeta(title, content);
      if (data) {
        if (!metaTitle.trim()) {
          finalMetaTitle = data.meta_title;
          setMetaTitle(data.meta_title);
        }
        if (!metaDescription.trim()) {
          finalMetaDescription = data.meta_description;
          setMetaDescription(data.meta_description);
        }
      }
    }

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
        direction,
        client_approved: isApproved,
        is_public: isPublic,
        meta_title: finalMetaTitle,
        meta_description: finalMetaDescription,
        meta_keywords: metaKeywords,
        categories: selectedCategories,
        scripts,
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
        .article-content { direction: ${direction}; text-align: ${direction === 'rtl' ? 'right' : 'left'}; }
        .article-content a { color: #2563eb !important; text-decoration: underline !important; font-weight: 500; }
        .article-content p { margin-bottom: 1.5rem !important; }
        .article-content h1, 
        .article-content h2, 
        .article-content h3, 
        .article-content h4, 
        .article-content h5, 
        .article-content h6 { margin-top: 2rem !important; margin-bottom: 1rem !important; font-weight: 700 !important; }
        .article-content img { max-width: 100%; height: auto; border-radius: 8px; margin: 2rem 0; }
        .article-content ul, .article-content ol { margin-bottom: 1.5rem !important; padding-${direction === 'rtl' ? 'left' : 'right'}: 2rem !important; }
        .article-content li { margin-bottom: 0.5rem !important; }
      `}} />
      <div className={`flex items-center gap-4 mb-6 ${direction === 'rtl' ? 'flex-row-reverse text-right' : ''}`}>
        <Link href={`/clients/${clientId}/articles`}>
          <Button variant="ghost" size="icon" className="hover:bg-gray-100">
            {direction === 'rtl' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
          </Button>
        </Link>
        <div className={`flex-1 ${direction === 'rtl' ? 'text-right' : ''}`} dir={direction}>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 truncate max-w-2xl">{title}</h1>
          <p className="text-sm text-gray-500">View or edit article details.</p>
        </div>
        <div className="flex items-center gap-3">
          {!isEditing ? (
            <>
              {isPublic ? (
                <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-100 rounded-lg p-0.5">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-indigo-700 hover:text-indigo-800 hover:bg-indigo-100/50 font-semibold text-xs h-8"
                    onClick={() => {
                      const url = `${window.location.origin}/public/articles/${articleId}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Share link copied to clipboard!");
                    }}
                  >
                    <Share2 className="w-3.5 h-3.5 mr-1.5" />
                    Copy Share Link
                  </Button>
                  <div className="h-4 w-px bg-indigo-200" />
                  <a 
                    href={`${window.location.origin}/public/articles/${articleId}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex"
                  >
                    <Button 
                      variant="ghost" 
                      size="icon"
                      className="text-indigo-700 hover:text-indigo-800 hover:bg-indigo-100/50 h-8 w-8 rounded-md flex items-center justify-center"
                      title="Open in new tab"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </a>
                  <div className="h-4 w-px bg-indigo-200" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 font-medium text-xs h-8 px-2.5"
                    onClick={async () => {
                      try {
                        const { error } = await supabase.from('articles').update({ is_public: false }).eq('id', articleId);
                        if (error) throw error;
                        setIsPublic(false);
                        toast.success("Article sharing disabled (Private)");
                      } catch (err: any) {
                        toast.error("Failed to disable sharing");
                      }
                    }}
                  >
                    Make Private
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="text-indigo-600 border-indigo-200 hover:bg-indigo-50/30 hover:text-indigo-700 transition-all font-semibold"
                  onClick={async () => {
                    try {
                      let finalMetaTitle = metaTitle;
                      let finalMetaDescription = metaDescription;
                      
                      if (!metaTitle.trim() || !metaDescription.trim()) {
                        toast.info("Auto-generating empty SEO metadata...");
                        const data = await generateMeta(title, content);
                        if (data) {
                          if (!metaTitle.trim()) {
                            finalMetaTitle = data.meta_title;
                            setMetaTitle(data.meta_title);
                          }
                          if (!metaDescription.trim()) {
                            finalMetaDescription = data.meta_description;
                            setMetaDescription(data.meta_description);
                          }
                        }
                      }

                      const { error } = await supabase.from('articles').update({ 
                        is_public: true,
                        meta_title: finalMetaTitle,
                        meta_description: finalMetaDescription
                      }).eq('id', articleId);
                      if (error) throw error;
                      setIsPublic(true);
                      const url = `${window.location.origin}/public/articles/${articleId}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Article is now public! Share link copied.");
                    } catch (err: any) {
                      toast.error("Failed to enable sharing");
                    }
                  }}
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share Article
                </Button>
              )}
              <Button onClick={() => setIsEditing(true)} variant="outline" className="text-blue-600 border-blue-200">
                <Pencil className="w-4 h-4 mr-2" />
                Edit Article
              </Button>
            </>
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

      <div className={`flex flex-col gap-6 items-start ${direction === 'rtl' ? 'lg:flex-row-reverse' : 'lg:flex-row'}`}>
        <div className="flex-1 min-w-0 space-y-6">
          {clientComment && (
            <Card className="border-blue-200 bg-blue-50/50 shadow-sm overflow-hidden rounded-xl border-l-4 border-l-blue-600" dir={direction}>
              <CardContent className="p-5 flex gap-4 items-start">
                <div className="p-2 bg-blue-100 rounded-lg text-blue-700 shrink-0">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-blue-900">
                      Client Feedback from {clientName || "Client"}
                    </span>
                    <div className="flex items-center gap-3">
                      {clientCommentAt && (
                        <span className="text-xs text-gray-500 font-medium">
                          {new Date(clientCommentAt).toLocaleString()}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDeleteComment}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0 rounded-md shrink-0"
                        title="Delete Comment"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                    {clientComment}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

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
                    <div className="border border-gray-200 rounded-md overflow-hidden bg-white min-h-[1000px]">
                      <JoditEditor
                        value={content}
                        config={{
                          readonly: false,
                          height: 1000,
                          direction: direction as any,
                          cleanHTML: {
                            denyTags: false
                          },
                          uploader: {
                            insertImageAsBase64URI: true
                          },
                          placeholder: 'Start writing your article...',
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
                            a { color: #2563eb !important; text-decoration: underline !important; }
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
                        onBlur={(newContent) => setContent(newContent)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2 pt-4">
                    <Label className="text-sm font-semibold text-gray-700">Custom Scripts</Label>
                    <Textarea
                      value={scripts}
                      onChange={(e) => setScripts(e.target.value)}
                      placeholder="Paste script tags here (e.g. <script src='...'></script> or custom JS)..."
                      className="font-mono text-sm bg-gray-50/50 min-h-[150px]"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <style dangerouslySetInnerHTML={{ __html: `
                    .article-preview-content {
                      font-family: Inter, sans-serif;
                      line-height: 1.6;
                      color: #374151;
                    }
                    .article-preview-content a { color: #2563eb !important; text-decoration: underline !important; font-weight: 500; }
                    .article-preview-content p { margin-bottom: 24px; }
                    .article-preview-content h1 { font-size: 32px; margin-top: 40px; margin-bottom: 20px; font-weight: 800; }
                    .article-preview-content h2 { font-size: 28px; margin-top: 36px; margin-bottom: 18px; font-weight: 700; }
                    .article-preview-content h3 { font-size: 24px; margin-top: 32px; margin-bottom: 16px; font-weight: 700; }
                    .article-preview-content h4 { font-size: 20px; margin-top: 28px; margin-bottom: 14px; font-weight: 600; }
                    .article-preview-content img { max-width: 100%; border-radius: 8px; margin: 20px 0; }
                    .article-preview-content ul { list-style-type: disc !important; }
                    .article-preview-content ol { list-style-type: decimal !important; }
                    .article-preview-content ul, .article-preview-content ol { margin-bottom: 24px; padding-inline-start: 40px; }
                    .article-preview-content li { margin-bottom: 8px; }
                    .article-preview-content table { border-collapse: collapse; width: 100%; margin-bottom: 24px; border: 1px solid #e5e7eb; }
                    .article-preview-content table td, .article-preview-content table th { border: 1px solid #e5e7eb; padding: 12px; }
                  `}} />
                  <div className="article-preview-content" dir={direction} ref={previewRef}>
                    <div 
                      dangerouslySetInnerHTML={{ __html: content }} 
                      className="text-gray-800 leading-relaxed" 
                    />
                    {scripts && (
                      <div 
                        dangerouslySetInnerHTML={{ __html: scripts }}
                        style={{ display: "none" }}
                      />
                    )}
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
                      <SelectItem value="Sent to publisher">Sent to publisher</SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div>
                    <Badge variant="secondary" className={
                      status === 'Published' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : status === 'Sent to publisher'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'bg-gray-100 text-gray-700'
                    }>
                      {status}
                    </Badge>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-semibold text-gray-600">Article Type</Label>
                {isEditing ? (
                  <Select value={type} onValueChange={(val) => setType(val || "")}>
                    <SelectTrigger className="w-full bg-gray-50/50">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {articleTypes.map(t => (
                        <SelectItem key={t.id || t.name} value={t.name}>{t.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm font-medium text-gray-900">{type || "-"}</div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold text-gray-600">Content Direction</Label>
                {isEditing ? (
                  <Select value={direction} onValueChange={(val) => setDirection(val || "ltr")}>
                    <SelectTrigger className="w-full bg-gray-50/50">
                      <SelectValue placeholder="Direction" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ltr">Left to Right (LTR)</SelectItem>
                      <SelectItem value="rtl">Right to Left (RTL)</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm font-medium text-gray-900 capitalize">{direction}</div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold text-gray-600">Client Approval</Label>
                {isEditing ? (
                  <div className="flex items-center space-x-2 pt-1">
                    <Checkbox 
                      id="client-approved" 
                      checked={isApproved} 
                      onCheckedChange={(checked) => setIsApproved(!!checked)} 
                    />
                    <Label htmlFor="client-approved" className="text-xs font-semibold text-gray-700 cursor-pointer">
                      Approved by Client
                    </Label>
                  </div>
                ) : (
                  <div>
                    {isApproved ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Approved</Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-yellow-50 text-yellow-700 border-none">Pending Approval</Badge>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold text-gray-600">Public Access</Label>
                {isEditing ? (
                  <div className="flex items-center space-x-2 pt-1">
                    <Checkbox 
                      id="is-public" 
                      checked={isPublic} 
                      onCheckedChange={(checked) => setIsPublic(!!checked)} 
                    />
                    <Label htmlFor="is-public" className="text-xs font-semibold text-gray-700 cursor-pointer">
                      Allow Public Share Link
                    </Label>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    {isPublic ? (
                      <Badge className="bg-indigo-50 text-indigo-700 border-indigo-100 flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        Public
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-gray-500 border-gray-200 flex items-center gap-1">
                        <Lock className="w-3 h-3" />
                        Private
                      </Badge>
                    )}
                  </div>
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

              {clientCategories.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-100 mt-2">
                  <Label className="text-xs font-semibold text-gray-600">Categories</Label>
                  {isEditing ? (
                    <div className="space-y-1.5 pt-1 max-h-[150px] overflow-y-auto pr-2">
                      {clientCategories.map((cat) => {
                        const isChecked = selectedCategories.includes(cat);
                        return (
                          <div key={cat} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`cat-${cat}`} 
                              checked={isChecked} 
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedCategories([...selectedCategories, cat]);
                                } else {
                                  setSelectedCategories(selectedCategories.filter(c => c !== cat));
                                }
                              }} 
                            />
                            <Label htmlFor={`cat-${cat}`} className="text-xs text-gray-700 cursor-pointer font-medium">
                              {cat}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {selectedCategories.length > 0 ? (
                        selectedCategories.map((cat) => (
                          <Badge key={cat} variant="secondary" className="bg-blue-50 text-blue-700 text-[10px] border-none font-medium">
                            {cat}
                          </Badge>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No categories selected</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-6 mt-6 border-t border-gray-100 space-y-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm uppercase tracking-wider text-blue-600 font-bold">SEO Settings</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleRecreateMeta}
                    disabled={isGeneratingMeta}
                    className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                    title="Regenerate Meta Title & Description with Gemini"
                  >
                    {isGeneratingMeta ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCw className="w-4 h-4" />}
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-600">Meta Title</Label>
                  {isEditing ? (
                    <Input 
                      value={metaTitle} 
                      onChange={(e) => setMetaTitle(e.target.value)} 
                      placeholder="SEO title..." 
                      className="bg-white text-sm"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">{metaTitle || "-"}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-600">Meta Description</Label>
                  {isEditing ? (
                    <Textarea 
                      value={metaDescription} 
                      onChange={(e) => setMetaDescription(e.target.value)} 
                      placeholder="SEO description..." 
                      className="bg-white text-sm min-h-[80px]"
                    />
                  ) : (
                    <div className="text-sm text-gray-700 leading-relaxed">{metaDescription || "-"}</div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-600">Meta Keywords</Label>
                  {isEditing ? (
                    <Input 
                      value={metaKeywords} 
                      onChange={(e) => setMetaKeywords(e.target.value)} 
                      placeholder="keyword1, keyword2..." 
                      className="bg-white text-sm"
                    />
                  ) : (
                    <div className="text-sm font-medium text-gray-900">{metaKeywords || "-"}</div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Script 
        src="https://cdn.tailwindcss.com" 
        onLoad={() => setTailwindLoaded(true)} 
      />
    </div>
  );
}
