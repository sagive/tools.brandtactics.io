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
import { Send, Blocks, ChartNoAxesCombined, MousePointerClick, TrendingUp, Search, Plus, ExternalLink, Settings2, Trash2, LayoutGrid, SlidersHorizontal, User, Lock } from "lucide-react";
import * as LucideIcons from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect } from "react";
import { EditToolDialog } from "@/components/edit-tool-dialog";
import { Dialog, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import "react-quill-new/dist/quill.snow.css";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

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
  const [clientId, setClientId] = useState("");
  const [openClientDropdown, setOpenClientDropdown] = useState(false);
  const [subject, setSubject] = useState("SEO Update from BrandTactics");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState("All");
  
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
    const { data } = await supabase.from("clients").select("id, name, contact_email").order("name");
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
    .filter(c => (c.name || "").toLowerCase().includes(clientSearch.toLowerCase()))
    .slice(0, 15);

  const handleSendUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error("Please select a client.");
      return;
    }
    setSending(true);
    
    try {
      // Get the current user's session token to authenticate the API request
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || '';

      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ clientId, subject, body }),
      });
      
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to send email");
      
      if (data.simulated) {
        toast.success(`[Simulated] Update saved for ${data.clientName || 'client'}. Add RESEND_API_KEY to actually send.`);
      } else {
        toast.success(`Update sent to ${data.clientName || 'client'} successfully!`);
      }
      setBody("");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Row: Email Form and Clients List */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-4 space-y-6">
          <Card className="shadow-sm border-gray-200">
            <CardHeader className="pb-4 border-b mb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Send className="w-4 h-4 text-blue-600" />
                Send SEO Update
              </CardTitle>
              <CardDescription>Rapidly send updates to clients.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</Label>
                  <Popover open={openClientDropdown} onOpenChange={setOpenClientDropdown}>
                    <PopoverTrigger className="w-full" render={
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openClientDropdown}
                        className={cn(
                          "w-full justify-between bg-white font-normal h-10 px-3",
                          !clientId && "text-muted-foreground"
                        )}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <User className="w-4 h-4 text-gray-400 shrink-0" />
                          {clientId
                            ? clients.find((c) => c.id === clientId)?.name
                            : "Select a client..."}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    }/>
                    <PopoverContent className="w-[var(--base-ui-popover-trigger-width)] min-w-[300px] p-0" align="start">
                      <Command className="w-full">
                        <CommandInput placeholder="Search client..." className="h-10" />
                        <CommandList className="max-h-[300px]">
                          <CommandEmpty>No client found.</CommandEmpty>
                          <CommandGroup>
                            {clients.map((client) => {
                              const hasEmail = !!client.contact_email;
                              return (
                                <CommandItem
                                  key={client.id}
                                  value={client.name}
                                  onSelect={() => {
                                    setClientId(client.id);
                                    setOpenClientDropdown(false);
                                  }}
                                  className={cn("flex flex-col items-start px-3 py-2 cursor-pointer transition-colors hover:bg-gray-50", !hasEmail && "opacity-60")}
                                >
                                  <div className="flex items-center w-full">
                                    <div className="flex-1 font-bold text-gray-900">{client.name}</div>
                                    <Check
                                      className={cn(
                                        "ml-auto h-4 w-4 text-blue-600",
                                        clientId === client.id ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                  </div>
                                  <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mt-0.5">
                                    {hasEmail ? client.contact_email : "⚠️ Missing Email"}
                                  </div>
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  
                  {clientId && !clients.find(c => c.id === clientId)?.contact_email && (
                    <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                      <p className="text-xs text-red-600 font-bold flex items-center gap-1.5">
                        <LucideIcons.AlertCircle className="w-3.5 h-3.5" />
                        Missing contact email. Cannot send update.
                      </p>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</Label>
                  <Input value={subject} onChange={e => setSubject(e.target.value)} className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Message</Label>
                  <div className="bg-white rounded-md border border-input shadow-sm overflow-hidden pb-10">
                    <ReactQuill 
                      theme="snow" 
                      value={body} 
                      onChange={setBody} 
                      className="[&_.ql-editor]:min-h-[200px] [&_.ql-editor]:text-sm [&_.ql-toolbar]:border-x-0 [&_.ql-toolbar]:border-t-0 [&_.ql-container]:border-none" 
                      placeholder="Brief update details..." 
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  disabled={sending || !!(clientId && !clients.find(c => c.id === clientId)?.contact_email)} 
                  className="w-full bg-[#4640A0] hover:bg-[#342e81]"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? "Sending..." : "Send Update"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-8 space-y-6">
          <Card className="shadow-sm border-gray-200 h-full">
            <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Clients</CardTitle>
                <CardDescription>Recently active clients</CardDescription>
              </div>
              <Link href="/clients" className="text-xs text-blue-600 hover:underline font-medium">View All</Link>
            </CardHeader>
            <div className="px-4 py-3 bg-gray-50/50 border-b">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="Search clients..." className="pl-9 h-9 text-sm bg-white border-gray-200" value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
              </div>
            </div>
            <CardContent className="p-0">
              <div className="max-h-[400px] overflow-y-auto">
                <ul className="divide-y divide-gray-100">
                  {filteredWidgetClients.length === 0 ? (
                    <div className="p-8 text-center text-sm text-gray-500">No clients found.</div>
                  ) : (
                    filteredWidgetClients.map(client => (
                      <li key={client.id} className="hover:bg-blue-50/30 transition-colors group">
                        <Link href={`/clients/${client.id}`} className="flex items-center gap-4 p-4">
                          <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm shrink-0 shadow-sm border border-blue-200">
                            {(client.name || "UN").substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-bold text-gray-900 truncate">{client.name}</div>
                            {client.contact_email && <div className="text-xs text-gray-500 truncate mt-0.5">{client.contact_email}</div>}
                          </div>
                          <div className="hidden group-hover:block">
                            <ExternalLink className="w-4 h-4 text-gray-300" />
                          </div>
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Agency Tools Row */}
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-gray-900 font-outfit">Agency Tools</h2>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500">Quick access to your workspace</p>
              <span className="text-gray-300">•</span>
              <Link href="/tools" className="text-xs text-blue-600 hover:underline font-medium">View Full Dashboard</Link>
            </div>
          </div>
          <Dialog>
            <DialogTrigger render={
              <Button size="sm" variant="outline" className="h-8 gap-1.5 border-dashed border-gray-300 hover:border-blue-500">
                <Plus className="w-3.5 h-3.5" /> Add Tool
              </Button>
            }/>
            <EditToolDialog onToolSaved={fetchTools} />
          </Dialog>
        </div>

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
