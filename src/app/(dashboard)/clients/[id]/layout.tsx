"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2, Trash2, Save, Plus, CircleDot, Send } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { EditTaskDialog } from "@/components/edit-task-dialog";
import { SendSeoUpdateDialog } from "@/components/send-seo-update-dialog";

export default function ClientLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const pathname = usePathname();
  const clientId = React.use(params).id;

  const NAV_LINKS = [
    { href: `/clients/${clientId}`, label: "Overview" },
    { href: `/clients/${clientId}/tasks`, label: "Tasks" },
    { href: `/clients/${clientId}/keywords`, label: "SEO Data" },
    { href: `/clients/${clientId}/articles`, label: "Articles" },
    { href: `/clients/${clientId}/emails`, label: "Email Updates" },
  ];

  const [formData, setFormData] = useState({
    name: "",
    website: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    type: "",
    monthlyFee: "",
    status: "Active"
  });
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isNewTaskOpen, setIsNewTaskOpen] = useState(false);

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // alt + shift + 3
      if (e.altKey && e.shiftKey && e.key === "3") {
        e.preventDefault();
        setIsNewTaskOpen(true);
      }
    };
    
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  React.useEffect(() => {
    async function getClient() {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();
        
      if (data) {
        setFormData({
          name: data.name || "",
          website: data.website || "",
          contactName: data.contact_name || "",
          contactEmail: data.contact_email || "",
          contactPhone: data.contact_phone || "",
          type: data.type || "",
          monthlyFee: data.monthly_fee ? data.monthly_fee.toString() : "",
          status: data.status || "Active"
        });
      }
      setIsLoading(false);
    }
    getClient();
  }, [clientId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setIsDirty(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const { error } = await supabase
      .from("clients")
      .update({
        name: formData.name,
        website: formData.website,
        contact_name: formData.contactName,
        contact_email: formData.contactEmail,
        contact_phone: formData.contactPhone,
        type: formData.type,
        monthly_fee: parseInt(formData.monthlyFee) || 0,
        status: formData.status
      })
      .eq("id", clientId);

    setIsSaving(false);
    
    if (error) {
      toast.error("Failed to save: " + error.message);
      return;
    }
    
    setIsDirty(false);
    toast.success("Client details updated successfully.");
  };

  const inputClasses = "h-auto px-2 py-1 -ml-2 w-full bg-transparent hover:bg-gray-50 border-transparent hover:border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-gray-900 shadow-none";

  if (isLoading) {
    return <div className="p-10 flex justify-center text-gray-500">Loading client data...</div>;
  }

  return (
    <div className="space-y-6 pb-10">
      
      {/* Breadcrumb / Back Navigation */}
      <div className="flex items-center text-sm text-gray-500 font-medium">
        <Link href="/dashboard" className="flex items-center hover:text-blue-600 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Lobby
        </Link>
        <span className="mx-2">/</span>
        <span className="text-gray-900">{formData.name}</span>
      </div>

      <div className="flex flex-col xl:flex-row gap-6">
        
        {/* Left Sidebar: Client Info Card */}
        <div className="w-full xl:w-72 shrink-0 space-y-4">
          <Card className="shadow-sm relative overflow-hidden">
            {isDirty && (
               <div className="absolute top-0 inset-x-0 h-1 bg-yellow-400 animate-pulse" />
            )}
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl shrink-0">
                  {formData.name.substring(0,2).toUpperCase()}
                </div>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => {
                    setFormData({ ...formData, status: value || "Active" });
                    setIsDirty(true);
                  }}
                >
                  <SelectTrigger className={cn(
                    "w-28 h-8 text-[11px] font-bold uppercase tracking-wider rounded-full border-none shadow-none focus:ring-0",
                    formData.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
                  )}>
                    <div className="flex items-center gap-1.5">
                      {formData.status === "Active" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <CircleDot className="w-3.5 h-3.5" />}
                      <SelectValue placeholder="Status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active" className="text-xs font-bold uppercase tracking-wider text-green-700">Active</SelectItem>
                    <SelectItem value="Archived" className="text-xs font-bold uppercase tracking-wider text-gray-500">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="mb-6 space-y-1">
                 <Input 
                   name="name" 
                   value={formData.name || ""} 
                   onChange={handleChange} 
                   className={cn(inputClasses, "text-xl font-bold tracking-tight h-10")} 
                 />
                 <div className="flex items-center">
                   <span className="text-gray-400 text-sm pl-2">https://</span>
                   <Input 
                     name="website" 
                     value={formData.website} 
                     onChange={handleChange} 
                     className={cn(inputClasses, "text-sm text-blue-600 border-none font-normal pl-0 ml-0 hover:bg-transparent placeholder:text-gray-300")} 
                   />
                 </div>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <div className="text-gray-500 font-medium text-xs uppercase tracking-wider mb-1 px-2">Primary Contact</div>
                  <Input name="contactName" value={formData.contactName} onChange={handleChange} className={inputClasses} placeholder="Contact Name" />
                  <Input name="contactEmail" value={formData.contactEmail} onChange={handleChange} className={cn(inputClasses, "text-gray-500 font-normal")} placeholder="Email Address" />
                  <Input name="contactPhone" value={formData.contactPhone} onChange={handleChange} className={cn(inputClasses, "text-gray-500 font-normal")} placeholder="Phone Number" />
                </div>

                <div className="h-px bg-gray-100" />

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="text-gray-500 font-medium text-[10px] uppercase tracking-wider pl-2 w-1/3">Type</div>
                    <div className="w-2/3 border border-gray-200 rounded-md bg-white hover:border-gray-300 transition-colors">
                      <Select 
                        value={formData.type || ""} 
                        onValueChange={(value) => {
                          setFormData({ ...formData, type: value || "" });
                          setIsDirty(true);
                        }}
                      >
                        <SelectTrigger className="border-none shadow-none focus:ring-0 bg-transparent h-9 text-xs font-medium">
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Retainer">Retainer</SelectItem>
                          <SelectItem value="Prepaid hours">Prepaid hours</SelectItem>
                          <SelectItem value="Our site">Our site</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-gray-500 font-medium text-[10px] uppercase tracking-wider pl-2 w-1/3">Fee/mo ($)</div>
                    <div className="w-2/3 flex items-center border border-gray-200 rounded-md bg-white hover:border-gray-300 transition-colors px-3 h-9">
                      <Input 
                        name="monthlyFee" 
                        type="number" 
                        value={formData.monthlyFee} 
                        onChange={handleChange} 
                        className="border-none shadow-none focus-visible:ring-0 p-0 h-full text-xs font-medium bg-transparent flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                      />
                      <span className="text-gray-400 text-xs font-medium uppercase ml-2">usd</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-gray-100" />

                {isDirty && (
                  <div className="pt-4 mt-4 border-t border-gray-100">
                     <Button 
                       onClick={handleSave} 
                       disabled={isSaving}
                       className="w-full bg-green-600 hover:bg-green-700 text-white"
                     >
                        <Save className="w-4 h-4 mr-2" />
                        {isSaving ? "Saving..." : "Save Changes"}
                     </Button>
                  </div>
                )}

                <div className="h-px bg-gray-100" />
                
                <div className="text-xs text-gray-400 text-center pb-4">
                  Joined Oct 12, 2023
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Client Navigation Tabs and Actions */}
          <div className="flex justify-between items-center mb-6">
            <div className="bg-white border rounded-lg shadow-sm p-1.5 flex space-x-1 overflow-x-auto w-fit">
              {NAV_LINKS.map((link) => {
                const isActive = link.href === `/clients/${clientId}`
                  ? pathname === link.href
                  : pathname.startsWith(link.href);
                  
                return (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-md whitespace-nowrap transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700 shadow-sm ring-1 ring-blue-600/10"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>
            
            <div className="flex items-center gap-2">
              <SendSeoUpdateDialog 
                defaultClientId={clientId as string} 
                trigger={
                  <Button className="bg-blue-600 text-white hover:bg-blue-700 px-4 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 shadow-none border-0 cursor-pointer">
                    <Send className="w-4 h-4 mr-2" /> SEO Updates
                  </Button>
                }
              />
              
              <Dialog open={isNewTaskOpen} onOpenChange={setIsNewTaskOpen}>
                <DialogTrigger className="bg-blue-600 text-white hover:bg-blue-700 px-4 inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 cursor-pointer shadow-none border-0">
                  <Plus className="w-4 h-4 mr-2" /> Task
                </DialogTrigger>
                <EditTaskDialog defaultClientId={clientId} onTaskCreated={() => {
                  window.dispatchEvent(new Event("taskCreated"));
                  setIsNewTaskOpen(false);
                }} />
              </Dialog>
            </div>
          </div>

          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
