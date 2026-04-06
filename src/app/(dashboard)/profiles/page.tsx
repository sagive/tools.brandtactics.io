"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit2, User, MapPin, Key, Globe, MoreVertical, Loader2, Users, ExternalLink, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface Profile {
  id: string;
  name: string;
  address: string;
  gender: string;
  image_url: string;
  rank: number;
  gmail?: string;
}

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    setIsLoading(true);
    try {
      // Fetch profiles with their credentials and site info
      const { data, error } = await supabase
        .from("profiles_data")
        .select(`
          *,
          profile_credentials (
            username,
            profile_sites (name)
          )
        `)
        .order("rank", { ascending: true })
        .order("created_at", { ascending: false });
      
      if (error) throw error;

      // Extract Gmail if it exists for each profile
      const processedProfiles = (data || []).map((p: any) => {
        const gmailCred = p.profile_credentials?.find((c: any) => 
          c.profile_sites?.name?.toLowerCase() === "gmail" || 
          c.username?.includes("@gmail.com")
        );
        return {
          ...p,
          gmail: gmailCred?.username
        };
      });

      setProfiles(processedProfiles);
    } catch (error: any) {
      console.error("Error fetching profiles:", error);
      toast.error("Failed to load profiles");
    } finally {
      setIsLoading(false);
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this profile? All associated credentials will also be removed.")) return;

    const { error } = await supabase
      .from("profiles_data")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete profile");
    } else {
      toast.success("Profile deleted");
      fetchProfiles();
    }
  };

  const handleEdit = (profile: Profile) => {
    router.push(`/profiles/${profile.id}`);
  };

  const handleAdd = () => {
    setNewName("");
    setIsQuickAddOpen(true);
  };

  const handleQuickCreate = async () => {
    if (!newName.trim()) {
      toast.error("Please enter a name");
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from("profiles_data")
        .insert([{ name: newName.trim(), gender: "male" }])
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Persona created!");
      setIsQuickAddOpen(false);
      router.push(`/profiles/${data.id}`);
    } catch (error: any) {
      toast.error("Failed to create: " + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const filteredProfiles = profiles.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (p.gmail && p.gmail.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-sm border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded p-1.5 shadow-lg shadow-blue-200">
              <Users className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">
              Profiles <span className="text-gray-400 font-medium ml-1 text-base">({profiles.length})</span>
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group min-w-[240px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
            <Input 
              placeholder="Search personas..." 
              className="pl-11 h-10 rounded-sm bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-2 focus:ring-blue-100/50 transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleAdd} 
            className="h-10 bg-blue-600 hover:bg-blue-700 rounded-sm px-6 shadow-lg shadow-blue-100 font-bold transition-all hover:-translate-y-0.5 active:translate-y-0 text-sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Persona
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-sm border border-gray-100 border-dashed">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading personas...</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-sm border border-gray-100 border-dashed p-8 text-center">
          <div className="bg-gray-50 p-6 rounded-full mb-6">
            <Users className="w-12 h-12 text-gray-200" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No personas found</h3>
          <p className="text-gray-500 max-w-sm mb-8">Start by creating your first user profile. You can store their details and multiple social or web app credentials.</p>
          <Button onClick={handleAdd} size="lg" className="bg-blue-600 hover:bg-blue-700 rounded-sm px-8 shadow-lg shadow-blue-100">
            Create First Profile
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className="group relative overflow-hidden bg-white rounded-sm border-transparent hover:border-blue-100 transition-all duration-300 hover:shadow-xl border shadow-sm flex flex-col cursor-pointer">
              <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                <DropdownMenu>
                  <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
                    <Button variant="secondary" size="icon" className="h-7 w-7 rounded-sm bg-white/90 backdrop-blur-md shadow-sm border border-gray-100">
                      <MoreVertical className="w-3.5 h-3.5 text-gray-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-sm p-1 shadow-xl border-gray-100">
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleEdit(profile); }} className="rounded-sm py-2 cursor-pointer font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50">
                      <Edit2 className="w-4 h-4 mr-3" /> Edit Persona
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDelete(profile.id); }} className="rounded-sm py-2 cursor-pointer font-medium text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4 mr-3" /> Delete Persona
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <Link href={`/profiles/${profile.id}`} className="flex-1 flex flex-col">
                <CardContent className="p-0 flex-1 flex flex-col">
                  {/* Header Image Area */}
                  <div className="relative w-full aspect-square bg-gray-100 overflow-hidden group-hover:scale-101 transition-transform duration-500">
                    {profile.image_url ? (
                      <img src={profile.image_url} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-50">
                        <User className="w-10 h-10 text-blue-200" />
                      </div>
                    )}
                  </div>

                  {/* Content Area */}
                  <div className="p-3 text-center space-y-0.5">
                    <h3 className="text-[11px] font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight truncate px-1">
                      {profile.name}
                    </h3>
                    {profile.gmail && (
                      <p className="text-[9px] font-bold text-gray-400 truncate px-1">
                        {profile.gmail}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Add Dialog */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-md rounded-sm border-none shadow-2xl p-0 overflow-hidden">
          <DialogHeader className="p-8 pb-4">
            <DialogTitle className="text-2xl font-black text-gray-900 tracking-tight">New Persona</DialogTitle>
          </DialogHeader>
          <div className="p-8 pt-2 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-gray-400 tracking-widest pl-1">What's their name?</Label>
              <Input 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. John Doe" 
                className="h-12 bg-gray-50/50 border-gray-100 rounded-sm text-sm font-medium focus:bg-white transition-all shadow-none"
                onKeyDown={(e) => e.key === 'Enter' && handleQuickCreate()}
                autoFocus
              />
            </div>
            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
              You can add their address, photo, and accounts on the next page.
            </p>
          </div>
          <DialogFooter className="p-8 pt-0 flex gap-2">
            <Button variant="ghost" onClick={() => setIsQuickAddOpen(false)} className="rounded-sm font-bold">Cancel</Button>
            <Button onClick={handleQuickCreate} disabled={isCreating} className="bg-blue-600 hover:bg-blue-700 rounded-sm px-8 shadow-lg shadow-blue-100 font-bold flex-1 h-12">
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Persona
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
