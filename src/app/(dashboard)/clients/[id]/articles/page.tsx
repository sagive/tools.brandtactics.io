"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Download, Trash2, Edit, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { format } from "date-fns";

const PAGE_SIZE = 25;
const ARTICLE_LIST_COLUMNS = "id, title, live_url, type, length, status, updated_at, created_at, categories, is_public";

type ArticleStatusFilter = "All" | "Draft" | "Sent to publisher" | "Published";

type ArticleListItem = {
  id: string;
  title: string;
  live_url: string | null;
  type: string | null;
  length: number | null;
  status: string | null;
  updated_at: string | null;
  created_at: string | null;
  categories: string[] | null;
  is_public: boolean | null;
};

type ArticleCounts = {
  total: number;
  draft: number;
  sent: number;
  published: number;
};

export default function ClientArticles({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = React.use(params);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ArticleStatusFilter>("Draft");
  
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientCategories, setClientCategories] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [articleCounts, setArticleCounts] = useState<ArticleCounts>({
    total: 0,
    draft: 0,
    sent: 0,
    published: 0,
  });

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setCurrentPage(1);
      setDebouncedSearch(search.trim());
    }, 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let isActive = true;

    async function fetchClientCategories() {
      const { data: clientData, error } = await supabase
        .from('clients')
        .select('article_categories')
        .eq('id', clientId)
        .single();

      if (!isActive) return;

      if (error) {
        console.error("Failed to fetch article categories", error);
        setClientCategories([]);
        setCategoryFilter("All");
        return;
      }

      if (clientData?.article_categories) {
        const cats = clientData.article_categories
          .split("\n")
          .map((c: string) => c.trim())
          .filter(Boolean);

        setClientCategories(cats);
        setCategoryFilter((prev) => prev === "All" || cats.includes(prev) ? prev : "All");
      } else {
        setClientCategories([]);
        setCategoryFilter("All");
      }
    }

    fetchClientCategories();

    return () => {
      isActive = false;
    };
  }, [clientId]);

  useEffect(() => {
    let isActive = true;

    async function fetchArticleCounts() {
      const [totalResult, draftResult, sentResult, publishedResult] = await Promise.all([
        supabase.from('articles').select('id', { count: 'exact', head: true }).eq('client_id', clientId),
        supabase.from('articles').select('id', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'Draft'),
        supabase.from('articles').select('id', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'Sent to publisher'),
        supabase.from('articles').select('id', { count: 'exact', head: true }).eq('client_id', clientId).eq('status', 'Published'),
      ]);

      if (!isActive) return;

      const firstError = totalResult.error || draftResult.error || sentResult.error || publishedResult.error;
      if (firstError) {
        console.error("Failed to fetch article counts", firstError);
        return;
      }

      setArticleCounts({
        total: totalResult.count ?? 0,
        draft: draftResult.count ?? 0,
        sent: sentResult.count ?? 0,
        published: publishedResult.count ?? 0,
      });
    }

    fetchArticleCounts();

    return () => {
      isActive = false;
    };
  }, [clientId, refreshKey]);

  useEffect(() => {
    let isActive = true;

    async function fetchArticles() {
      setIsLoading(true);

      const from = (currentPage - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      let query = supabase
        .from('articles')
        .select(ARTICLE_LIST_COLUMNS, { count: 'exact' })
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (statusFilter !== "All") {
        query = query.eq('status', statusFilter);
      }

      if (categoryFilter !== "All") {
        query = query.contains('categories', [categoryFilter]);
      }

      if (debouncedSearch) {
        query = query.ilike('title', `%${debouncedSearch}%`);
      }

      const { data, error, count } = await query.range(from, to);

      if (!isActive) return;

      if (error) {
        console.error("Failed to fetch articles", error);
        toast.error("Failed to load articles");
        setArticles([]);
        setTotalCount(0);
      } else {
        const nextTotal = count ?? 0;
        const lastPage = Math.max(1, Math.ceil(nextTotal / PAGE_SIZE));

        if (currentPage > lastPage) {
          setCurrentPage(lastPage);
          return;
        }

        setArticles(data ?? []);
        setTotalCount(nextTotal);
      }

      setIsLoading(false);
    }

    fetchArticles();

    return () => {
      isActive = false;
    };
  }, [clientId, currentPage, debouncedSearch, statusFilter, categoryFilter, refreshKey]);

  const handleDelete = async (articleId: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      const { error } = await supabase.from('articles').delete().eq('id', articleId);
      if (error) throw error;
      const shouldMoveBack = articles.length === 1 && currentPage > 1;
      setArticles(prev => prev.filter(a => a.id !== articleId));
      setTotalCount(prev => Math.max(0, prev - 1));
      if (shouldMoveBack) {
        setCurrentPage(prev => Math.max(1, prev - 1));
      }
      setRefreshKey(prev => prev + 1);
      toast.success("Article deleted");
    } catch (error) {
      console.error("Failed to delete article", error);
      toast.error("Failed to delete article");
    }
  };

  const handleStatusFilterChange = (value: string | null) => {
    setCurrentPage(1);
    setStatusFilter((value || "All") as ArticleStatusFilter);
  };

  const handleCategoryFilterChange = (value: string | null) => {
    setCurrentPage(1);
    setCategoryFilter(value || "All");
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const startResult = totalCount === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const endResult = Math.min(currentPage * PAGE_SIZE, totalCount);

  return (
    <div className="space-y-6">
      {/* Stats Badges */}
      <div className="flex gap-2 mb-4">
        <Badge variant="outline" className="bg-white">{articleCounts.total} Total</Badge>
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">{articleCounts.draft} Drafts</Badge>
        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">{articleCounts.sent} Sent to publisher</Badge>
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">{articleCounts.published} Published</Badge>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search articles..."
              className="pl-9 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-[160px] bg-white">
              <span data-slot="select-value" className="flex flex-1 text-start line-clamp-1">
                {statusFilter === "All" 
                  ? "All Status" 
                  : statusFilter === "Draft" 
                  ? "Drafts" 
                  : statusFilter === "Sent to publisher"
                  ? "Sent to publisher"
                  : "Published"}
              </span>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Draft">Drafts</SelectItem>
              <SelectItem value="Sent to publisher">Sent to publisher</SelectItem>
              <SelectItem value="Published">Published</SelectItem>
            </SelectContent>
          </Select>
          {clientCategories.length > 0 && (
            <Select value={categoryFilter} onValueChange={handleCategoryFilterChange}>
              <SelectTrigger className="w-full sm:w-[160px] bg-white">
                <span data-slot="select-value" className="flex flex-1 text-start line-clamp-1">
                  {categoryFilter === "All" ? "All Categories" : categoryFilter}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Categories</SelectItem>
                {clientCategories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <Button variant="outline" className="w-full sm:w-auto bg-white">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Link href={`/clients/${clientId}/articles/new`} className="w-full sm:w-auto">
            <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> New Article
            </Button>
          </Link>
        </div>
      </div>

      {/* Articles Table */}
      <Card className="shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="w-full min-w-[300px] pl-6">Article Title</TableHead>
              <TableHead className="w-32 text-center">Length (Words)</TableHead>
              <TableHead className="w-32 text-center">Type</TableHead>
              <TableHead className="w-32 text-center">Status</TableHead>
              <TableHead className="w-40 text-center">Last Updated</TableHead>
              <TableHead className="w-28"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                  Loading articles...
                </TableCell>
              </TableRow>
            ) : articles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-gray-500">
                  No articles found.
                </TableCell>
              </TableRow>
            ) : (
              articles.map((article) => (
                <TableRow key={article.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-gray-900 hover:text-blue-600 transition-colors pl-6">
                    <div className="flex flex-col">
                      <Link href={`/clients/${clientId}/articles/${article.id}`}>
                        <span className="cursor-pointer">{article.title}</span>
                      </Link>
                      {article.live_url && (
                        <a href={article.live_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline mt-0.5 inline-block truncate max-w-[250px]">
                          {article.live_url}
                        </a>
                      )}
                      {article.categories && article.categories.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {article.categories.map((c: string) => (
                            <span key={c} className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[9px] font-semibold">
                              {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                      {article.length ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                      {article.type || "-"}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className={
                      article.status === 'Published' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : article.status === 'Sent to publisher'
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'bg-gray-100 text-gray-700'
                    }>
                      {article.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm text-center">
                    {article.updated_at 
                      ? format(new Date(article.updated_at), "MMM d, yyyy") 
                      : "Recently Added"}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {article.is_public ? (
                        <a
                          href={`/public/articles/${article.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex"
                        >
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
                            title="Open public link"
                            aria-label="Open public link"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </a>
                      ) : (
                        <span title="No public link" className="inline-flex">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-gray-300 opacity-35 hover:bg-transparent cursor-not-allowed rounded-lg"
                            aria-label="No public link"
                            disabled
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </span>
                      )}
                      <Link href={`/clients/${clientId}/articles/${article.id}`}>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        onClick={() => handleDelete(article.id)}
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {!isLoading && (
          <div className="p-4 border-t bg-gray-50/50 text-sm text-gray-500 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <span>
              Showing {startResult} to {endResult} of {totalCount} results
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                className="h-8 bg-white"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-8 bg-white"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
