"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Send, Blocks, ChartNoAxesCombined, MousePointerClick, TrendingUp, Search, Plus, ExternalLink, Settings2, Trash2, LayoutGrid, SlidersHorizontal, User, Lock, FileText, AlertCircle } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect } from "react";
import { EditToolDialog } from "@/components/edit-tool-dialog";
import { EditTaskDialog } from "@/components/edit-task-dialog";
import { Dialog, DialogTrigger, DialogContent, DialogClose } from "@/components/ui/dialog";
import "react-quill-new/dist/quill.snow.css";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { SendSeoUpdateDialog } from "@/components/send-seo-update-dialog";
import { QuickActionsSidebar } from "@/components/quick-actions-sidebar";

const IconRenderer = ({ name, className }: { name: string, className?: string }) => {
  const Icon = (LucideIcons as any)[name] || Blocks;
  return <Icon className={className} />;
};

const CATEGORY_STYLES: Record<string, { color: string, bg: string }> = {
  SEO: { color: "text-blue-500", bg: "bg-blue-100" },
  Analytics: { color: "text-orange-500", bg: "bg-orange-100" },
  Design: { color: "text-purple-500", bg: "bg-purple-100" },
  Marketing: { color: "text-yellow-600", bg: "bg-yellow-100" },
  Other: { color: "text-gray-500", bg: "bg-gray-100" },
};

export default function DashboardPage() {
  const [filter, setFilter] = useState("All");
  const [clientStatusFilter, setClientStatusFilter] = useState("Active");
  
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState("");
  const [tools, setTools] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchClients();
    fetchTools();
    fetchCategories();
  }, []);

  async function fetchClients() {
    // Fetch clients and their related tasks, articles, and emails for stats
    const { data } = await supabase.from("clients").select(`
      id, 
      name, 
      contact_email,
      status,
      tasks (id, status),
      articles (id, status),
      email_updates (id, created_at, recipient_email)
    `).order("name");
    
    if (data) setClients(data);
  }

  async function fetchTools() {
    const { data } = await supabase.from("agency_tools").select("*").order("rank", { ascending: false });
    if (data) setTools(data);
  }

  async function fetchCategories() {
    const { data } = await supabase.from("tool_categories").select("*").order("rank");
    if (data) setCategories([{ name: "All" }, ...data]);
  }

  const handleDeleteTool = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tool?")) return;
    const { error } = await supabase.from('agency_tools').delete().eq('id', id);
    if (error) {
      toast.error("Failed to delete tool");
    } else {
      toast.success("Tool deleted");
      fetchTools();
    }
  };

  // Improved filtering to handle "Other" tools
  const filteredTools = (() => {
    if (filter === "All") return tools;
    if (filter === "Other") {
      // Return tools whose category is either explicitly "Other" or NOT in the categories list
      const knownCategoryNames = categories.map(c => c.name);
      return tools.filter(t => t.category === "Other" || !knownCategoryNames.includes(t.category));
    }
    return tools.filter(t => t.category === filter);
  })();
  
  const filteredWidgetClients = clients
    .filter(c => {
      const matchesSearch = (c.name || "").toLowerCase().includes(clientSearch.toLowerCase());
      const matchesStatus = clientStatusFilter === "All" || (c.status || "Active") === clientStatusFilter;
      return matchesSearch && matchesStatus;
    })
    .slice(0, 15);

  const handleSendUpdate = () => {
    fetchClients(); // Refresh client stats after sending if needed
  };

  return (
    <div className="space-y-8">
      {/* Clients List and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Clients Column (Left - 75%) */}
        <div className="lg:col-span-9 space-y-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Clients</CardTitle>
                <CardDescription>Recently active clients</CardDescription>
              </div>
              <Link href="/clients" className="text-xs text-blue-600 hover:underline font-medium">View All</Link>
            </CardHeader>
            <div className="px-4 py-3 bg-gray-50/50 border-b flex items-center justify-between gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Search clients..." className="pl-9 h-9 text-sm bg-white border-gray-200" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
              </div>
              <Select value={clientStatusFilter} onValueChange={(val) => setClientStatusFilter(val || "Active")}>
                <SelectTrigger className="w-40 h-9 bg-white text-xs font-semibold uppercase tracking-tight">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active" className="text-xs font-bold uppercase tracking-wider">Active Clients</SelectItem>
                  <SelectItem value="Archived" className="text-xs font-bold uppercase tracking-wider">Archived</SelectItem>
                  <SelectItem value="All" className="text-xs font-bold uppercase tracking-wider">All Clients</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <CardContent className="p-4">
              <div className="max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredWidgetClients.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-sm text-gray-500">No clients found.</div>
                  ) : (
                    filteredWidgetClients.map(client => {
                      const tasks = client.tasks || [];
                      const unfinishedTasks = tasks.filter((t: any) => t.status !== 'Completed').length;
                      const completedTasks = tasks.filter((t: any) => t.status === 'Completed').length;
                      const articlesCount = (client.articles || []).length;
                      
                      const emailUpdates = client.email_updates || [];
                      const totalUpdates = emailUpdates.length;
                      const now = new Date();
                      const thisMonthUpdates = emailUpdates.filter((u: any) => {
                        if (!u.created_at) return false;
                        const date = new Date(u.created_at);
                        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
                      }).length;
                      
                      return (
                        <Link 
                          href={`/clients/${client.id}`} 
                          key={client.id}
                          className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 bg-white hover:border-blue-200 hover:shadow-sm transition-all group"
                        >
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                            {(client.name || "UN").substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight">{client.name}</div>
                          </div>
                          
                          {/* Stats Blocks */}
                          <div className="flex items-center gap-2 opacity-80 transition-opacity">
                            <div className="text-center" title="Tasks">
                              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Tasks</div>
                              <div className="text-[10px] font-medium text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded">
                                <span className="text-orange-600">{unfinishedTasks}</span>/<span className="text-green-600">{completedTasks}</span>
                              </div>
                            </div>
                            
                            <div className="text-center" title="Articles">
                              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Art</div>
                              <div className="text-[10px] font-medium text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded">
                                {articlesCount}
                              </div>
                            </div>

                            <div className="text-center" title="Updates">
                              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">Upd</div>
                              <div className="text-[10px] font-medium text-gray-600 bg-gray-50 px-1.5 py-0.5 rounded">
                                <span className="text-blue-600">{thisMonthUpdates}</span>/{totalUpdates}
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agency Tools Widget */}
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Agency Tools</CardTitle>
                <CardDescription>Quick access to your workspace</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <Link href="/tools" className="text-xs text-blue-600 hover:underline font-medium">View Full Dashboard</Link>
                <Dialog>
                  <DialogTrigger render={
                    <Button size="sm" variant="outline" className="h-8 gap-1.5 border-dashed border-gray-300 hover:border-blue-500">
                      <Plus className="w-3.5 h-3.5" /> Add Tool
                    </Button>
                  }/>
                  <EditToolDialog onToolSaved={fetchTools} />
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              <Tabs defaultValue="All" value={filter} onValueChange={setFilter} className="w-full">
                <TabsList className="bg-gray-100/80 mb-4 h-9 p-1 flex-nowrap overflow-x-auto justify-start shadow-none border-none">
                  {categories.map(cat => (
                     <TabsTrigger key={cat.name} value={cat.name} className="text-xs data-[state=active]:bg-white whitespace-nowrap px-4 tracking-tight shadow-none">
                       {cat.name}
                     </TabsTrigger>
                  ))}
                </TabsList>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredTools.length === 0 ? (
                    <div className="col-span-full py-12 text-center border-2 border-dashed rounded-xl bg-gray-50/50">
                       <LayoutGrid className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                       <p className="text-sm text-gray-500">No tools found for this category.</p>
                    </div>
                  ) : (
                    filteredTools.map((tool) => (
                      <DashboardToolCard key={tool.id} tool={tool} onDelete={handleDeleteTool} onRefresh={fetchTools} />
                    ))
                  )}
                </div>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions Sidebar (Right - 25%) */}
        <div className="lg:col-span-3 space-y-4">
          <QuickActionsSidebar onAction={handleSendUpdate} />
        </div>
      </div>
    </div>
  );
}

