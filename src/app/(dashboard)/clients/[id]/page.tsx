"use client";

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronRight, Loader2, CheckCircle2, CircleDot, Save, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import ClientResources from "@/components/client-resources";
import ClientGallery from "@/components/client-gallery";
import ClientSocials from "@/components/client-socials";
import { useAuth } from "@/components/auth-provider";

export default function ClientOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  
  // ... (rest of states)
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
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-6">
        {/* Socials & Resources */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ClientSocials clientId={id} />
          <ClientResources clientId={id} />
        </div>

        {/* Gallery */}
        <ClientGallery clientId={id} />
      </div>
    </div>
  );
}
