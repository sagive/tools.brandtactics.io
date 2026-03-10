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
  GripVertical
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
      supabase.from("agency_tools").select("*").order("rank"),
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
             <DialogTrigger>
               <Button variant="outline" className="gap-2 border-dashed">
                 <Settings2 className="w-4 h-4" /> Categories
               </Button>
             </DialogTrigger>
             <ManageCategoriesDialog onCategoriesChanged={fetchData} />
          </Dialog>

          <Dialog>
             <DialogTrigger>
               <Button className="gap-2 bg-[#4640A0] hover:bg-[#342e81]">
                 <Plus className="w-4 h-4" /> Add Tool
               </Button>
             </DialogTrigger>
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
          {categories.map((category) => {
            const categoryTools = filteredTools
              .filter(t => t.category === category.name)
              .slice(0, 20); // Show top 20
            
            if (categoryTools.length === 0 && searchTerm) return null;

            const styles = CATEGORY_STYLES[category.name] || CATEGORY_STYLES.Other;

            return (
              <section key={category.id} className="space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                   <div className="flex items-center gap-3">
                     <div className={`w-2 h-8 rounded-full ${styles.bg.replace('bg-', 'bg-') || 'bg-gray-200'}`} style={{ backgroundColor: styles.color.split('-')[1] }} />
                     <div>
                       <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                       <p className="text-xs text-gray-500">{categoryTools.length} tools ranked in this category</p>
                     </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {categoryTools.length === 0 ? (
                    <div className="col-span-full py-8 text-center border border-dashed rounded-xl bg-gray-50/30">
                       <p className="text-sm text-gray-400">No tools found in this category.</p>
                    </div>
                  ) : (
                    categoryTools.map((tool) => (
                      <Card key={tool.id} className="group relative overflow-hidden hover:shadow-lg transition-all border-gray-200 bg-white">
                        <div className="p-4 flex flex-col items-center text-center space-y-3">
                          <div className={`p-3.5 rounded-2xl ${styles.bg} ${styles.color} transition-transform group-hover:scale-105 group-hover:rotate-3`}>
                            <IconRenderer name={tool.icon_name} className="w-6 h-6" />
                          </div>
                          
                          <div className="absolute top-2 right-2 flex flex-col items-end gap-1">
                             <div className="bg-gray-100 text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-gray-500 shadow-sm">
                               #{tool.rank || 0}
                             </div>
                          </div>

                          <div className="min-w-0">
                            <h3 className="font-bold text-gray-900 text-sm truncate">{tool.name}</h3>
                            <a 
                              href={tool.url} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-[10px] text-blue-500 hover:underline truncate block max-w-[150px]"
                            >
                              {tool.url.replace(/^https?:\/\//, '')}
                            </a>
                          </div>

                          <div className="flex items-center gap-2 pt-1 opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0">
                            <Button variant="outline" size="sm" className="h-7 px-3 text-[11px] rounded-lg shadow-sm">
                              <a href={tool.url} target="_blank" rel="noopener noreferrer" className="flex items-center">
                                <ExternalLink className="w-3 h-3 mr-1" /> Open
                              </a>
                            </Button>
                            
                            <DropdownMenu>
                              <DropdownMenuTrigger>
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400">
                                  <Settings2 className="w-3.5 h-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <Dialog>
                                  <DialogTrigger>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-xs gap-2">
                                       Edit Tool
                                    </DropdownMenuItem>
                                  </DialogTrigger>
                                  <EditToolDialog tool={tool} onToolSaved={fetchData} />
                                </Dialog>
                                <DropdownMenuItem 
                                  className="text-xs text-red-600 gap-2" 
                                  onClick={() => handleDeleteTool(tool.id)}
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
