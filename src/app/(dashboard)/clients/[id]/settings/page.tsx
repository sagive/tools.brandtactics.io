"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, CheckCircle2, CircleDot, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { format } from "date-fns";

import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface ClientManager {
  managerId: string;
  managerFee: string;
  roleDescription: string;
}

export default function ClientSettings({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  
  const [formData, setFormData] = useState({
    name: "",
    website: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    type: "",
    monthlyFee: "",
    status: "Active",
    managerId: "",
    managerFee: "",
    managerNotes: "",
    articleCategories: "",
    hideLogoInPreview: false,
    customLogoText: "",
    customBottomText: ""
  });
  const [clientManagers, setClientManagers] = useState<ClientManager[]>([]);
  const [joinDate, setJoinDate] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [clientRes, usersRes] = await Promise.all([
          supabase.from("clients").select("*").eq("id", id).single(),
          supabase.from("users").select("id, full_name, email").order("full_name")
        ]);
          
        const clientData = clientRes.data;
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
            managerId: clientData.manager_id || "",
            managerFee: clientData.manager_fee !== null && clientData.manager_fee !== undefined ? clientData.manager_fee.toString() : "0",
            managerNotes: clientData.manager_notes || "",
            articleCategories: clientData.article_categories || "",
            hideLogoInPreview: clientData.hide_logo_in_preview || false,
            customLogoText: clientData.custom_logo_text || "",
            customBottomText: clientData.custom_bottom_text || ""
          });

          let parsedManagers: ClientManager[] = [];
          if (clientData.client_managers && Array.isArray(clientData.client_managers)) {
            parsedManagers = clientData.client_managers.map((m: any) => ({
              managerId: m.manager_id || "",
              managerFee: m.manager_fee !== null && m.manager_fee !== undefined ? m.manager_fee.toString() : "0",
              roleDescription: m.role_description || ""
            }));
          } else if (clientData.manager_id) {
            parsedManagers = [{
              managerId: clientData.manager_id,
              managerFee: clientData.manager_fee !== null && clientData.manager_fee !== undefined ? clientData.manager_fee.toString() : "0",
              roleDescription: "Account Manager"
            }];
          }
          setClientManagers(parsedManagers);

          if (clientData.created_at) {
             setJoinDate(format(new Date(clientData.created_at), "MMM d, yyyy"));
          }
        }
        if (usersRes.data) setUsers(usersRes.data);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching client data:", error);
        setIsLoading(false);
      }
    }
    fetchData();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setIsDirty(true);
  };

  const handleAddManagerRow = () => {
    setClientManagers([
      ...clientManagers,
      { managerId: "", managerFee: "0", roleDescription: "" }
    ]);
    setIsDirty(true);
  };

  const handleRemoveManagerRow = (index: number) => {
    setClientManagers(clientManagers.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleManagerRowChange = (index: number, field: keyof ClientManager, value: string) => {
    const updated = [...clientManagers];
    updated[index] = { ...updated[index], [field]: value };
    setClientManagers(updated);
    setIsDirty(true);
  };

  const handleSave = async () => {
    if (!isAdmin) return;
    setIsSaving(true);

    const managersToSave = clientManagers
      .filter(m => m.managerId && m.managerId !== "none")
      .map(m => ({
        manager_id: m.managerId,
        manager_fee: parseInt(m.managerFee) || 0,
        role_description: m.roleDescription
      }));
    
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
        manager_id: managersToSave[0]?.manager_id || null,
        manager_fee: managersToSave[0]?.manager_fee || 0,
        client_managers: managersToSave,
        manager_notes: formData.managerNotes,
        article_categories: formData.articleCategories || null,
        hide_logo_in_preview: formData.hideLogoInPreview,
        custom_logo_text: formData.customLogoText || null,
        custom_bottom_text: formData.customBottomText || null
      })
      .eq("id", id);

    setIsSaving(false);
    
    if (error) {
      toast.error("Failed to save: " + error.message);
      return;
    }
    
    setIsDirty(false);
    toast.success("Settings updated successfully.");
    // Force layout refresh for name/website
    window.location.reload();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <div className="p-10 text-center text-gray-500">You do not have permission to access this page.</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-lg font-bold text-gray-900">Client Settings</h2>
            <Select 
              value={formData.status} 
              onValueChange={(value) => {
                setFormData({ ...formData, status: value || "Active" });
                setIsDirty(true);
              }}
            >
              <SelectTrigger className="w-32 h-10 text-xs font-bold uppercase tracking-wider rounded-full border-gray-200 shadow-none focus:ring-0">
                <div className="flex items-center gap-2">
                  {formData.status === "Active" ? <CheckCircle2 className="w-4 h-4 text-green-600" /> : <CircleDot className="w-4 h-4 text-gray-400" />}
                  <SelectValue placeholder="Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active" className="text-xs font-bold uppercase tracking-wider text-green-700">Active</SelectItem>
                <SelectItem value="Archived" className="text-xs font-bold uppercase tracking-wider text-gray-500">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {/* Field: Client Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Client Name</label>
              <Input name="name" value={formData.name} onChange={handleChange} className="h-10" />
            </div>

            {/* Field: Website URL */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Website URL</label>
              <Input name="website" value={formData.website} onChange={handleChange} placeholder="www.example.com" className="h-10" />
            </div>

            {/* Field: Agreement Type */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Agreement Type</label>
              <Select 
                value={formData.type || ""} 
                onValueChange={(value) => {
                  setFormData({ ...formData, type: value || "" });
                  setIsDirty(true);
                }}
              >
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Retainer">Retainer</SelectItem>
                  <SelectItem value="Prepaid hours">Prepaid hours</SelectItem>
                  <SelectItem value="Our site">Our site</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Field: Monthly Fee */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Monthly Fee ($)</label>
              <div className="relative">
                <Input 
                  name="monthlyFee" 
                  type="number" 
                  value={formData.monthlyFee} 
                  onChange={handleChange} 
                  className="h-10 pr-12" 
                />
                <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">USD</span>
              </div>
            </div>

            {/* Field: Contact Name */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Contact Name</label>
              <Input name="contactName" value={formData.contactName} onChange={handleChange} className="h-10" />
            </div>

            {/* Field: Contact Phone */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Contact Phone</label>
              <Input name="contactPhone" value={formData.contactPhone} onChange={handleChange} className="h-10" />
            </div>

            {/* Field: Notification Emails (Spans full row or just 1 col?) */}
            <div className="space-y-1 lg:col-span-3">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Notification Emails</label>
              <p className="text-[11px] text-gray-400 mb-1.5">Comma separated list of emails for SEO updates</p>
              <Input name="contactEmail" value={formData.contactEmail} onChange={handleChange} className="h-10" />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8 mt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Client Managers</h3>
                <p className="text-[11px] text-gray-400 mt-1">Assign team members, their fees, and role descriptions for this client.</p>
              </div>
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={handleAddManagerRow}
                className="text-blue-600 border-blue-200 hover:bg-blue-50/50 font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Manager
              </Button>
            </div>

            <div className="space-y-4 mb-6">
              {clientManagers.length === 0 ? (
                <div className="text-center py-6 border border-dashed border-gray-200 rounded-xl text-gray-400 text-xs">
                  No managers assigned yet. Click "Add Manager" to assign one.
                </div>
              ) : (
                clientManagers.map((mgr, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-gray-50/50 p-4 rounded-xl border border-gray-100 relative group">
                    {/* Field: Assigned Manager */}
                    <div className="space-y-1 md:col-span-4">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Assigned Manager</label>
                      <Select 
                        value={mgr.managerId || "none"} 
                        onValueChange={(val) => handleManagerRowChange(index, "managerId", val || "")}
                      >
                        <SelectTrigger className="h-10 w-full bg-white">
                          <SelectValue placeholder="Select manager">
                            {mgr.managerId && mgr.managerId !== "none"
                              ? (users.find(u => u.id === mgr.managerId)?.full_name || users.find(u => u.id === mgr.managerId)?.email || mgr.managerId)
                              : undefined}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Manager</SelectItem>
                          {users.map(u => (
                            <SelectItem key={u.id} value={u.id}>{u.full_name || u.email}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Field: Manager Fee */}
                    <div className="space-y-1 md:col-span-3">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Manager Fee ($)</label>
                      <div className="relative">
                        <Input 
                          type="number" 
                          value={mgr.managerFee} 
                          onChange={(e) => handleManagerRowChange(index, "managerFee", e.target.value)} 
                          className="h-10 pr-12 bg-white" 
                        />
                        <span className="absolute right-3 top-2.5 text-xs font-bold text-gray-400">USD</span>
                      </div>
                    </div>

                    {/* Field: Role Description */}
                    <div className="space-y-1 md:col-span-4">
                      <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Manager Role Description</label>
                      <Input 
                        type="text" 
                        value={mgr.roleDescription} 
                        onChange={(e) => handleManagerRowChange(index, "roleDescription", e.target.value)} 
                        placeholder="e.g. Account Lead, SEO Support..."
                        className="h-10 bg-white" 
                      />
                    </div>

                    {/* Remove Action Button */}
                    <div className="md:col-span-1 flex justify-center pb-1">
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleRemoveManagerRow(index)}
                        className="text-gray-400 hover:text-red-600 hover:bg-red-50 h-8 w-8 rounded-lg transition-colors"
                        title="Remove Manager"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="grid grid-cols-1 gap-8">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Manager Notes</label>
                <Textarea 
                  name="managerNotes" 
                  value={formData.managerNotes} 
                  onChange={handleChange}
                  placeholder="Internal notes about manager performance or setup..."
                  className="min-h-[100px] resize-none"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8 mt-8">
            <h3 className="text-sm font-bold text-gray-900 mb-6 uppercase tracking-wider">Articles Settings</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-1 md:col-span-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Categories (one per line)</label>
                  <Textarea 
                    name="articleCategories" 
                    value={formData.articleCategories} 
                    onChange={handleChange}
                    placeholder="e.g.&#10;Marketing&#10;Sales&#10;Tech Support"
                    className="min-h-[120px] resize-y font-mono text-sm"
                  />
               </div>

               <div className="space-y-2 md:col-span-2 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="hide-logo" 
                      checked={formData.hideLogoInPreview} 
                      onCheckedChange={(checked) => {
                        setFormData({ ...formData, hideLogoInPreview: !!checked });
                        setIsDirty(true);
                      }} 
                    />
                    <label htmlFor="hide-logo" className="text-xs font-bold text-gray-700 cursor-pointer uppercase tracking-wider">
                      Hide BrandTactics Logo in Article Public Preview
                    </label>
                  </div>
               </div>

               {formData.hideLogoInPreview && (
                 <>
                   <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Custom Header text (leave empty for nothing)</label>
                      <Input 
                        name="customLogoText" 
                        value={formData.customLogoText} 
                        onChange={handleChange} 
                        placeholder="e.g. Zap"
                        className="h-10" 
                      />
                   </div>

                   <div className="space-y-1">
                      <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-1">Custom Footer text (leave empty for nothing)</label>
                      <Input 
                        name="customBottomText" 
                        value={formData.customBottomText} 
                        onChange={handleChange} 
                        placeholder="e.g. Shared by Zap Portal"
                        className="h-10" 
                      />
                   </div>
                 </>
               )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-8 border-t border-gray-100 mt-8">
              <div className="text-xs text-gray-400 italic">
                {joinDate ? `Client since ${joinDate}` : ""}
              </div>
              
              <Button 
                onClick={handleSave} 
                disabled={!isDirty || isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white min-w-[140px] font-bold"
              >
                  <Save className="w-4 h-4 mr-2" />
                  {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
