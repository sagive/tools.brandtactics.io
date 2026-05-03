"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Bot, Loader2, Pencil, X, Share2, Globe, Lock } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import dynamic from "next/dynamic";
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
  
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [wordCount, setWordCount] = useState(0);

  const [articleTypes, setArticleTypes] = useState<any[]>([]);

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
          setDirection(data.direction || "ltr");
          setIsApproved(data.client_approved || false);
          setIsPublic(data.is_public || false);
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
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 truncate max-w-2xl">{title}</h1>
          <p className="text-sm text-gray-500">View or edit article details.</p>
        </div>
        <div className="flex items-center gap-3">
          {isPublic && (
            <Button 
              variant="outline" 
              className="text-indigo-600 border-indigo-200"
              onClick={() => {
                const url = `${window.location.origin}/public/articles/${articleId}`;
                navigator.clipboard.writeText(url);
                toast.success("Share link copied to clipboard!");
              }}
            >
              <Share2 className="w-4 h-4 mr-2" />
              Copy Share Link
            </Button>
          )}
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
                    <div className="border border-gray-200 rounded-md overflow-hidden bg-white min-h-[500px]">
                      <JoditEditor
                        value={content}
                        config={{
                          readonly: false,
                          height: 500,
                          direction: direction as any,
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
                </div>
              ) : (
                <div className="space-y-6">
                  <style dangerouslySetInnerHTML={{ __html: `
                    .article-preview-content {
                      font-family: Inter, sans-serif;
                      line-height: 1.6;
                      color: #374151;
                    }
                    .article-preview-content p { margin-bottom: 24px; }
                    .article-preview-content h1 { font-size: 32px; margin-top: 40px; margin-bottom: 20px; font-weight: 800; }
                    .article-preview-content h2 { font-size: 28px; margin-top: 36px; margin-bottom: 18px; font-weight: 700; }
                    .article-preview-content h3 { font-size: 24px; margin-top: 32px; margin-bottom: 16px; font-weight: 700; }
                    .article-preview-content h4 { font-size: 20px; margin-top: 28px; margin-bottom: 14px; font-weight: 600; }
                    .article-preview-content img { max-width: 100%; border-radius: 8px; margin: 20px 0; }
                    .article-preview-content ul, .article-preview-content ol { margin-bottom: 24px; padding-inline-start: 40px; }
                    .article-preview-content li { margin-bottom: 8px; }
                    .article-preview-content table { border-collapse: collapse; width: 100%; margin-bottom: 24px; border: 1px solid #e5e7eb; }
                    .article-preview-content table td, .article-preview-content table th { border: 1px solid #e5e7eb; padding: 12px; }
                  `}} />
                  <div className="article-preview-content" dir={direction}>
                    <div 
                      dangerouslySetInnerHTML={{ __html: content }} 
                      className="text-gray-800 leading-relaxed" 
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
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
