"use client";

import React from "react";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Plus, Download, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const MOCK_ARTICLES = [
  { id: "1", title: "Top 10 SEO Strategies for 2024", status: "Draft", date: "2023-11-20" },
  { id: "2", title: "How to Improve Core Web Vitals", status: "Published", date: "2023-11-18" },
  { id: "3", title: "The Ultimate Guide to Local SEO", status: "Draft", date: "2023-11-15" },
  { id: "4", title: "Why Backlinks Still Matter", status: "Published", date: "2023-11-10" },
  { id: "5", title: "E-A-T Explained for Marketers", status: "Published", date: "2023-11-05" },
  { id: "6", title: "Google algorithm updates", status: "Draft", date: "2023-10-28" },
];

export default function ClientArticles({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params); // Optional usage to prevent lint error
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredArticles = MOCK_ARTICLES.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "All" || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Stats Badges */}
      <div className="flex gap-2 mb-4">
        <Badge variant="outline" className="bg-white">12 Total</Badge>
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">4 Drafts</Badge>
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700">8 Published</Badge>
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
          <Dialog>
            <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" /> New Article
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
              <DialogHeader>
                <DialogTitle>Create New Article</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input placeholder="Enter article title..." />
                </div>
                <div className="space-y-2">
                  <Label>Content Outline / Draft</Label>
                  <Textarea className="min-h-[200px]" placeholder="Start writing here..." />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button variant="outline">Save as Draft</Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">Publish</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Articles Table */}
      <Card className="shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead className="w-full min-w-[300px]">Article Title</TableHead>
              <TableHead className="w-32">Status</TableHead>
              <TableHead className="w-40">Last Updated</TableHead>
              <TableHead className="w-16"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredArticles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center text-gray-500">
                  No articles found.
                </TableCell>
              </TableRow>
            ) : (
              filteredArticles.map((article) => (
                <TableRow key={article.id} className="hover:bg-gray-50/50">
                  <TableCell className="font-medium text-gray-900">{article.title}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={
                      article.status === 'Published' 
                      ? 'bg-emerald-50 text-emerald-700' 
                      : 'bg-gray-100 text-gray-700'
                    }>
                      {article.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-gray-500 text-sm">{article.date}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-8 w-8 text-gray-400 hover:text-gray-900">
                        <MoreHorizontal className="w-4 h-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer" onClick={() => toast.success("Article deleted.")}>
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
        <div className="p-4 border-t bg-gray-50/50 text-sm text-gray-500 flex items-center justify-between">
          Showing 1 to {filteredArticles.length} of {filteredArticles.length} results
        </div>
      </Card>
    </div>
  );
}
