"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Download, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { format } from "date-fns";

export default function ClientArticles({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = React.use(params);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [clientCategories, setClientCategories] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("All");

  useEffect(() => {
    fetchArticles();
  }, [clientId]);

  const fetchArticles = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });
      
    if (data) setArticles(data);

    // Fetch client categories
    const { data: clientData } = await supabase
      .from('clients')
      .select('article_categories')
      .eq('id', clientId)
      .single();

    if (clientData?.article_categories) {
      const cats = clientData.article_categories
        .split("\n")
        .map((c: string) => c.trim())
        .filter(Boolean);
      setClientCategories(cats);
    }

    setIsLoading(false);
  };

  const filteredArticles = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || a.status === statusFilter;
    const matchesCategory = categoryFilter === "All" || (Array.isArray(a.categories) && a.categories.includes(categoryFilter));
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const handleDelete = async (articleId: string) => {
    if (!confirm("Are you sure you want to delete this article?")) return;
    try {
      const { error } = await supabase.from('articles').delete().eq('id', articleId);
      if (error) throw error;
      setArticles(prev => prev.filter(a => a.id !== articleId));
      toast.success("Article deleted");
    } catch (err: any) {
      toast.error("Failed to delete article");
    }
  };

  const draftCount = articles.filter(a => a.status === "Draft").length;
  const sentCount = articles.filter(a => a.status === "Sent to publisher").length;
  const publishedCount = articles.filter(a => a.status === "Published").length;

  return (
    <div className="space-y-6">
      {/* Stats Badges */}
      <div className="flex gap-2 mb-4">
        <Badge variant="outline" className="bg-white">{articles.length} Total</Badge>
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">{draftCount} Drafts</Badge>
        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">{sentCount} Sent to publisher</Badge>
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">{publishedCount} Published</Badge>
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
          <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val || "All")}>
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
            <Select value={categoryFilter} onValueChange={(val) => setCategoryFilter(val || "All")}>
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
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                  Loading articles...
                </TableCell>
              </TableRow>
            ) : filteredArticles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-gray-500">
                  No articles found.
                </TableCell>
              </TableRow>
            ) : (
              filteredArticles.map((article) => (
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
                      {article.content_length || "-"}
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
          <div className="p-4 border-t bg-gray-50/50 text-sm text-gray-500 flex items-center justify-between">
            Showing 1 to {filteredArticles.length} of {filteredArticles.length} results
          </div>
        )}
      </Card>
    </div>
  );
}
