"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Search, 
  Mail, 
  Trash2, 
  Filter, 
  Calendar, 
  User, 
  ExternalLink,
  Check,
  ChevronsUpDown
} from "lucide-react";
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from "@/components/ui/popover";
import { 
  Command, 
  CommandEmpty, 
  CommandGroup, 
  CommandInput, 
  CommandItem, 
  CommandList 
} from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { format } from "date-fns";

export default function EmailUpdatesPage() {
  const [updates, setUpdates] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [openClientFilter, setOpenClientFilter] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    // Fetch updates with client names
    const { data: updatesData, error: updatesError } = await supabase
      .from("email_updates")
      .select(`
        *,
        clients (
          name
        )
      `)
      .order("sent_date", { ascending: false });

    if (updatesError) {
      toast.error("Failed to fetch email updates");
    } else {
      setUpdates(updatesData || []);
    }

    // Fetch clients for filter
    const { data: clientsData, error: clientsError } = await supabase
      .from("clients")
      .select("id, name")
      .order("name");

    if (!clientsError) {
      setClients(clientsData || []);
    }
    
    setIsLoading(false);
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this log entry?")) return;
    
    const { error } = await supabase
      .from("email_updates")
      .delete()
      .eq("id", id);

    if (error) {
      toast.error("Failed to delete log entry");
    } else {
      toast.success("Log entry deleted");
      setUpdates(updates.filter(u => u.id !== id));
    }
  };

  // Helper to strip HTML and truncate
  const getExcerpt = (html: string) => {
    const text = html.replace(/<[^>]*>/g, ' ');
    return text.length > 50 ? text.substring(0, 50) + "..." : text;
  };

  const filteredUpdates = updates.filter(update => {
    const matchesSearch = 
      update.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      update.recipient_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      update.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesClient = !selectedClientId || update.client_id === selectedClientId;
    
    return matchesSearch && matchesClient;
  });

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-outfit">Email Updates Log</h1>
          <p className="text-gray-500 mt-1">Track all SEO updates sent to your clients.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input 
            placeholder="Search by subject, email, or client..." 
            className="pl-9 bg-white" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Client Filter */}
        <div className="relative">
          <Popover open={openClientFilter} onOpenChange={setOpenClientFilter}>
            <PopoverTrigger render={
              <Button
                variant="outline"
                role="combobox"
                className={cn(
                  "w-full justify-between bg-white font-normal",
                  !selectedClientId && "text-muted-foreground"
                )}
              >
                <div className="flex items-center truncate">
                  <Filter className="w-3.5 h-3.5 mr-2 text-gray-400" />
                  {selectedClientId
                    ? clients.find((c) => c.id === selectedClientId)?.name
                    : "Filter by Client"}
                </div>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            }/>
            <PopoverContent className="w-[250px] p-0" align="start">
              <Command>
                <CommandInput placeholder="Search client..." />
                <CommandList>
                  <CommandEmpty>No client found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      onSelect={() => {
                        setSelectedClientId(null);
                        setOpenClientFilter(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          selectedClientId === null ? "opacity-100" : "opacity-0"
                        )}
                      />
                      All Clients
                    </CommandItem>
                    {clients.map((client) => (
                      <CommandItem
                        key={client.id}
                        value={client.name}
                        onSelect={() => {
                          setSelectedClientId(client.id);
                          setOpenClientFilter(false);
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            selectedClientId === client.id ? "opacity-100" : "opacity-0"
                          )}
                        />
                        {client.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <Button 
          variant="outline" 
          onClick={() => { setSearchTerm(""); setSelectedClientId(null); }}
          className="bg-white"
        >
          Reset Filters
        </Button>
      </div>

      <Card className="shadow-sm border-gray-200 overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50/50">
                <TableRow>
                  <TableHead className="w-[180px]">Date</TableHead>
                  <TableHead>Client / Recipient</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead className="max-w-[300px]">Content Excerpt</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center text-gray-500">
                      Loading updates...
                    </TableCell>
                  </TableRow>
                ) : filteredUpdates.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-48 text-center text-gray-500">
                      <Mail className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      No updates found matching your criteria.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUpdates.map((update) => (
                    <TableRow key={update.id} className="group hover:bg-gray-50/50 transition-colors">
                      <TableCell className="text-sm text-gray-600 font-medium">
                        <div className="flex items-center">
                          <Calendar className="w-3.5 h-3.5 mr-2 text-gray-400" />
                          {format(new Date(update.sent_date), "MMM d, yyyy • HH:mm")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <div className="text-sm font-bold text-gray-900 flex items-center">
                            <User className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                            {update.clients?.name || "Unknown Client"}
                          </div>
                          <div className="text-xs text-gray-500">{update.recipient_email}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm font-medium text-gray-800">
                        {update.title}
                      </TableCell>
                      <TableCell className="text-xs text-gray-500 italic max-w-[300px] truncate">
                        "{getExcerpt(update.body || "")}"
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={cn(
                          "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                          update.status === 'Delivered' ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                        )}>
                          {update.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="icon-sm" 
                          className="text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDelete(update.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
