"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Download, MoreHorizontal, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { format } from "date-fns";

export default function ClientArticles({ params }: { params: Promise<{ id: string }> }) {
  const { id: clientId } = React.use(params);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  
  const [articles, setArticles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
    setIsLoading(false);
  };

  const filteredArticles = articles.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
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
  const publishedCount = articles.filter(a => a.status === "Published").length;

  return (
    <div className="space-y-6">
      {/* Stats Badges */}
      <div className="flex gap-2 mb-4">
        <Badge variant="outline" className="bg-white">{articles.length} Total</Badge>
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">{draftCount} Drafts</Badge>
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
            <SelectTrigger className="w-full sm:w-[140px] bg-white">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Status</SelectItem>
              <SelectItem value="Draft">Drafts</SelectItem>
              <SelectItem value="Published">Published</SelectItem>
            </SelectContent>
          </Select>
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
              <TableHead className="w-full min-w-[300px]">Article Title</TableHead>
              <TableHead className="w-32">Type</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-40">Last Updated</TableHead>
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
                  <TableCell className="font-medium text-gray-900">
                    <div className="flex flex-col">
                      <span>{article.title}</span>
                      {article.live_url && (
                        <a href={article.live_url} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 hover:underline mt-0.5 inline-block truncate max-w-[250px]">
                          {article.live_url}
                        </a>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                      {article.type || "-"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={
                      article.status === 'Published' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'bg-gray-100 text-gray-700'
                    }>
                      {article.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {format(new Date(article.updated_at), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-8 w-8 text-gray-400 hover:text-gray-900">
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <Link href={`/clients/${clientId}/articles/${article.id}`}>
                          <DropdownMenuItem className="cursor-pointer">
                            <Edit className="w-4 h-4 mr-2" /> Edit
                          </DropdownMenuItem>
                        </Link>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer" onClick={() => handleDelete(article.id)}>
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
