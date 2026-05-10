"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Mail, Lock, User, Users, Trash2, Plus, FileText, RotateCw, Clock, Camera, Upload, Zap, ArrowUp, ArrowDown, Globe, Bot, Webhook, Link2, Copy, ShieldCheck, Key } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

function SiteRow({ site, onDelete, onUpdate, onMove, isFirst, isLast }: { site: any, onDelete: (id: string) => void, onUpdate: (id: string, updates: any) => Promise<void>, onMove: (id: string, direction: 'up' | 'down') => void, isFirst: boolean, isLast: boolean }) {
  const [name, setName] = useState(site.name);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(site.id, { name });
    setIsSaving(false);
  };

  return (
    <div className="p-4 border rounded-xl bg-white shadow-sm flex items-center gap-4 group">
      <div className="flex flex-col gap-1">
        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-blue-600 disabled:opacity-0" onClick={() => onMove(site.id, 'up')} disabled={isFirst}>
          <ArrowUp className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-blue-600 disabled:opacity-0" onClick={() => onMove(site.id, 'down')} disabled={isLast}>
          <ArrowDown className="w-4 h-4" />
        </Button>
      </div>
      <div className="flex-1">
        <Input value={name} onChange={(e) => setName(e.target.value)} onBlur={handleSave} className="font-bold text-gray-900 border-transparent hover:border-gray-200 focus:border-blue-300 bg-transparent" placeholder="Site name..." />
      </div>
      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0" onClick={() => onDelete(site.id)}>
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

function PrewrittenTemplateRow({ template, onDelete, onUpdate }: { template: any, onDelete: (id: string) => void, onUpdate: (id: string, updates: any) => Promise<void> }) {
  const [name, setName] = useState(template.name);
  const [content, setContent] = useState(template.content || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(template.id, { name, content });
    setIsSaving(false);
  };

  return (
    <div className="p-6 border rounded-xl bg-white shadow-sm space-y-4">
      <div className="flex items-center gap-4">
        <div className="flex-1 space-y-1">
          <Label className="text-xs font-semibold text-gray-500 uppercase">Template Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} className="font-bold text-gray-900 border-gray-200" placeholder="e.g., Monthly SEO Update" />
        </div>
        <div className="flex items-end gap-2 pt-5">
          <Button variant="outline" onClick={handleSave} disabled={isSaving} className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200 shrink-0">
            {isSaving ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save</>}
          </Button>
          <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0" onClick={() => onDelete(template.id)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-semibold text-gray-500 uppercase">Message Content</Label>
        <div className="border rounded-md overflow-hidden bg-white border-gray-200">
          <ReactQuill theme="snow" value={content} onChange={setContent} className="[&_.ql-editor]:min-h-[150px] [&_.ql-editor]:text-sm [&_.ql-toolbar]:border-x-0 [&_.ql-toolbar]:border-t-0 [&_.ql-container]:border-none" />
        </div>
      </div>
    </div>
  );
}

function SettingsContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabParam || "email");

  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const [template, setTemplate] = useState(
`<div style="font-family: sans-serif; max-w: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: white;">
  <h2 style="color: #2563eb; margin-top: 0;">BrandTactics Update</h2>
  <div style="background: #f8fafc; padding: 24px; border-radius: 8px; border: 1px solid #f1f5f9; color: #334155; line-height: 1.6;">
    [content]
  </div>
  <p style="color: #64748b; font-size: 12px; margin-top: 24px; text-align: center; border-top: 1px solid #f1f5f9; pt: 16px;">
    Sent via BrandTactics Client Portal
  </p>
</div>`
  );

  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [webhookNotes, setWebhookNotes] = useState("");
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  const [isSavingWebhookSecret, setIsSavingWebhookSecret] = useState(false);
  const [isSavingWebhookNotes, setIsSavingWebhookNotes] = useState(false);

  const handleSaveWebhookNotes = async () => {
    setIsSavingWebhookNotes(true);
    try {
      const { error } = await supabase.from('app_settings').update({ webhook_notes: webhookNotes }).eq('id', 'global');
      if (error) throw error;
      toast.success("Webhook notes saved.");
    } catch (err: any) {
      toast.error("Failed to save notes.");
    } finally {
      setIsSavingWebhookNotes(false);
    }
  };

  const generateRandomSecret = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
    let result = "";
    for (let i = 0; i < 32; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setWebhookSecret(result);
    toast.info("Generated new secret. Don't forget to save!");
  };

  const handleSaveWebhookSecret = async () => {
    setIsSavingWebhookSecret(true);
    try {
      const { error } = await supabase.from('app_settings').update({ webhook_secret: webhookSecret }).eq('id', 'global');
      if (error) throw error;
      toast.success("Webhook secret saved successfully.");
    } catch (err: any) {
      toast.error("Failed to save webhook secret. Make sure the 'webhook_secret' column exists.");
    } finally {
      setIsSavingWebhookSecret(false);
    }
  };

  const handleSaveApiKey = async () => {
    setIsSavingApiKey(true);
    try {
      const { error } = await supabase.from('app_settings').update({ gemini_api_key: geminiApiKey }).eq('id', 'global');
      if (error) throw error;
      toast.success("AI API Key saved successfully.");
    } catch (err: any) {
      toast.error("Failed to save API key");
    } finally {
      setIsSavingApiKey(false);
    }
  };

  useEffect(() => {
    // Fetch settings one by one or handle failure gracefully to avoid breaking the whole page if columns are missing
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from('app_settings').select('*').eq('id', 'global').single();
        
        if (data) {
          if (data.email_template) setTemplate(data.email_template);
          if (data.gemini_api_key) setGeminiApiKey(data.gemini_api_key);
          if (data.webhook_secret) setWebhookSecret(data.webhook_secret);
          if (data.webhook_notes) setWebhookNotes(data.webhook_notes);
        } else if (error) {
          console.warn("Could not fetch some settings, likely due to missing columns. Falling back to defaults.", error);
          // Try a safer fetch for just the core columns if the main one failed
          const { data: basicData } = await supabase.from('app_settings').select('email_template, gemini_api_key').eq('id', 'global').single();
          if (basicData) {
            if (basicData.email_template) setTemplate(basicData.email_template);
            if (basicData.gemini_api_key) setGeminiApiKey(basicData.gemini_api_key);
          }
        }
      } catch (err) {
        console.error("Error in settings fetch:", err);
      }
    };

    fetchSettings();
    fetchPrewrittenTemplates();
    setIsLoading(false);
  }, []);

  const handleSaveTemplate = async () => {
    try {
      const { error } = await supabase.from('app_settings').update({ email_template: template }).eq('id', 'global');
      if (error) throw error;
      toast.success("Email template saved successfully.");
    } catch (err: any) {
      toast.error("Failed to save template");
    }
  };

  const [prewrittenTemplates, setPrewrittenTemplates] = useState<any[]>([]);

  const fetchPrewrittenTemplates = async () => {
    try {
      const { data, error } = await supabase.from('email_templates').select('*').order('created_at', { ascending: true });
      if (data) setPrewrittenTemplates(data);
    } catch (err) {
      // Table might not exist yet
    }
  };

  const [articleAiSettings, setArticleAiSettings] = useState({
    url: "",
    testUrl: "",
    useTest: false
  });

  const [articleTypes, setArticleTypes] = useState<any[]>([]);
  const [isAddingType, setIsAddingType] = useState(false);

  const fetchArticleSettings = async () => {
    try {
      const { data: typesData } = await supabase.from('article_types').select('*').order('rank', { ascending: true });
      if (typesData) setArticleTypes(typesData);

      const { data: aiData } = await supabase.from('app_settings').select('article_ai_webhook_url, article_ai_webhook_url_test, article_ai_use_test').eq('id', 'global').single();
      if (aiData) {
        setArticleAiSettings({
          url: aiData.article_ai_webhook_url || "",
          testUrl: aiData.article_ai_webhook_url_test || "",
          useTest: aiData.article_ai_use_test || false
        });
      }
    } catch (err) {
      console.error("Error fetching article settings:", err);
    }
  };

  const [profileSites, setProfileSites] = useState<any[]>([]);
  const [isAddingSite, setIsAddingSite] = useState(false);

  const fetchProfileSites = async () => {
    try {
      const { data, error } = await supabase.from('profile_sites').select('*').order('rank', { ascending: true });
      if (data) setProfileSites(data);
    } catch (err) {}
  };

  useEffect(() => {
    fetchArticleSettings();
    fetchProfileSites();
  }, []);

  const handleCreateSite = async () => {
    setIsAddingSite(true);
    const maxRank = profileSites.reduce((max, s) => Math.max(max, s.rank || 0), 0);
    try {
      const { data, error } = await supabase.from('profile_sites').insert({ name: "New Site", rank: maxRank + 1 }).select().single();
      if (error) throw error;
      if (data) setProfileSites([...profileSites, data]);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsAddingSite(false);
    }
  };

  const handleDeleteSite = async (id: string) => {
    try {
      const { error } = await supabase.from('profile_sites').delete().eq('id', id);
      if (error) throw error;
      setProfileSites(profileSites.filter(s => s.id !== id));
      toast.success("Site removed");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleUpdateSite = async (id: string, updates: any) => {
    try {
      const { error } = await supabase.from('profile_sites').update(updates).eq('id', id);
      if (error) throw error;
      setProfileSites(profileSites.map(s => s.id === id ? { ...s, ...updates } : s));
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleMoveSite = async (id: string, direction: 'up' | 'down') => {
    const index = profileSites.findIndex(s => s.id === id);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === profileSites.length - 1)) return;

    const newSites = [...profileSites];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newSites[index], newSites[swapIndex]] = [newSites[swapIndex], newSites[index]];

    setProfileSites(newSites);

    try {
      const updates = newSites.map((s, i) => 
        supabase.from('profile_sites').update({ rank: i + 1 }).eq('id', s.id)
      );
      await Promise.all(updates);
    } catch (err: any) {
      toast.error("Failed to reorder");
      fetchProfileSites();
    }
  };

  const handleCreateType = async () => {
    setIsAddingType(true);
    const maxRank = articleTypes.reduce((max, t) => Math.max(max, t.rank || 0), 0);
    try {
      const { data, error } = await supabase.from('article_types').insert({ name: "New Category", rank: maxRank + 1 }).select().single();
      if (error) throw error;
      if (data) setArticleTypes([...articleTypes, data]);
    } catch (err: any) {
      toast.error(err.message || "Failed to add type. Make sure you ran the SQL migration.");
    } finally {
      setIsAddingType(false);
    }
  };

  const handleUpdateType = async (id: string, updates: any) => {
    try {
      const { error } = await supabase.from('article_types').update(updates).eq('id', id);
      if (error) throw error;
      setArticleTypes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
    } catch (err: any) {
      toast.error("Failed to save type");
    }
  };

  const handleDeleteType = async (id: string) => {
    if (!confirm("Are you sure?")) return;
    try {
      const { error } = await supabase.from('article_types').delete().eq('id', id);
      if (error) throw error;
      setArticleTypes(prev => prev.filter(t => t.id !== id));
      toast.success("Category removed");
    } catch (err: any) {
      toast.error("Failed to delete category");
    }
  };

  const handleSaveArticleAiSettings = async () => {
    try {
      const { error } = await supabase.from('app_settings').update({
        article_ai_webhook_url: articleAiSettings.url,
        article_ai_webhook_url_test: articleAiSettings.testUrl,
        article_ai_use_test: articleAiSettings.useTest
      }).eq('id', 'global');
      if (error) throw error;
      toast.success("AI Generation settings saved.");
    } catch (err: any) {
      toast.error("Failed to save AI settings");
    }
  };

  const handleCreatePrewrittenTemplate = async () => {
    const newTemp = { name: "New Template", content: "" };
    try {
      const { data, error } = await supabase.from('email_templates').insert(newTemp).select().single();
      if (error) throw error;
      if (data) {
        setPrewrittenTemplates([...prewrittenTemplates, data]);
        toast.success("New template added");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to add template. Make sure you ran the SQL migration.");
    }
  };

  const handleUpdatePrewrittenTemplate = async (id: string, updates: any) => {
    try {
      const { error } = await supabase.from('email_templates').update(updates).eq('id', id);
      if (error) throw error;
      setPrewrittenTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
      toast.success("Template saved successfully.");
    } catch (err: any) {
      toast.error("Failed to save template");
    }
  };

  const handleDeletePrewrittenTemplate = async (id: string) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const { error } = await supabase.from('email_templates').delete().eq('id', id);
      if (error) throw error;
      setPrewrittenTemplates(prev => prev.filter(t => t.id !== id));
      toast.success("Template deleted");
    } catch (err: any) {
      toast.error("Failed to delete template");
    }
  };

  const previewHtml = template.replace('[content]', `
    <p>This is a preview of how your message will look inside the template wrapper.</p>
    <ul>
      <li>Task completed: "New Website Design"</li>
      <li>New comment from Sarah</li>
      <li>Monthly report is ready</li>
    </ul>
    <p>You can use standard HTML formatting here.</p>
  `);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1 uppercase text-[11px] font-bold tracking-widest">Manage global app settings, team members, and templates.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-100/50 border border-gray-200 p-1 rounded-lg">
          <TabsTrigger value="email" className="px-6 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Email Template</TabsTrigger>
          <TabsTrigger value="endpoints" className="px-6 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Article Settings</TabsTrigger>
          <TabsTrigger value="profiles" className="px-6 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Profiles</TabsTrigger>
          <TabsTrigger value="ai" className="px-6 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">AI Integrations</TabsTrigger>
          <TabsTrigger value="webhooks" className="px-6 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="ai" className="space-y-6 mt-0 outline-none ring-0">
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                AI API Keys
              </CardTitle>
              <CardDescription>
                Configure integration with Google Gemini for AI-assisted task styling, transcribing, and formatting.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-w-xl">
                <div className="space-y-2">
                  <Label>Google Gemini API Key</Label>
                  <Input 
                    type="password" 
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    placeholder="AIzaSy..." 
                  />
                  <p className="text-[11px] text-gray-500">
                    This key acts globally for features utilizing the AI helper on tasks. Note: Make sure to add the 'gemini_api_key' column to the 'app_settings' table in Supabase!
                  </p>
                </div>
                <Button onClick={handleSaveApiKey} disabled={isSavingApiKey} className="bg-blue-600 hover:bg-blue-700">
                  {isSavingApiKey ? "Saving..." : <><Save className="w-4 h-4 mr-2" /> Save Settings</>}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6 mt-0 outline-none ring-0">
          <Card className="shadow-sm border-gray-200 overflow-hidden">
            <CardHeader className="border-b bg-gray-50/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center text-lg">
                    <Mail className="w-5 h-5 mr-2 text-blue-600" />
                    Global Email Template
                  </CardTitle>
                  <CardDescription>
                    Customize the HTML wrapper for client email updates. Use exactly <code>[content]</code> where you want the body injected.
                  </CardDescription>
                </div>
                <Button onClick={handleSaveTemplate} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" /> Save Template
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                <div className="flex flex-col h-full bg-gray-900 border-r border-gray-800">
                  <div className="px-4 py-2 border-b border-gray-800 bg-gray-950 flex items-center justify-between shrink-0">
                    <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">HTML Source</span>
                  </div>
                  <div className="flex-1 min-h-0">
                    <Textarea 
                      value={template}
                      onChange={(e) => setTemplate(e.target.value)}
                      className="w-full h-full font-mono text-sm resize-none border-0 focus-visible:ring-0 bg-transparent text-green-400 p-6 shadow-none rounded-none overflow-y-auto"
                      placeholder="<div>[content]</div>"
                      style={{ fieldSizing: 'fixed' } as any}
                    />
                  </div>
                </div>

                <div className="flex flex-col h-full bg-gray-100/30">
                  <div className="px-4 py-2 border-b bg-white">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Live Preview</span>
                  </div>
                  <div className="flex-1 overflow-auto p-8 flex justify-center bg-[#f0f2f5]">
                    <div className="w-full max-w-[600px] shadow-lg rounded-xl overflow-hidden bg-white">
                      <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="pt-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-indigo-600" />
                  Prewritten Templates
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Create reusable message blocks that you can quickly inject into email updates from the dashboard.
                </p>
              </div>
              <Button onClick={handleCreatePrewrittenTemplate} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm gap-2">
                <Plus className="w-4 h-4" /> Add Template
              </Button>
            </div>

            {prewrittenTemplates.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-700">No templates yet</h4>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Click the button above to create your first prewritten template.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {prewrittenTemplates.map(t => (
                  <PrewrittenTemplateRow 
                    key={t.id} 
                    template={t} 
                    onDelete={handleDeletePrewrittenTemplate} 
                    onUpdate={handleUpdatePrewrittenTemplate} 
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="endpoints" className="space-y-8 mt-0 outline-none ring-0">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-blue-600" />
                  Article Categories
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Manage the available types/categories for client articles. These will appear in the dropdown when creating or editing articles.
                </p>
              </div>
              <Button onClick={handleCreateType} disabled={isAddingType} className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm gap-2">
                <Plus className="w-4 h-4" /> {isAddingType ? "Adding..." : "Add Category"}
              </Button>
            </div>

            {articleTypes.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <p className="text-sm text-gray-400">No custom categories added. Default types will be used.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {articleTypes.map(type => (
                  <div key={type.id} className="p-3 bg-white border border-gray-200 rounded-xl shadow-sm flex items-center gap-3">
                    <div className="flex-1">
                      <Input 
                        value={type.name} 
                        onChange={(e) => handleUpdateType(type.id, { name: e.target.value })}
                        className="h-8 text-sm font-medium border-transparent hover:border-gray-100 focus:border-blue-200 px-2"
                      />
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7 text-gray-400 hover:text-red-600"
                      onClick={() => handleDeleteType(type.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-px bg-gray-200" />

          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center">
                <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                AI Generation Configuration
              </h3>
              <p className="text-xs text-gray-500 mt-1 max-w-2xl">
                Configure the n8n webhook URLs used when "Generate with AI" is checked. This endpoint is called to generate the HTML content for any article category.
              </p>
            </div>

            <Card className={cn(
              "border-2 transition-all shadow-md overflow-hidden",
              articleAiSettings.useTest ? "border-amber-200 bg-amber-50/10" : "border-blue-100 bg-white"
            )}>
              <CardHeader className={cn(
                "pb-4 border-b",
                articleAiSettings.useTest ? "bg-amber-50/50" : "bg-blue-50/30"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "p-2 rounded-lg",
                      articleAiSettings.useTest ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                    )}>
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold uppercase tracking-wide">Main AI Webhook</CardTitle>
                      <CardDescription className="text-[10px] font-medium">This endpoint processes all AI generation requests.</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                      <input 
                        type="checkbox" 
                        id="global-ai-test-mode"
                        checked={articleAiSettings.useTest} 
                        onChange={(e) => setArticleAiSettings(prev => ({ ...prev, useTest: e.target.checked }))} 
                        className="w-4 h-4 text-amber-500 border-gray-300 rounded focus:ring-amber-500"
                      />
                      <Label htmlFor="global-ai-test-mode" className="text-xs font-bold text-gray-700 cursor-pointer">
                        Use Test Endpoint
                      </Label>
                    </div>
                    <Button onClick={handleSaveArticleAiSettings} className="bg-blue-600 hover:bg-blue-700 shadow-lg">
                      <Save className="w-4 h-4 mr-2" /> Save Config
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className={cn(
                        "text-[11px] font-bold uppercase tracking-wider",
                        !articleAiSettings.useTest ? "text-blue-600" : "text-gray-400"
                      )}>Live Webhook URL</Label>
                      {!articleAiSettings.useTest && <Badge className="bg-green-500 hover:bg-green-500 text-white text-[9px] h-4 py-0 px-2 font-bold ring-2 ring-white">ACTIVE</Badge>}
                    </div>
                    <Input 
                      value={articleAiSettings.url} 
                      onChange={(e) => setArticleAiSettings(prev => ({ ...prev, url: e.target.value }))} 
                      className={cn(
                        "font-mono text-xs h-10",
                        !articleAiSettings.useTest ? "border-blue-300 bg-white shadow-sm ring-1 ring-blue-50" : "border-gray-200 bg-gray-50 text-gray-400"
                      )}
                      placeholder="https://n8n.your-domain.com/webhook/..." 
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className={cn(
                        "text-[11px] font-bold uppercase tracking-wider",
                        articleAiSettings.useTest ? "text-amber-600" : "text-gray-400"
                      )}>Test Webhook URL</Label>
                      {articleAiSettings.useTest && <Badge className="bg-amber-500 hover:bg-amber-500 text-white text-[9px] h-4 py-0 px-2 font-bold ring-2 ring-white">ACTIVE</Badge>}
                    </div>
                    <Input 
                      value={articleAiSettings.testUrl} 
                      onChange={(e) => setArticleAiSettings(prev => ({ ...prev, testUrl: e.target.value }))} 
                      className={cn(
                        "font-mono text-xs h-10",
                        articleAiSettings.useTest ? "border-amber-300 bg-white shadow-sm ring-1 ring-amber-50" : "border-gray-200 bg-gray-50 text-gray-400"
                      )}
                      placeholder="https://n8n.your-domain.com/webhook-test/..." 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="profiles" className="space-y-6 mt-0 outline-none ring-0">
          <Card className="shadow-sm border-gray-200">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Users className="w-5 h-5 mr-2 text-blue-600" />
                Profiles Configuration
              </CardTitle>
              <CardDescription>
                Manage global settings and categories for user personas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-4">
                  <div className="bg-white p-2 rounded-lg h-fit flex items-center justify-center border border-blue-200">
                    <Zap className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-bold text-blue-900">Global Ordering</h4>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      Profiles are currently ordered by manual rank and creation date. You can re-order them directly from the Profiles dashboard using drag-and-drop (coming soon).
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <Label className="text-xs font-bold uppercase text-gray-500">Enable Profile Categories</Label>
                     <div className="h-6 w-10 bg-gray-200 rounded-full relative cursor-pointer opacity-50">
                       <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                     </div>
                   </div>
                   <div className="flex items-center justify-between">
                     <Label className="text-xs font-bold uppercase text-gray-500">Auto-Generate Credentials</Label>
                     <div className="h-6 w-10 bg-gray-200 rounded-full relative cursor-pointer opacity-50">
                       <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                     </div>
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <Globe className="w-5 h-5 mr-2 text-indigo-600" />
                  Global Sites
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Manage the platforms (Facebook, Twitter, etc.) that appear when adding credentials to a profile.
                </p>
              </div>
              <Button onClick={handleCreateSite} disabled={isAddingSite} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm gap-2">
                <Plus className="w-4 h-4" /> {isAddingSite ? "Adding..." : "Add Site"}
              </Button>
            </div>

            {profileSites.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                <Globe className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-700">No sites added yet</h4>
                <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">Click the button above to add your first platform.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {profileSites.map((site, idx) => (
                  <SiteRow 
                    key={site.id} 
                    site={site} 
                    onDelete={handleDeleteSite} 
                    onUpdate={handleUpdateSite}
                    onMove={handleMoveSite}
                    isFirst={idx === 0}
                    isLast={idx === profileSites.length - 1}
                  />
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-8 mt-0 outline-none ring-0">
          <div className="grid grid-cols-1 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 flex items-center">
                  <ShieldCheck className="w-5 h-5 mr-2 text-red-600" />
                  Security & Authentication
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Manage the shared secrets used to authenticate incoming webhook requests.
                </p>
              </div>

              <Card className="shadow-sm border-gray-200">
                <CardContent className="p-6">
                  <div className="space-y-4 max-w-xl">
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-gray-400" />
                        Global Webhook Secret
                      </Label>
                        <div className="flex gap-2">
                          <Input 
                            type="password" 
                            value={webhookSecret}
                            onChange={(e) => setWebhookSecret(e.target.value)}
                            placeholder="your-secret-key" 
                            className="font-mono text-sm"
                          />
                          <Button variant="outline" size="icon" onClick={() => {
                            navigator.clipboard.writeText(webhookSecret);
                            toast.success("Secret copied to clipboard");
                          }} className="shrink-0 border-gray-200 hover:bg-gray-50" title="Copy Secret">
                            <Copy className="w-4 h-4" />
                          </Button>
                          <Button variant="outline" size="icon" onClick={generateRandomSecret} className="shrink-0 border-gray-200 hover:bg-gray-50" title="Generate Random Secret">
                            <RotateCw className="w-4 h-4" />
                          </Button>
                          <Button onClick={handleSaveWebhookSecret} disabled={isSavingWebhookSecret} className="bg-gray-900 hover:bg-black shrink-0">
                            {isSavingWebhookSecret ? "Saving..." : "Update Secret"}
                          </Button>
                        </div>
                      <p className="text-[11px] text-gray-500">
                        This secret must be passed in the <code>X-Webhook-Secret</code> header for all incoming requests.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="h-px bg-gray-200" />

            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <Webhook className="w-5 h-5 mr-2 text-purple-600" />
                    Registered Incoming Webhooks
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Reference documentation for active endpoints in this application.
                  </p>
                </div>
              </div>

              <Card className="shadow-sm border-gray-200 overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-200 py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-purple-100 text-purple-700 p-2 rounded-lg">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          Articles Submission
                          <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-green-200 text-[10px] h-5">ACTIVE</Badge>
                        </CardTitle>
                        <CardDescription className="text-xs">Submit new articles directly from n8n or external services.</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono text-[10px] bg-white">POST</Badge>
                      <code className="text-[10px] bg-gray-100 px-2 py-1 rounded border">/api/webhooks/articles</code>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
                    <div className="p-6 space-y-6">
                      <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Endpoint Access</Label>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] mb-1">
                            <span className="text-gray-500">Public URL</span>
                            <button 
                              onClick={() => {
                                const url = `${window.location.origin}/api/webhooks/articles`;
                                navigator.clipboard.writeText(url);
                                toast.success("URL copied");
                              }}
                              className="text-blue-600 hover:underline flex items-center gap-1"
                            >
                              <Copy className="w-3 h-3" /> Copy URL
                            </button>
                          </div>
                          <Input 
                            readOnly 
                            value={typeof window !== 'undefined' ? `${window.location.origin}/api/webhooks/articles` : "/api/webhooks/articles"} 
                            className="bg-gray-50 font-mono text-xs border-gray-200 h-9" 
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Required Authentication</Label>
                        <div className="p-4 bg-gray-950 rounded-xl border border-gray-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-500 font-mono">Header Key</span>
                            <span className="text-[10px] font-bold text-purple-400 font-mono">X-Webhook-Secret</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-500 font-mono">Value</span>
                            <span className="text-[10px] font-bold text-green-400 font-mono">••••••••••••</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 bg-gray-50/50 space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Sample Payload (JSON)</Label>
                        <Badge variant="outline" className="text-[9px] bg-white">Example</Badge>
                      </div>
                      <div className="relative group">
                        <pre className="bg-white border border-gray-200 rounded-xl p-4 text-[11px] font-mono leading-relaxed text-gray-700 overflow-x-auto shadow-sm">
                          {JSON.stringify({
                            clientId: "UUID-HERE",
                            title: "Amazing SEO Article",
                            content: "<p>The article content in HTML...</p>",
                            type: "Blog Post",
                            direction: "ltr",
                            meta_title: "SEO Optimized Title",
                            meta_description: "A compelling description for search engines.",
                            meta_keywords: "seo, keywords, article"
                          }, null, 2)}
                        </pre>
                        <button 
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify({
                              clientId: "UUID-HERE",
                              title: "Amazing SEO Article",
                              content: "<p>The article content in HTML...</p>",
                              type: "Blog Post",
                              direction: "ltr",
                              meta_title: "SEO Optimized Title",
                              meta_description: "A compelling description for search engines.",
                              meta_keywords: "seo, keywords, article"
                            }, null, 2));
                            toast.success("Payload copied");
                          }}
                          className="absolute top-3 right-3 p-2 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Copy className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                      </div>
                      <div className="flex gap-3">
                        <div className="flex-1 p-3 bg-blue-50 border border-blue-100 rounded-lg">
                          <p className="text-[10px] text-blue-700 leading-normal">
                            <strong>Note:</strong> <code>clientId</code> must match an existing client ID in your database.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="h-px bg-gray-200" />

              <div className="space-y-6 pb-12">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-blue-600" />
                    Webhook Registry & Notes
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Save details about external webhooks (n8n, Zapier, etc.) so you don't forget them.
                  </p>
                </div>

                <Card className="shadow-sm border-gray-200">
                  <CardContent className="p-6 space-y-4">
                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl flex gap-4 mb-4">
                      <div className="bg-white p-2 rounded-lg h-fit flex items-center justify-center border border-amber-200">
                        <Bot className="w-4 h-4 text-amber-600" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-amber-900">External Webhook: n8n Article Gen</h4>
                        <p className="text-[11px] text-amber-700 leading-relaxed">
                          This is the webhook we use to trigger the AI generation in n8n. It's currently configured in the "Article Settings" tab.
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-[11px] font-bold uppercase text-gray-400">Additional Webhook Notes</Label>
                      <Textarea 
                        value={webhookNotes}
                        onChange={(e) => setWebhookNotes(e.target.value)}
                        placeholder="Paste details about new webhooks here (URL, username, pass, etc.)"
                        className="min-h-[150px] font-mono text-xs bg-gray-50 border-gray-200 focus:bg-white transition-colors"
                      />
                      <div className="flex justify-end">
                        <Button onClick={handleSaveWebhookNotes} disabled={isSavingWebhookNotes} size="sm" className="bg-blue-600 hover:bg-blue-700">
                          {isSavingWebhookNotes ? "Saving..." : <><Save className="w-3.5 h-3.5 mr-2" /> Save Notes</>}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SettingsContent />
    </Suspense>
  );
}
