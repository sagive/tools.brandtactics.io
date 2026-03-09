"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, MoreHorizontal, Trash2 } from "lucide-react";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

export default function ClientsPage() {
  const router = useRouter();
  const [search, setSearch] = React.useState("");
  const [clients, setClients] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isCreating, setIsCreating] = React.useState(false);

  async function fetchClients() {
    setIsLoading(true);
    const { data } = await supabase.from("clients").select("*").order("name");
    if (data) setClients(data);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchClients();
  }, []);

  const filteredClients = clients.filter(c => 
    (c.name || "").toLowerCase().includes(search.toLowerCase())
  );

  const handleNewClient = async () => {
    setIsCreating(true);
    const { data, error } = await supabase
      .from("clients")
      .insert([{ name: "New Client", monthly_fee: 0 }])
      .select()
      .single();
      
    if (error) {
      toast.error("Failed to create client: " + error.message);
      setIsCreating(false);
      return;
    }
    
    if (data) {
      toast.success("Created new client.");
      router.push(`/clients/${data.id}`);
    }
  };

  const handleDeleteClient = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name}?`)) return;
    
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete: " + error.message);
    } else {
      toast.success(`Client ${name} has been deleted.`);
      fetchClients();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">All Clients</h1>
          <p className="text-gray-500 mt-1">Manage all your agency's clients here.</p>
        </div>
        <Button 
          onClick={handleNewClient} 
          disabled={isCreating}
          className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
        >
          <Plus className="w-4 h-4 mr-2" /> {isCreating ? "Creating..." : "New Client"}
        </Button>
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Search clients..."
            className="pl-8 bg-white"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-gray-500 py-10">Loading clients...</div>
      ) : filteredClients.length === 0 ? (
        <div className="text-gray-500 text-center py-20 bg-white border border-dashed rounded-lg">
           <h3 className="text-lg font-medium text-gray-900">No clients found</h3>
           <p className="mt-1">Click "New Client" to add your first client into the system.</p>
           <Button onClick={handleNewClient} disabled={isCreating} className="mt-4 bg-blue-600">
             <Plus className="w-4 h-4 mr-2" /> New Client
           </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-md transition-shadow relative group">
              <div className="absolute top-4 right-4 z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-8 w-8 text-gray-400 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <MoreHorizontal className="w-4 h-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="cursor-pointer font-medium" onClick={() => router.push(`/clients/${client.id}`)}>
                      View Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer" onClick={() => handleDeleteClient(client.id, client.name)}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete Client
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              
              <Link href={`/clients/${client.id}`} className="block">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shrink-0">
                      {(client.name || "UN").substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-gray-900 leading-tight">
                        {client.name || "Unnamed Client"}
                      </h3>
                      <p className="text-sm text-gray-500 mt-1">{client.contact_email || "No email"}</p>
                      <div className="mt-4 flex items-center gap-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20`}>
                          Active
                        </span>
                        <span className="text-sm font-medium text-gray-700">
                          ${(client.monthly_fee || 0).toLocaleString()}/mo
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