function DashboardToolCard({ tool, onDelete, onRefresh }: { tool: any, onDelete: (id: string) => void, onRefresh: () => void }) {
  const styles = CATEGORY_STYLES[tool.category] || CATEGORY_STYLES.Other;
  
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  return (
    <Card className="group relative overflow-hidden hover:shadow-md transition-all border-gray-200 bg-white hover:border-blue-200 h-14">
      <div className="flex items-center h-full px-3 gap-3">
        {/* Main Link Overlay */}
        <a href={tool.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-0" aria-label={`Open ${tool.name}`}>
          <span className="sr-only">Open {tool.name}</span>
        </a>

        {/* Icon */}
        <div className={`p-2 rounded-lg ${styles.bg} ${styles.color} shrink-0 transition-transform group-hover:scale-105 relative z-10 pointer-events-none`}>
          <IconRenderer name={tool.icon_name} className="w-4 h-4" />
        </div>
        
        {/* Name & URL */}
        <div className="flex-1 min-w-0 relative z-10 pointer-events-none">
          <h3 className="font-bold text-gray-900 text-xs truncate leading-tight group-hover:text-blue-600 transition-colors uppercase tracking-tight">{tool.name}</h3>
          <div className="text-[10px] text-blue-500 truncate leading-tight">
            {tool.url.replace(/^https?:\/\//, '')}
          </div>
        </div>

        {/* Credentials, Edit, Rank */}
        <div className="flex items-center gap-1.5 shrink-0 relative z-20">
          {tool.username && (
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyToClipboard(tool.username, "Username"); }}
              className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 hover:bg-gray-100 border border-gray-100 text-[9px] text-gray-500 transition-colors max-w-[80px]"
              title={`Copy Username: ${tool.username}`}
            >
              <User className="w-2.5 h-2.5 text-gray-400" />
              <span className="truncate">{tool.username}</span>
            </button>
          )}
          {tool.password && (
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyToClipboard(tool.password, "Password"); }}
              className="hidden xs:flex items-center gap-1 px-1.5 py-0.5 rounded bg-gray-50 hover:bg-gray-100 border border-gray-100 text-[9px] text-gray-500 transition-colors"
              title="Copy Password"
            >
              <Lock className="w-2.5 h-2.5 text-gray-400" />
              <span>****</span>
            </button>
          )}

          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-gray-600 bg-gray-50/50 hover:bg-gray-100">
                    <SlidersHorizontal className="w-3 h-3" />
                  </Button>
                }/>
                <DropdownMenuContent align="end">
                  <DialogTrigger render={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-xs gap-2">
                       <Settings2 className="w-3.5 h-3.5" /> Edit Tool
                    </DropdownMenuItem>
                  }/>
                  <DropdownMenuItem className="text-xs text-red-600 gap-2" onClick={(e) => { e.stopPropagation(); onDelete(tool.id); }}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <EditToolDialog tool={tool} onToolSaved={onRefresh} />
            </Dialog>
          </div>

          <div className="bg-gray-50 text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-gray-400 shadow-sm shrink-0 pointer-events-none">
             #{tool.rank || 0}
          </div>
        </div>
      </div>
    </Card>
  );
}
