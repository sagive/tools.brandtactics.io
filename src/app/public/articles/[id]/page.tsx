"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertCircle, CheckCircle2, MessageSquare, Send, Pencil, Copy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PublicArticleView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [isEditingComment, setIsEditingComment] = useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);

  const { words, chars } = React.useMemo(() => {
    if (!article?.content) return { words: 0, chars: 0 };
    const cleanText = article.content
      .replace(/<[^>]*>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const wordsCount = cleanText ? cleanText.split(' ').length : 0;
    const charsCount = cleanText.length;
    return { words: wordsCount, chars: charsCount };
  }, [article?.content]);

  useEffect(() => {
    if (article?.title) {
      document.title = `${article.title} | BrandTactics`;
    }
  }, [article]);

  const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    // Regex allows English, Hebrew, numbers, spaces, and basic safe punctuation
    const sanitized = val.replace(/[^a-zA-Z0-9\s\u0590-\u05FF.,?!'""()-]/g, "");
    setComment(sanitized);
  };

  const submitComment = async () => {
    if (!comment.trim()) return;

    try {
      setSubmitting(true);
      const res = await fetch("/api/articles/comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articleId: id,
          comment: comment,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || "Failed to submit comment");
      }

      setArticle((prev: any) => ({
        ...prev,
        client_comment: result.comment,
        client_comment_at: new Date().toISOString(),
      }));

      toast.success("Feedback submitted successfully!");
      setComment("");
      setIsEditingComment(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    async function fetchArticle() {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*, clients(name, article_categories, hide_logo_in_preview, custom_logo_text, custom_bottom_text)')
          .eq('id', id)
          .single();

        if (error) throw error;
        
        if (!data.is_public) {
          setError("This article is not shared publicly.");
          return;
        }

        setArticle(data);
      } catch (err: any) {
        console.error(err);
        setError("Article not found or access denied.");
      } finally {
        setLoading(false);
      }
    }
    fetchArticle();
  }, [id]);

  useEffect(() => {
    if (!loading && article?.content && contentRef.current) {
      const foundScripts = Array.from(contentRef.current.querySelectorAll("script"));
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
  }, [loading, article?.content, article?.scripts]);

  const copyAsHtml = () => {
    if (!article?.content) return;
    const scriptsString = article.scripts ? `\n\n${article.scripts}` : '';
    navigator.clipboard.writeText(article.content + scriptsString);
    toast.success("HTML content copied to clipboard!");
  };

  const copyArticle = () => {
    if (!article) return;
    const titleText = `${article.title}\n\n`;
    let text = '';
    if (typeof document !== 'undefined') {
      const temp = document.createElement("div");
      temp.innerHTML = article.content;
      text = temp.innerText || temp.textContent || "";
    } else {
      text = article.content.replace(/<[^>]*>/g, ' ');
    }
    navigator.clipboard.writeText(titleText + text.trim());
    toast.success("Article text copied to clipboard!");
  };

  const handleApprove = async () => {
    try {
      setLoading(true);
      const { error } = await supabase
        .from('articles')
        .update({ 
          client_approved: true, 
          is_public: false 
        })
        .eq('id', id);

      if (error) throw error;
      
      setArticle((prev: any) => ({ ...prev, client_approved: true, is_public: false }));
      toast.success("Article approved successfully!");
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to approve article");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Loading article...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 px-4 text-center">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-md w-full">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">{error || "The article you're looking for doesn't exist or is private."}</p>
          <div className="h-1 w-20 bg-gray-100 mx-auto rounded-full" />
        </div>
      </div>
    );
  }

  const direction = article.direction || "ltr";


  return (
    <div className="min-h-screen bg-white" dir={direction}>

      {/* Premium Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
          {article.clients?.hide_logo_in_preview ? (
            article.clients?.custom_logo_text ? (
              <span className="font-bold text-gray-900 tracking-tight text-lg">
                {article.clients.custom_logo_text}
              </span>
            ) : <div />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                BT
              </div>
              <span className="font-bold text-gray-900 tracking-tight">BrandTactics</span>
            </div>
          )}
          
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={copyAsHtml}
              className="rounded-full px-4 border-indigo-100 hover:border-indigo-200 bg-indigo-50/30 text-indigo-700 hover:bg-indigo-50/50 hover:text-indigo-800 transition-all font-semibold flex items-center gap-1.5 text-xs h-9"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy as HTML
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyArticle}
              className="rounded-full px-4 border-gray-200 hover:bg-gray-50 text-gray-700 transition-all font-semibold flex items-center gap-1.5 text-xs h-9"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Article
            </Button>

            {article.client_approved ? (
              <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-emerald-100 py-1.5 px-4 rounded-full flex items-center gap-1.5 h-9 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approved by Client
              </Badge>
            ) : (
              <Button 
                onClick={handleApprove}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-6 shadow-lg shadow-emerald-100 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 h-9 text-sm font-semibold"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve Article
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Full-width Hero Header Section */}
      <section className="w-full border-b border-gray-200/80 bg-slate-50/50 py-16 lg:py-20 relative overflow-hidden" style={{
        backgroundImage: `
          linear-gradient(to right, rgba(148, 163, 184, 0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(148, 163, 184, 0.08) 1px, transparent 1px)
        `,
        backgroundSize: '32px 32px'
      }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center gap-2 mb-4">
             <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none font-medium">
              {article.type || "Article"}
            </Badge>
            {article.clients?.name && (
              <span className="text-sm text-gray-400 font-medium">for {article.clients.name}</span>
            )}
          </div>
          <h1 className={`text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6 ${direction === 'rtl' ? 'text-right' : 'text-left'}`}>
            {article.title}
          </h1>
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs font-semibold uppercase tracking-wider text-gray-400 border-t border-gray-200/60 pt-6">
            <span>{new Date(article.created_at).toLocaleDateString()}</span>
            <span className="text-gray-200">•</span>
            <span>{words} Words</span>
            <span className="text-gray-200">•</span>
            <span>{chars} Characters</span>
            {article.categories && article.categories.length > 0 && (
              <>
                <span className="text-gray-200">•</span>
                <div className="flex flex-wrap gap-1">
                  {article.categories.map((cat: string) => (
                    <span key={cat} className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded text-[10px] font-semibold normal-case">
                      {cat}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-6 py-12 lg:py-16">
        <article>

          <style dangerouslySetInnerHTML={{ __html: `
            .public-content { 
              direction: ${direction}; 
              text-align: ${direction === 'rtl' ? 'right' : 'left'}; 
              font-size: 1.125rem;
              line-height: 1.8;
              color: #374151;
            }
            .public-content p { margin-bottom: 2rem; }
            .public-content h1, 
            .public-content h2, 
            .public-content h3, 
            .public-content h4, 
            .public-content h5, 
            .public-content h6 { 
              margin-top: 3rem; 
              margin-bottom: 1.5rem; 
              font-weight: 800; 
              color: #111827;
              letter-spacing: -0.025em;
              line-height: 1.2;
            }
            .public-content h1 { font-size: 2.5rem; }
            .public-content h2 { font-size: 2rem; }
            .public-content h3 { font-size: 1.5rem; }
            .public-content img { 
              max-width: 100%; 
              height: auto; 
              border-radius: 16px; 
              margin: 3.5rem 0;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
            }
            .public-content ul { 
              list-style-type: disc !important;
              margin-bottom: 2rem; 
              padding-inline-start: 2.5rem; 
            }
            .public-content ol { 
              list-style-type: decimal !important;
              margin-bottom: 2rem; 
              padding-inline-start: 2.5rem; 
            }
            .public-content li { margin-bottom: 0.75rem; }
            .public-content blockquote {
              border-inline-start: 4px solid #2563eb;
              padding-inline-start: 1.5rem;
              font-style: italic;
              color: #4b5563;
              margin: 2.5rem 0;
            }
            .public-content a {
              color: #2563eb;
              text-decoration: underline;
              text-underline-offset: 4px;
              font-weight: 500;
            }
            
            /* Table Styling */
            .public-content table {
                border-collapse: collapse;
                margin: 25px 0 50px 0;
                font-family: 'Inter', sans-serif;
                font-size: 0.95em;
                min-width: 400px;
                width: 100%;
                box-shadow: 0 0 20px rgba(0, 0, 0, 0.05);
                border-radius: 12px; 
                overflow: hidden; 
                border: 1px solid #f3f4f6;
            }

            .public-content thead tr {
                background-color: #374151;
                color: #ffffff;
                text-align: ${direction === 'rtl' ? 'right' : 'left'};
            }

            .public-content th,
            .public-content td {
                padding: 14px 20px;
            }

            .public-content tbody tr {
                border-bottom: 1px solid #f3f4f6;
            }

            .public-content tbody tr:nth-of-type(even) {
                background-color: #f9fafb;
            }

            .public-content tbody tr:hover {
                background-color: #f3f4f6;
            }

            .public-content tbody tr:last-of-type {
                border-bottom: 2px solid #374151;
            }
          `}} />

          <div 
            ref={contentRef}
            className="public-content"
          >
            <div dangerouslySetInnerHTML={{ __html: article.content }} />
            {article.scripts && (
              <div 
                dangerouslySetInnerHTML={{ __html: article.scripts }}
                style={{ display: "none" }}
              />
            )}
          </div>

          {/* SEO Metadata Copy Box */}
          {(article.meta_title || article.meta_description) && (
            <div className="mt-12 p-6 bg-gray-50/30 rounded-2xl border border-gray-300 space-y-4 shadow-sm" dir="ltr">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400">SEO Metadata</span>
              </div>
              
              {article.meta_title && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500">Meta Title</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(article.meta_title);
                        toast.success("Meta Title copied!");
                      }}
                      className="h-7 px-2.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium rounded-md flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </Button>
                  </div>
                  <div className="p-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 font-mono break-all leading-normal text-left shadow-sm">
                    {article.meta_title}
                  </div>
                </div>
              )}

              {article.meta_description && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-gray-500">Meta Description</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(article.meta_description);
                        toast.success("Meta Description copied!");
                      }}
                      className="h-7 px-2.5 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium rounded-md flex items-center gap-1"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy
                    </Button>
                  </div>
                  <div className="p-3 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 font-mono break-all leading-normal text-left shadow-sm">
                    {article.meta_description}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Client Feedback Card */}
          <div className="mt-16 border-t border-gray-100 pt-10">
            <div className="border border-blue-300 bg-blue-50/20 shadow-sm overflow-hidden rounded-2xl p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-blue-100 rounded-lg text-blue-700">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Client Feedback</h2>
                    <p className="text-xs text-gray-500">Provide comments or requests for this article</p>
                  </div>
                </div>

                {article.client_comment && !isEditingComment ? (
                  <div className="bg-white p-6 rounded-xl border border-blue-200 shadow-sm" dir={direction}>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-sm">
                          Feedback from {article.clients?.name || "Client"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setComment(article.client_comment);
                            setIsEditingComment(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 font-semibold h-7 px-2 rounded-md text-xs flex items-center gap-1 hover:bg-blue-50"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                      </div>
                      {article.client_comment_at && (
                        <span className="text-xs text-gray-400 font-medium">
                          {new Date(article.client_comment_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed" dir={direction}>
                      {article.client_comment}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <textarea
                        value={comment}
                        onChange={handleCommentChange}
                        placeholder="Type your comment here..."
                        rows={4}
                        className="w-full p-4 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all bg-white shadow-inner"
                        maxLength={500}
                        disabled={submitting}
                      />
                      <div className="absolute bottom-3 right-3 text-xs text-gray-400 font-medium">
                        {comment.length}/500
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">
                        Special characters are filtered automatically.
                      </span>
                      <div className="flex items-center gap-2">
                        {isEditingComment && (
                          <Button
                            variant="ghost"
                            onClick={() => {
                              setComment("");
                              setIsEditingComment(false);
                            }}
                            disabled={submitting}
                            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full px-4 h-9 text-xs font-semibold"
                          >
                            Cancel
                          </Button>
                        )}
                        <Button
                          onClick={submitComment}
                          disabled={submitting || !comment.trim()}
                          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-6 transition-all hover:scale-105 active:scale-95 flex items-center gap-2 h-9 text-sm font-semibold shadow-lg shadow-blue-200"
                        >
                          {submitting ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              {isEditingComment ? "Update Feedback" : "Submit Feedback"}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </article>
      </main>

      <footer className="bg-gray-50 border-t border-gray-100 py-12 mt-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          {article.clients?.hide_logo_in_preview ? (
            article.clients?.custom_bottom_text ? (
              <p className="text-gray-400 text-sm mb-4">{article.clients.custom_bottom_text}</p>
            ) : null
          ) : (
            <p className="text-gray-400 text-sm mb-4">This article was shared via BrandTactics Client Portal.</p>
          )}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-widest">Verified Article</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
