"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { EditToolDialog } from "@/components/edit-tool-dialog";
import { ManageCategoriesDialog } from "@/components/manage-categories-dialog";
import { 
  Plus, 
  Settings2, 
  ExternalLink, 
  Trash2, 
  Blocks, 
  Search, 
  LayoutGrid, 
  ArrowLeft,
  GripVertical,
  SlidersHorizontal,
  User,
  Lock
} from "lucide-react";
import * as LucideIcons from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

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

export default function ToolsDashboard() {
  const [tools, setTools] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [toolsRes, catsRes] = await Promise.all([
      supabase.from("agency_tools").select("*").order("rank", { ascending: false }),
      supabase.from("tool_categories").select("*").order("rank")
    ]);
    
    if (toolsRes.data) setTools(toolsRes.data);
    if (catsRes.data) setCategories(catsRes.data);
    setLoading(false);
  }

  const handleDeleteTool = async (id: string) => {
    if (!confirm("Are you sure you want to delete this tool?")) return;
    const { error } = await supabase.from('agency_tools').delete().eq('id', id);
    if (error) {
      toast.error("Failed to delete tool");
    } else {
      toast.success("Tool deleted");
      fetchData();
    }
  };

  const filteredTools = tools.filter(tool => 
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <Link href="/dashboard">
               <Button variant="ghost" size="icon" className="h-8 w-8">
                 <ArrowLeft className="w-4 h-4" />
               </Button>
             </Link>
             <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-outfit">Tools Dashboard</h1>
          </div>
          <p className="text-gray-500">Global resource directory for BrandTactics. {tools.length} tools across {categories.length} categories.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
             <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
             <Input 
               placeholder="Search tools..." 
               className="pl-10 bg-white border-gray-200"
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
          </div>
          
          <Dialog>
             <DialogTrigger render={
               <Button variant="outline" className="gap-2 border-dashed">
                 <Settings2 className="w-4 h-4" /> Categories
               </Button>
             }/>
             <ManageCategoriesDialog onCategoriesChanged={fetchData} />
          </Dialog>

          <Dialog>
             <DialogTrigger render={
               <Button className="gap-2 bg-[#4640A0] hover:bg-[#342e81]">
                 <Plus className="w-4 h-4" /> Add Tool
               </Button>
             }/>
             <EditToolDialog onToolSaved={fetchData} />
          </Dialog>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {(() => {
            const categorizedToolIds = new Set();
            const categorySections = categories.map((category) => {
              const categoryTools = filteredTools
                .filter(t => t.category === category.name)
                .slice(0, 20);
              
              categoryTools.forEach(t => categorizedToolIds.add(t.id));
              
              if (categoryTools.length === 0) return null;

              const styles = CATEGORY_STYLES[category.name] || CATEGORY_STYLES.Other;

              return (
                <section key={category.id} className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                     <div className="flex items-center gap-3">
                       <div className={`w-2 h-8 rounded-full ${styles.bg}`} style={{ backgroundColor: styles.color.split('-')[1] }} />
                       <div>
                         <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                         <p className="text-xs text-gray-500">{categoryTools.length} tools ranked in this category</p>
                       </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {categoryTools.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} styles={styles} onDelete={handleDeleteTool} onRefresh={fetchData} />
                    ))}
                  </div>
                </section>
              );
            }).filter(Boolean);

            // Handle "Other" / Uncategorized tools
            const uncategorizedTools = filteredTools.filter(t => !categorizedToolIds.has(t.id));
            if (uncategorizedTools.length > 0) {
              const styles = CATEGORY_STYLES.Other;
              categorySections.push(
                <section key="uncategorized" className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                     <div className="flex items-center gap-3">
                       <div className="w-2 h-8 rounded-full bg-gray-200" />
                       <div>
                         <h2 className="text-xl font-bold text-gray-900">Other / Uncategorized</h2>
                         <p className="text-xs text-gray-500">{uncategorizedTools.length} tools in this section</p>
                       </div>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {uncategorizedTools.map((tool) => (
                      <ToolCard key={tool.id} tool={tool} styles={styles} onDelete={handleDeleteTool} onRefresh={fetchData} />
                    ))}
                  </div>
                </section>
              );
            }

            return categorySections;
          })()}
        </div>
      )}
    </div>
  );
}

function ToolCard({ tool, styles, onDelete, onRefresh }: { tool: any, styles: any, onDelete: (id: string) => void, onRefresh: () => void }) {
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  return (
    <Card className="group relative overflow-hidden hover:shadow-md transition-all border-gray-200 bg-white hover:border-blue-200 flex flex-col">
      <div className="p-3 flex items-center gap-3 relative min-h-[64px]">
        <a href={tool.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-0" aria-label={`Open ${tool.name}`}>
          <span className="sr-only">Open {tool.name}</span>
        </a>

        <div className={`p-2.5 rounded-xl ${styles.bg} ${styles.color} shrink-0 transition-transform group-hover:scale-105 relative z-10 pointer-events-none`}>
          <IconRenderer name={tool.icon_name} className="w-5 h-5" />
        </div>
        
        <div className="min-w-0 flex-1 relative z-10 pointer-events-none">
          <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-blue-600 transition-colors">{tool.name}</h3>
          <div className="text-[11px] text-blue-500 truncate w-full">
            {tool.url.replace(/^https?:\/\//, '')}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 relative z-10">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity">
            <Dialog>
              <DropdownMenu>
                <DropdownMenuTrigger render={
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-gray-600 bg-gray-50/50 hover:bg-gray-100">
                    <SlidersHorizontal className="w-3.5 h-3.5" />
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
          <div className="bg-gray-50 text-[11px] font-bold px-2 py-1 rounded border border-gray-200 text-gray-500 shadow-sm shrink-0 pointer-events-none">
             #{tool.rank || 0}
          </div>
        </div>
      </div>

      {(tool.username || tool.password) && (
        <div className="px-3 pb-3 pt-1 flex items-center gap-2 relative z-20 overflow-hidden">
          {tool.username && (
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyToClipboard(tool.username, "Username"); }}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[10px] text-gray-600 transition-colors max-w-[140px]"
              title="Click to copy username"
            >
              <User className="w-3 h-3 text-gray-400" />
              <span className="truncate">{tool.username}</span>
            </button>
          )}
          {tool.password && (
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyToClipboard(tool.password, "Password"); }}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 hover:bg-gray-100 border border-gray-200 text-[10px] text-gray-600 transition-colors"
              title="Click to copy password"
            >
              <Lock className="w-3 h-3 text-gray-400" />
              <span>********</span>
            </button>
          )}
        </div>
      )}
    </Card>
  );
}
