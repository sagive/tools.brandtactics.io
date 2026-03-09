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
import { Send, Blocks, ChartNoAxesCombined, MousePointerClick, TrendingUp, Search } from "lucide-react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useEffect } from "react";

// Tools Mock Data
const TOOLS = [
  { name: "Google Analytics", icon: ChartNoAxesCombined, category: "Analytics", color: "text-orange-500", bg: "bg-orange-100" },
  { name: "Google Search Console", icon: SearchIcon, category: "SEO", color: "text-blue-500", bg: "bg-blue-100" },
  { name: "Ahrefs", icon: TrendingUp, category: "SEO", color: "text-red-500", bg: "bg-red-100" },
  { name: "Figma", icon: Blocks, category: "Design", color: "text-purple-500", bg: "bg-purple-100" },
  { name: "Mailchimp", icon: Send, category: "Marketing", color: "text-yellow-500", bg: "bg-yellow-100" },
  { name: "HubSpot", icon: MousePointerClick, category: "Marketing", color: "text-orange-600", bg: "bg-orange-50" },
];

function SearchIcon(props: any) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

export default function DashboardPage() {
  const [clientId, setClientId] = useState("");
  const [subject, setSubject] = useState("SEO Update from BrandTactics");
  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [filter, setFilter] = useState("All");
  
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState("");

  useEffect(() => {
    async function fetchClients() {
      const { data } = await supabase.from("clients").select("id, name, contact_email").order("name");
      if (data) setClients(data);
    }
    fetchClients();
  }, []);

  const filteredTools = filter === "All" ? TOOLS : TOOLS.filter(t => t.category === filter);
  
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
    
    // Call the theoretical send email API Route
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, subject, body }),
      });
      
      if (!res.ok) throw new Error("Failed to send email");
      
      toast.success("Update sent successfully!");
      setBody("");
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Active Clients Mini-Widget */}
          <Card className="shadow-sm">
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Clients</CardTitle>
                <Link href="/clients" className="text-xs text-blue-600 hover:underline">View All</Link>
              </div>
              <div className="relative mt-2">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-500" />
                <Input
                  placeholder="Search clients..."
                  className="pl-8 h-8 text-sm bg-gray-50/50"
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[260px] overflow-y-auto">
                <ul className="divide-y divide-gray-100">
                  {filteredWidgetClients.length === 0 ? (
                    <div className="p-4 text-center text-sm text-gray-500">No clients found.</div>
                  ) : (
                    filteredWidgetClients.map(client => (
                      <li key={client.id} className="p-3 hover:bg-gray-50 transition-colors">
                        <Link href={`/clients/${client.id}`} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-blue-100 text-blue-700 flex items-center justify-center font-semibold text-xs shrink-0">
                            {(client.name || "UN").substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium text-gray-900 truncate">{client.name}</div>
                            {client.contact_email && <div className="text-xs text-gray-500 truncate">{client.contact_email}</div>}
                          </div>
                        </Link>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Email Form Section */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4 border-b mb-4">
              <CardTitle className="text-lg">Send SEO Update</CardTitle>
              <CardDescription>Rapidly send status updates and reports.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSendUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Client</Label>
                  <Select value={clientId} onValueChange={(val) => setClientId(val || "")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select shortcode/client" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message Body</Label>
                  <Textarea 
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Hello, here are your latest metrics..." 
                    className="min-h-[150px] resize-none"
                  />
                </div>

                <Button type="submit" disabled={sending} className="w-full bg-blue-600 hover:bg-blue-700">
                  <Send className="w-4 h-4 mr-2" />
                  {sending ? "Sending..." : "Send Update"}
                </Button>
                
                <p className="text-xs text-center text-gray-500 mt-4">
                  Last update sent: {new Date().toLocaleDateString()}
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Tools Section */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900">Agency Tools</h2>
          </div>

          <Tabs defaultValue="All" value={filter} onValueChange={setFilter} className="w-full">
            <TabsList className="bg-gray-100/50 mb-4 inline-flex flex-wrap h-auto p-1">
              <TabsTrigger value="All" className="data-[state=active]:bg-white">All</TabsTrigger>
              <TabsTrigger value="SEO" className="data-[state=active]:bg-white">SEO</TabsTrigger>
              <TabsTrigger value="Analytics" className="data-[state=active]:bg-white">Analytics</TabsTrigger>
              <TabsTrigger value="Design" className="data-[state=active]:bg-white">Design</TabsTrigger>
              <TabsTrigger value="Marketing" className="data-[state=active]:bg-white">Marketing</TabsTrigger>
            </TabsList>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {filteredTools.map((tool) => (
                <Card key={tool.name} className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer group">
                  <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                    <div className={`p-4 rounded-full ${tool.bg} ${tool.color} group-hover:scale-110 transition-transform`}>
                      <tool.icon className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{tool.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{tool.category}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </Tabs>

        </div>
      </div>
    </div>
  );
}
