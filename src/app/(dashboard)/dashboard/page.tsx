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
import { Send, Blocks, ChartNoAxesCombined, MousePointerClick, TrendingUp } from "lucide-react";

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

  const filteredTools = filter === "All" ? TOOLS : TOOLS.filter(t => t.category === filter);

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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Email Form Section */}
        <div className="lg:col-span-1">
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">Send SEO Update to Client</CardTitle>
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
                      <SelectItem value="1">Acme Corp</SelectItem>
                      <SelectItem value="2">Globex</SelectItem>
                      <SelectItem value="3">Initech</SelectItem>
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
