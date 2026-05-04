"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { EditBacklinkDialog } from "@/components/edit-backlink-dialog";
import { BulkAddBacklinkDialog } from "@/components/bulk-add-backlink-dialog";
import { ManageBacklinkCategoriesDialog } from "@/components/manage-backlink-categories-dialog";
import { 
  Plus, 
  Settings2, 
  ExternalLink, 
  Trash2, 
  Link2, 
  Search, 
  ArrowLeft,
  LayoutGrid,
  SlidersHorizontal,
  User,
  Lock,
  Globe
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";

const CATEGORY_COLORS: Record<string, string> = {
  'General': 'bg-blue-100 text-blue-600',
  'Business Directory': 'bg-orange-100 text-orange-600',
  'Guest Post': 'bg-purple-100 text-purple-600',
  'Profile': 'bg-green-100 text-green-600',
  'Social': 'bg-pink-100 text-pink-600',
};

export default function BacklinksDashboard() {
  const [backlinks, setBacklinks] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    const [backRes, catsRes] = await Promise.all([
      supabase.from("backlinks").select("*, backlink_categories(name)").order("rank", { ascending: false }),
      supabase.from("backlink_categories").select("*").order("rank")
    ]);
    
    if (backRes.data) setBacklinks(backRes.data);
    if (catsRes.data) setCategories(catsRes.data);
    setLoading(false);
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure? This will also remove client-specific data for this backlink.")) return;
    const { error } = await supabase.from('backlinks').delete().eq('id', id);
    if (error) {
      toast.error("Failed to delete backlink");
    } else {
      toast.success("Backlink deleted");
      fetchData();
    }
  };

  const filteredBacklinks = backlinks.filter(b => 
    b.website_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.backlink_categories?.name.toLowerCase().includes(searchTerm.toLowerCase())
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
             <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-outfit">Backlinks Lobby</h1>
          </div>
          <p className="text-gray-500">Global resource directory for link building. {backlinks.length} sources across {categories.length} categories.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative w-full md:w-64">
             <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
             <Input 
               placeholder="Search sources..." 
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
             <ManageBacklinkCategoriesDialog onCategoriesChanged={fetchData} />
          </Dialog>

          <Dialog>
             <DialogTrigger render={
               <Button variant="outline" className="gap-2 border-blue-600 text-blue-600 hover:bg-blue-50">
                 <LayoutGrid className="w-4 h-4" /> Bulk Add
               </Button>
             }/>
             <BulkAddBacklinkDialog onBacklinksSaved={fetchData} />
          </Dialog>

          <Dialog>
             <DialogTrigger render={
               <Button className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                 <Plus className="w-4 h-4" /> Add Source
               </Button>
             }/>
             <EditBacklinkDialog onBacklinkSaved={fetchData} />
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
              const categoryBacklinks = filteredBacklinks.filter(b => b.category_id === category.id);
              if (categoryBacklinks.length === 0) return null;

              return (
                <section key={category.id} className="space-y-6">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                     <div className="flex items-center gap-3">
                        <div className="w-1 h-6 bg-blue-600 rounded-full" />
                        <h2 className="text-xl font-bold text-gray-900">{category.name}</h2>
                        <span className="text-xs bg-gray-100 px-2 py-0.5 rounded text-gray-500">{categoryBacklinks.length}</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
                    {categoryBacklinks.map((backlink) => (
                      <BacklinkCard key={backlink.id} backlink={backlink} onDelete={handleDelete} onRefresh={fetchData} />
                    ))}
                  </div>
                </section>
              );
           })}
        </div>
      )}
    </div>
  );
}

function BacklinkCard({ backlink, onDelete, onRefresh }: { backlink: any, onDelete: (id: string) => void, onRefresh: () => void }) {
  const copyToClipboard = (text: string, type: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${type} copied to clipboard`);
  };

  return (
    <Card className="group relative overflow-hidden hover:shadow-md transition-all border-gray-200 bg-white hover:border-blue-200 h-14">
      <div className="flex items-center h-full px-3 gap-3">
        {/* Main Link Overlay */}
        <a href={backlink.url} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-0" aria-label={`Open ${backlink.website_name}`}>
          <span className="sr-only">Open {backlink.website_name}</span>
        </a>

        {/* Icon (Generic Globe or Link) */}
        <div className="p-2 rounded-lg bg-blue-50 text-blue-600 shrink-0 relative z-10 pointer-events-none">
          <Globe className="w-4 h-4" />
        </div>
        
        {/* Name & URL */}
        <div className="flex-1 min-w-0 relative z-10 pointer-events-none">
          <h3 className="font-bold text-gray-900 text-xs truncate leading-tight group-hover:text-blue-600 transition-colors uppercase">{backlink.website_name}</h3>
          <div className="text-[9px] text-gray-400 truncate leading-tight">
            {backlink.url.replace(/^https?:\/\//, '')}
          </div>
        </div>

        {/* Actions Area */}
        <div className="flex items-center gap-1.5 shrink-0 relative z-20">
           {/* Global Credentials (Peek) */}
           <div className="flex flex-col gap-0.5">
             {backlink.global_username && (
               <button 
                 onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyToClipboard(backlink.global_username, "Username"); }}
                 className="flex items-center gap-1 px-1 py-0.5 rounded bg-gray-50 hover:bg-gray-100 border border-gray-100 text-[8px] text-gray-500 transition-colors"
                 title={`Copy Global User: ${backlink.global_username}`}
               >
                 <User className="w-2 h-2" />
                 <span className="max-w-[40px] truncate">{backlink.global_username}</span>
               </button>
             )}
             {backlink.global_password && (
               <button 
                 onClick={(e) => { e.preventDefault(); e.stopPropagation(); copyToClipboard(backlink.global_password, "Password"); }}
                 className="flex items-center gap-1 px-1 py-0.5 rounded bg-blue-50/50 hover:bg-blue-100/50 border border-blue-100/30 text-[8px] text-blue-600 transition-colors"
                 title={`Copy Global Pass: ${backlink.global_password}`}
               >
                 <Lock className="w-2 h-2" />
                 <span className="max-w-[40px] truncate">********</span>
               </button>
             )}
           </div>

          {/* Edit/Settings Dropdown */}
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
                       <Plus className="w-3.5 h-3.5" /> Edit Source
                    </DropdownMenuItem>
                  }/>
                  <DropdownMenuItem className="text-xs text-red-600 gap-2" onClick={(e) => { e.stopPropagation(); onDelete(backlink.id); }}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <EditBacklinkDialog backlink={backlink} onBacklinkSaved={onRefresh} />
            </Dialog>
          </div>

          {/* Rank Badge */}
          <div className="bg-gray-50 text-[10px] font-bold px-1.5 py-0.5 rounded border border-gray-200 text-gray-400 shadow-sm shrink-0 pointer-events-none">
             #{backlink.rank || 0}
          </div>
        </div>
      </div>
    </Card>
  );
}
