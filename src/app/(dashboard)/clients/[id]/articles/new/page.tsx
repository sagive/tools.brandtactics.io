"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Bot, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import dynamic from "next/dynamic";
import Script from "next/script";
const JoditEditor = dynamic(() => import("jodit-react"), { ssr: false });

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
  const [direction, setDirection] = useState("ltr");
  const [isApproved, setIsApproved] = useState(false);
  const [isPublic, setIsPublic] = useState(false);
  
  const [articleTypes, setArticleTypes] = useState<any[]>([]);
  const [aiSettings, setAiSettings] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [isAiMode, setIsAiMode] = useState(false);
  const [prompt, setPrompt] = useState("");
  const [keywords, setKeywords] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [linkLabel2, setLinkLabel2] = useState("");
  const [linkUrl2, setLinkUrl2] = useState("");
  const [clientData, setClientData] = useState<{name?: string; description?: string}>({});
  const [wordCount, setWordCount] = useState(0);
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [metaKeywords, setMetaKeywords] = useState("");
  const [clientCategories, setClientCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const newPreviewRef = React.useRef<HTMLDivElement>(null);
  const [scripts, setScripts] = useState("");
  const [tailwindLoaded, setTailwindLoaded] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && (window as any).tailwind) {
      setTailwindLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (content && newPreviewRef.current && tailwindLoaded) {
      const foundScripts = newPreviewRef.current.querySelectorAll("script");
      foundScripts.forEach((oldScript) => {
        const newScript = document.createElement("script");
        Array.from(oldScript.attributes).forEach((attr) => {
          newScript.setAttribute(attr.name, attr.value);
        });
        newScript.textContent = oldScript.textContent;
        oldScript.parentNode?.replaceChild(newScript, oldScript);
      });
    }
  }, [content, scripts, tailwindLoaded]);

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
    async function fetchData() {
      // Fetch Custom Types
      const { data: typesData } = await supabase.from('article_types').select('*').order('rank', { ascending: true });
      if (typesData && typesData.length > 0) {
        setArticleTypes(typesData);
      } else {
        // Fallback defaults
        setArticleTypes([
          { id: '1', name: 'Blog Post' },
          { id: '2', name: 'Guest Post' },
          { id: '3', name: 'PR' },
          { id: '4', name: 'AI Generated' }
        ]);
      }

      // Fetch AI Global Settings
      const { data: aiData } = await supabase.from('app_settings').select('article_ai_webhook_url, article_ai_webhook_url_test, article_ai_use_test').eq('id', 'global').single();
      if (aiData) setAiSettings(aiData);

      const { data: cData } = await supabase.from('clients').select('name, description, article_categories').eq('id', clientId).single();
      if (cData) {
        setClientData(cData);
        if (cData.article_categories) {
          const cats = cData.article_categories
            .split("\n")
            .map((c: string) => c.trim())
            .filter(Boolean);
          setClientCategories(cats);
        }
      }
    }
    fetchData();
  }, []);

  const handleGenerateAI = async () => {
    if (!title) {
      toast.error("Please enter a title before generating with AI.");
      return;
    }
    
    if (!aiSettings || (!aiSettings.article_ai_webhook_url && !aiSettings.article_ai_webhook_url_test)) {
      toast.error("AI Webhook URL is not configured in Settings > Article Settings.");
      return;
    }

    const targetUrl = aiSettings.article_ai_use_test ? aiSettings.article_ai_webhook_url_test : aiSettings.article_ai_webhook_url;
    
    if (!targetUrl) {
      toast.error(`The ${aiSettings.article_ai_use_test ? "test" : "live"} webhook URL is missing in Settings.`);
      return;
    }

    setIsGenerating(true);
    toast.info(`Generating article via ${aiSettings.article_ai_use_test ? "test" : "live"} global AI endpoint...`);
    try {
      // We use a local proxy API route to bypass CORS issues with the external webhook
      const res = await fetch("/api/proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUrl,
          title,
          clientId,
          type,
          clientName: clientData.name,
          clientDescription: clientData.description,
          prompt,
          keywords,
          linkLabel,
          linkUrl,
          linkLabel2,
          linkUrl2
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

  const handleSave = async (shouldShare = false) => {
    if (!title) {
      toast.error("Title is required.");
      return;
    }

    setIsSaving(true);
    const wordCount = calculateLength(content);

    try {
      const { data, error } = await supabase.from('articles').insert({
        client_id: clientId,
        title,
        live_url: liveUrl,
        internal_url: internalUrl,
        links_count: parseInt(linksCount) || 0,
        type,
        length: wordCount,
        is_ai_generated: content.length > 0 && isGenerating, // simplistic flag for now
        content,
        status,
        direction,
        client_approved: isApproved,
        is_public: shouldShare ? true : isPublic,
        meta_title: metaTitle,
        meta_description: metaDescription,
        meta_keywords: metaKeywords,
        categories: selectedCategories,
        scripts
      }).select().single();

      if (error) throw error;

      if (shouldShare && data) {
        const url = `${window.location.origin}/public/articles/${data.id}`;
        navigator.clipboard.writeText(url);
        toast.success("Article created and share link copied to clipboard!");
        router.push(`/clients/${clientId}/articles/${data.id}`);
      } else {
        toast.success("Article saved successfully!");
        router.push(`/clients/${clientId}/articles`);
      }
    } catch (err: any) {
      toast.error("Failed to save article: " + (err.message || "Ensure the database schema is applied."));
    } finally {
      setIsSaving(false);
    }
  };

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
            <SelectTrigger className="w-44 bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Draft">Draft</SelectItem>
              <SelectItem value="Sent to publisher">Sent to publisher</SelectItem>
              <SelectItem value="Published">Published</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => handleSave(false)} disabled={isSaving} variant="outline" className="border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-semibold shadow-sm">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-md flex items-center gap-1.5 transition-all">
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Share2 className="w-4 h-4" />}
            Create & Share
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Main Content Area */}
        <div className="flex-1 min-w-0 space-y-6">
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

              <div className="flex items-center space-x-2 pt-4 pb-2">
                <Checkbox 
                  id="ai-mode" 
                  checked={isAiMode} 
                  onCheckedChange={(checked) => setIsAiMode(!!checked)} 
                />
                <Label htmlFor="ai-mode" className="text-sm font-bold text-indigo-700 cursor-pointer flex items-center gap-1.5 hover:text-indigo-800 transition-colors">
                  <Bot className="w-4 h-4" />
                  Generate with AI
                </Label>
              </div>

              {!isAiMode ? (
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
                <div className="space-y-6 pt-2 select-none border-t border-indigo-50 mt-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Prompt / Instructions</Label>
                    <div className="border border-gray-200 rounded-md overflow-hidden bg-white">
                      <Textarea 
                        value={prompt} 
                        onChange={(e) => setPrompt(e.target.value)} 
                        placeholder="Enter your prompt or specific instructions for the AI..."
                        className="min-h-[150px] text-base border-none focus-visible:ring-0 resize-y"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-gray-700">Keywords (Comma separated)</Label>
                    <textarea 
                      value={keywords} 
                      onChange={(e) => setKeywords(e.target.value)} 
                      placeholder="e.g. digital marketing, seo, web design" 
                      className="w-full h-24 p-3 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none bg-white font-medium text-gray-800"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Link 1 Label</Label>
                      <Input 
                        value={linkLabel} 
                        onChange={(e) => setLinkLabel(e.target.value)} 
                        placeholder="Click here" 
                        className="bg-white border-gray-200 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Link 1 URL</Label>
                      <Input 
                        value={linkUrl} 
                        onChange={(e) => setLinkUrl(e.target.value)} 
                        placeholder="https://..." 
                        className="bg-white border-gray-200 font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Link 2 Label</Label>
                      <Input 
                        value={linkLabel2} 
                        onChange={(e) => setLinkLabel2(e.target.value)} 
                        placeholder="Click here" 
                        className="bg-white border-gray-200 font-medium"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-semibold text-gray-700">Link 2 URL</Label>
                      <Input 
                        value={linkUrl2} 
                        onChange={(e) => setLinkUrl2(e.target.value)} 
                        placeholder="https://..." 
                        className="bg-white border-gray-200 font-medium"
                      />
                    </div>
                  </div>

                  <div className="pt-4">
                    <Button 
                      onClick={handleGenerateAI} 
                      disabled={isGenerating || !type || !title}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-6 shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
                    >
                      {isGenerating ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Bot className="w-5 h-5 mr-2" />}
                      {isGenerating ? "Generating Article..." : "Generate Article"}
                    </Button>
                  </div>

                  {content && (
                    <div className="space-y-2 pt-6 border-t border-gray-100">
                      <Label className="text-sm font-semibold text-gray-700">Generated Content Preview</Label>
                      <div className="border border-indigo-100 rounded-md overflow-hidden bg-white shadow-sm ring-1 ring-indigo-50">
                        <div 
                          ref={newPreviewRef}
                          className="p-6 text-gray-800 leading-relaxed article-content" 
                        >
                          <div dangerouslySetInnerHTML={{ __html: content }} />
                          {scripts && (
                            <div 
                              dangerouslySetInnerHTML={{ __html: scripts }}
                              style={{ display: "none" }}
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Metadata */}
        <div className="space-y-6 lg:w-[320px] w-full shrink-0">
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
                    {articleTypes.map(t => (
                      <SelectItem key={t.id || t.name} value={t.name}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 pt-2">
                <Label className="text-xs font-semibold text-gray-600">Content Direction</Label>
                <Select value={direction} onValueChange={(val) => setDirection(val || "ltr")}>
                  <SelectTrigger className="w-full bg-gray-50/50">
                    <SelectValue placeholder="Direction" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ltr">Left to Right (LTR)</SelectItem>
                    <SelectItem value="rtl">Right to Left (RTL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-4">
                <Checkbox 
                  id="client-approved" 
                  checked={isApproved} 
                  onCheckedChange={(checked) => setIsApproved(!!checked)} 
                />
                <Label htmlFor="client-approved" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Approved by Client
                </Label>
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <Checkbox 
                  id="is-public" 
                  checked={isPublic} 
                  onCheckedChange={(checked) => setIsPublic(!!checked)} 
                />
                <Label htmlFor="is-public" className="text-xs font-semibold text-gray-700 cursor-pointer">
                  Allow Public Share Link
                </Label>
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
                </div>
              )}

              <div className="pt-6 mt-6 border-t border-gray-100 space-y-4">
                <CardTitle className="text-sm uppercase tracking-wider text-blue-600 font-bold">SEO Settings</CardTitle>
                
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-600">Meta Title</Label>
                  <Input 
                    value={metaTitle} 
                    onChange={(e) => setMetaTitle(e.target.value)} 
                    placeholder="SEO title..." 
                    className="bg-white text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-600">Meta Description</Label>
                  <Textarea 
                    value={metaDescription} 
                    onChange={(e) => setMetaDescription(e.target.value)} 
                    placeholder="SEO description..." 
                    className="bg-white text-sm min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-600">Meta Keywords</Label>
                  <Input 
                    value={metaKeywords} 
                    onChange={(e) => setMetaKeywords(e.target.value)} 
                    placeholder="keyword1, keyword2..." 
                    className="bg-white text-sm"
                  />
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
