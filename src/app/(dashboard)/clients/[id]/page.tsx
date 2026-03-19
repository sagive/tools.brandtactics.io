"use client";

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, Loader2, CheckCircle2, CircleDot, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

export default function ClientOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    type: "",
    monthlyFee: "",
    status: "Active",
    description: ""
  });
  const [joinDate, setJoinDate] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [data, setData] = useState<{
    isLoading: boolean;
  }>({
    isLoading: true
  });

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: clientData, error } = await supabase
          .from("clients")
          .select("*")
          .eq("id", id)
          .single();
          
        if (clientData) {
          setFormData({
            name: clientData.name || "",
            website: clientData.website || "",
            contactName: clientData.contact_name || "",
            contactEmail: clientData.contact_email || "",
            contactPhone: clientData.contact_phone || "",
            type: clientData.type || "",
            monthlyFee: clientData.monthly_fee !== null && clientData.monthly_fee !== undefined ? clientData.monthly_fee.toString() : "0",
            status: clientData.status || "Active",
            description: clientData.description || ""
          });
          if (clientData.created_at) {
             setJoinDate(format(new Date(clientData.created_at), "MMM d, yyyy"));
          }
        }

        setData({
          isLoading: false
        });
      } catch (error) {
        console.error("Error fetching client data:", error);
        setData(prev => ({ ...prev, isLoading: false }));
      }
    }

    fetchData();
  }, [id]);

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
        status: formData.status,
        description: formData.description
      })
      .eq("id", id);

    setIsSaving(false);
    
    if (error) {
      toast.error("Failed to save: " + error.message);
      return;
    }
    
    setIsDirty(false);
    toast.success("Client details updated successfully.");
  };

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const inputClasses = "h-auto px-2 py-1 -ml-2 w-full bg-transparent hover:bg-gray-50 border-transparent hover:border-gray-200 focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-medium text-gray-900 shadow-none";

  return (
    <div className="w-full">
      <Card className="shadow-sm relative overflow-hidden">
        {isDirty && (
           <div className="absolute top-0 inset-x-0 h-1 bg-yellow-400 animate-pulse" />
        )}
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-2xl shrink-0">
                {(formData.name || "UN").substring(0,2).toUpperCase()}
              </div>
              <div className="space-y-1">
                 <Input 
                   name="name" 
                   value={formData.name || ""} 
                   onChange={handleChange} 
                   className={cn(inputClasses, "text-2xl font-bold tracking-tight h-auto py-0")} 
                   placeholder="Client Name"
                 />
                 <div className="flex items-center">
                   <span className="text-gray-400 text-sm pl-2">https://</span>
                   <Input 
                     name="website" 
                     value={formData.website} 
                     onChange={handleChange} 
                     className={cn(inputClasses, "text-sm text-blue-600 border-none font-normal pl-0 ml-0 hover:bg-transparent placeholder:text-gray-300")} 
                     placeholder="www.example.com"
                   />
                 </div>
              </div>
            </div>
            
            <Select 
              value={formData.status} 
              onValueChange={(value) => {
                setFormData({ ...formData, status: value || "Active" });
                setIsDirty(true);
              }}
            >
              <SelectTrigger className={cn(
                "w-32 h-10 text-xs font-bold uppercase tracking-wider rounded-full border-none shadow-none focus:ring-0",
                formData.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-700"
              )}>
                <div className="flex items-center gap-2">
                  {formData.status === "Active" ? <CheckCircle2 className="w-4 h-4" /> : <CircleDot className="w-4 h-4" />}
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active" className="text-xs font-bold uppercase tracking-wider text-green-700">Active</SelectItem>
                <SelectItem value="Archived" className="text-xs font-bold uppercase tracking-wider text-gray-500">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Contact Details</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-gray-500 font-medium text-[11px] uppercase tracking-wider w-1/3">Contact</div>
                  <div className="w-2/3 flex items-center border border-gray-200 rounded-md bg-white hover:border-gray-300 transition-colors px-3 h-10">
                    <Input name="contactName" value={formData.contactName} onChange={handleChange} placeholder="Contact Name" className="border-none shadow-none focus-visible:ring-0 p-0 h-full text-sm font-medium bg-transparent flex-1" />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-gray-500 font-medium text-[11px] uppercase tracking-wider w-1/3">Phone</div>
                  <div className="w-2/3 flex items-center border border-gray-200 rounded-md bg-white hover:border-gray-300 transition-colors px-3 h-10">
                    <Input name="contactPhone" value={formData.contactPhone} onChange={handleChange} placeholder="Phone Number" className="border-none shadow-none focus-visible:ring-0 p-0 h-full text-sm font-medium text-gray-700 bg-transparent flex-1" />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Agreement</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-gray-500 font-medium text-[11px] uppercase tracking-wider w-1/3">Type</div>
                  <div className="w-2/3 border border-gray-200 rounded-md bg-white hover:border-gray-300 transition-colors h-10">
                    <Select 
                      value={formData.type || ""} 
                      onValueChange={(value) => {
                        setFormData({ ...formData, type: value || "" });
                        setIsDirty(true);
                      }}
                    >
                      <SelectTrigger className="border-none shadow-none focus:ring-0 bg-transparent h-full text-sm font-medium">
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
                  <div className="text-gray-500 font-medium text-[11px] uppercase tracking-wider w-1/3">Fee/mo ($)</div>
                  <div className="w-2/3 flex items-center border border-gray-200 rounded-md bg-white hover:border-gray-300 transition-colors px-3 h-10">
                    <Input 
                      name="monthlyFee" 
                      type="number" 
                      min="0"
                      value={formData.monthlyFee} 
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormData({ ...formData, monthlyFee: val === '' ? '0' : val });
                        setIsDirty(true);
                      }}
                      className="border-none shadow-none focus-visible:ring-0 p-0 h-full text-sm font-medium bg-transparent flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" 
                    />
                    <span className="text-gray-400 text-xs font-medium uppercase ml-2">usd</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="pt-6 border-t border-gray-100 mb-8 space-y-2">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Client Description</h3>
            <p className="text-[11px] text-gray-500">Provide a brief overview of the client, which can be used by AI when generating content.</p>
            <div className="flex items-center border border-gray-200 rounded-md bg-white hover:border-gray-300 transition-colors h-24">
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  setIsDirty(true);
                }}
                placeholder="Client description..." 
                className="w-full h-full p-3 text-sm font-medium text-gray-700 bg-transparent border-none shadow-none resize-none focus-visible:outline-none focus-visible:ring-0" 
              />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 mb-8 space-y-2">
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Contact Emails</h3>
            <p className="text-[11px] text-gray-500">These emails would be used when sending seo updates, use multiple emails by seperating them with commas</p>
            <div className="flex items-center border border-gray-200 rounded-md bg-white hover:border-gray-300 transition-colors px-3 h-10">
              <Input name="contactEmail" value={formData.contactEmail} onChange={handleChange} placeholder="client1@example.com, client2@example.com" className="border-none shadow-none focus-visible:ring-0 p-0 h-full text-sm font-medium text-gray-700 bg-transparent flex-1" />
            </div>
          </div>

          <div className="flex items-center justify-between pt-6 border-t border-gray-100">
            <div className="text-xs text-gray-400">
              {joinDate ? `Joined ${joinDate}` : ""}
            </div>
            
            {isDirty && (
              <Button 
                onClick={handleSave} 
                disabled={isSaving}
                className="bg-green-600 hover:bg-green-700 text-white min-w-[140px]"
              >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
