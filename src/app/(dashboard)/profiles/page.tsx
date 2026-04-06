"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Trash2, Edit2, User, MapPin, Key, Globe, MoreVertical, Loader2, Users, ExternalLink, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  name: string;
  address: string;
  gender: string;
  image_url: string;
  rank: number;
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
    const { data, error } = await supabase
      .from("profiles_data")
      .select("*")
      .order("rank", { ascending: true })
      .order("created_at", { ascending: false });
    
    if (error) {
      console.error("Error fetching profiles:", error);
      toast.error("Failed to load profiles");
    } else {
      setProfiles(data || []);
    }
    setIsLoading(false);
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
    (p.address && p.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 rounded-2xl p-2.5 shadow-lg shadow-blue-200">
              <Users className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Profiles</h1>
          </div>
          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] translate-x-1">Manage user personas & credentials</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group min-w-[300px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors group-focus-within:text-blue-500" />
            <Input 
              placeholder="Search by name or address..." 
              className="pl-11 h-12 rounded-2xl bg-gray-50/50 border-gray-100 focus:bg-white focus:ring-4 focus:ring-blue-100/50 transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button 
            onClick={handleAdd} 
            className="h-12 bg-blue-600 hover:bg-blue-700 rounded-2xl px-6 shadow-lg shadow-blue-100 font-bold transition-all hover:-translate-y-0.5 active:translate-y-0"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Persona
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-3xl border border-gray-100 border-dashed">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-4" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Loading personas...</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-[500px] bg-white rounded-3xl border border-gray-100 border-dashed p-8 text-center">
          <div className="bg-gray-50 p-6 rounded-full mb-6">
            <Users className="w-12 h-12 text-gray-200" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">No personas found</h3>
          <p className="text-gray-500 max-w-sm mb-8">Start by creating your first user profile. You can store their details and multiple social or web app credentials.</p>
          <Button onClick={handleAdd} size="lg" className="bg-blue-600 hover:bg-blue-700 rounded-2xl px-8 shadow-lg shadow-blue-100">
            Create First Profile
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProfiles.map((profile) => (
            <Card key={profile.id} className="group relative overflow-hidden bg-white rounded-[2.5rem] border-transparent hover:border-blue-100 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-50/50 border shadow-sm">
              <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100">
                <DropdownMenu>
                  <DropdownMenuTrigger>
                    <Button variant="secondary" size="icon" className="h-9 w-9 rounded-xl bg-white/90 backdrop-blur-md shadow-sm border border-gray-100">
                      <MoreVertical className="w-4 h-4 text-gray-600" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-2xl p-1.5 shadow-xl border-gray-100">
                    <DropdownMenuItem onClick={() => handleEdit(profile)} className="rounded-xl py-2.5 cursor-pointer font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50">
                      <Edit2 className="w-4 h-4 mr-3" /> Edit Persona
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDelete(profile.id)} className="rounded-xl py-2.5 cursor-pointer font-medium text-red-600 hover:bg-red-50">
                      <Trash2 className="w-4 h-4 mr-3" /> Delete Persona
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <CardContent className="p-0">
                {/* Header Image Area */}
                <div className="relative h-40 bg-gray-50 flex items-end justify-center perspective-1000">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/30" />
                  <div className="relative w-32 h-32 rounded-3xl border-4 border-white shadow-xl bg-gray-100 overflow-hidden -mb-10 transition-transform duration-500 group-hover:scale-105">
                    {profile.image_url ? (
                      <img src={profile.image_url} alt={profile.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-blue-50">
                        <User className="w-12 h-12 text-blue-200" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Content Area */}
                <div className="pt-14 pb-8 px-8 text-center space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-extrabold text-gray-900 group-hover:text-blue-600 transition-colors">{profile.name}</h3>
                    <div className="flex items-center justify-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest truncate max-w-[150px]">
                        {profile.address || "No Address Set"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2">
                    <Badge variant="secondary" className={cn(
                      "rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                      profile.gender === "male" ? "bg-blue-50 text-blue-600" : 
                      profile.gender === "female" ? "bg-pink-50 text-pink-600" : 
                      "bg-gray-50 text-gray-600"
                    )}>
                      {profile.gender}
                    </Badge>
                  </div>
                </div>
              </CardContent>

              <CardFooter className="px-8 pb-8 pt-0">
                <Button 
                  onClick={() => handleEdit(profile)}
                  variant="outline" 
                  className="w-full h-11 rounded-2xl border-gray-100 text-gray-600 font-bold hover:bg-blue-50 hover:text-blue-600 hover:border-blue-100 transition-all flex items-center justify-center gap-2 group/btn"
                >
                  <Key className="w-4 h-4 text-gray-400 group-hover/btn:text-blue-500 transition-colors" />
                  View Credentials
                  <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover/btn:opacity-100 group-hover/btn:translate-x-0 transition-all" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Quick Add Dialog */}
      <Dialog open={isQuickAddOpen} onOpenChange={setIsQuickAddOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
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
                className="h-12 bg-gray-50/50 border-gray-100 rounded-2xl text-sm font-medium focus:bg-white transition-all"
                onKeyDown={(e) => e.key === 'Enter' && handleQuickCreate()}
                autoFocus
              />
            </div>
            <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
              You can add their address, photo, and accounts on the next page.
            </p>
          </div>
          <DialogFooter className="p-8 pt-0 flex gap-2">
            <Button variant="ghost" onClick={() => setIsQuickAddOpen(false)} className="rounded-xl font-bold">Cancel</Button>
            <Button onClick={handleQuickCreate} disabled={isCreating} className="bg-blue-600 hover:bg-blue-700 rounded-xl px-8 shadow-lg shadow-blue-100 font-bold flex-1 h-12">
              {isCreating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Persona
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
