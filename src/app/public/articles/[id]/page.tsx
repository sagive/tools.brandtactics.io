"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Loader2, AlertCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function PublicArticleView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [article, setArticle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchArticle() {
      try {
        const { data, error } = await supabase
          .from('articles')
          .select('*, clients(name)')
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
    <div className="min-h-screen bg-white">
      {/* Premium Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              BT
            </div>
            <span className="font-bold text-gray-900 tracking-tight">BrandTactics</span>
          </div>
          {article.client_approved && (
            <Badge className="bg-green-50 text-green-700 hover:bg-green-50 border-green-100">
              Approved
            </Badge>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 lg:py-20">
        <article>
          <header className="mb-12">
            <div className="flex items-center gap-2 mb-4">
               <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-none font-medium">
                {article.type || "Article"}
              </Badge>
              {article.clients?.name && (
                <span className="text-sm text-gray-400 font-medium">for {article.clients.name}</span>
              )}
            </div>
            <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight mb-6">
              {article.title}
            </h1>
            <div className="flex items-center gap-4 text-sm text-gray-500 border-t border-gray-50 pt-6">
              <div className="flex flex-col">
                <span className="font-semibold text-gray-900">BrandTactics Editorial</span>
                <span>Published on {new Date(article.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </header>

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
            }
            .public-content h2 { font-size: 2rem; }
            .public-content h3 { font-size: 1.5rem; }
            .public-content img { 
              max-width: 100%; 
              height: auto; 
              border-radius: 16px; 
              margin: 3rem 0;
              box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.05), 0 10px 10px -5px rgba(0, 0, 0, 0.02);
            }
            .public-content ul, .public-content ol { 
              margin-bottom: 2rem; 
              padding-${direction === 'rtl' ? 'left' : 'right'}: 2rem; 
            }
            .public-content li { margin-bottom: 0.75rem; }
            .public-content blockquote {
              border-${direction === 'rtl' ? 'right' : 'left'}-width: 4px;
              border-color: #2563eb;
              padding-${direction === 'rtl' ? 'right' : 'left'}: 1.5rem;
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
          `}} />

          <div 
            className="public-content"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />
        </article>
      </main>

      <footer className="bg-gray-50 border-t border-gray-100 py-12 mt-20">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-gray-400 text-sm mb-4">This article was shared via BrandTactics Client Portal.</p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm border border-gray-100">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-gray-700 uppercase tracking-widest">Verified Article</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
