"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Check, ChevronsUpDown, FileText, AlertCircle, Send, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import dynamic from "next/dynamic";
import "react-quill-new/dist/quill.snow.css";

const ReactQuill = dynamic(() => import("react-quill-new"), { ssr: false });

interface SendMultipleSeoUpdatesDialogProps {
  defaultClientId?: string;
  trigger?: React.ReactElement;
  onSuccess?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

interface VariantItem {
  id: string;
  scheduledFor: string; // ISO string 
  content: string;
}

export function SendMultipleSeoUpdatesDialog({ defaultClientId, trigger, onSuccess, open: externalOpen, onOpenChange: externalOnOpenChange }: SendMultipleSeoUpdatesDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = externalOpen !== undefined ? externalOpen : internalOpen;
  
  const setIsOpen = (newOpen: boolean) => {
    if (externalOnOpenChange) externalOnOpenChange(newOpen);
    setInternalOpen(newOpen);
  };

  const [clientId, setClientId] = useState(defaultClientId || "");
  const [openClientDropdown, setOpenClientDropdown] = useState(false);
  const [subject, setSubject] = useState("Multiple SEO Updates from BrandTactics");
  const [baseBody, setBaseBody] = useState("");
  
  // Variants State
  const [variants, setVariants] = useState<VariantItem[]>([]);
  const [currentVariantDate, setCurrentVariantDate] = useState("");
  const [currentVariantContent, setCurrentVariantContent] = useState("");
  const [editingVariantId, setEditingVariantId] = useState<string | null>(null);

  const [sending, setSending] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [openTemplateDropdown, setOpenTemplateDropdown] = useState(false);
  const [templateId, setTemplateId] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchClients();
      fetchTemplates();
      if (defaultClientId) setClientId(defaultClientId);
      
      // Initialize the first date to "now" if list is empty
      if (variants.length === 0 && !currentVariantDate) {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        setCurrentVariantDate(now.toISOString().slice(0, 16));
      }
    }
  }, [isOpen, defaultClientId]);

  async function fetchClients() {
    const { data } = await supabase.from("clients").select("id, name, contact_email, status").order("name");
    if (data) setClients(data);
  }

  async function fetchTemplates() {
    try {
      const { data } = await supabase.from("email_templates").select("*").order("name");
      if (data) setTemplates(data);
    } catch (e) {
      console.log("Templates table might not exist yet");
    }
  }

  const handleAddVariant = () => {
    if (!currentVariantDate || !currentVariantContent || currentVariantContent === "<p><br></p>") {
      toast.error("Please provide both a date and content for the variant.");
      return;
    }

    const newItem: Omit<VariantItem, "id"> = { 
      scheduledFor: currentVariantDate, 
      content: currentVariantContent 
    };

    if (editingVariantId) {
      setVariants(prev => prev.map(v => v.id === editingVariantId ? { ...newItem, id: editingVariantId } : v));
      setEditingVariantId(null);
    } else {
      setVariants(prev => [...prev, { ...newItem, id: Math.random().toString(36).substr(2, 9) }]);
    }
    
    // Auto increment default date for the next item (default +1 day)
    const prevDate = new Date(currentVariantDate);
    prevDate.setDate(prevDate.getDate() + 1);
    prevDate.setMinutes(prevDate.getMinutes() - prevDate.getTimezoneOffset());
    setCurrentVariantDate(prevDate.toISOString().slice(0, 16));
    
    setCurrentVariantContent("");
  };

  const handleEditVariant = (variant: VariantItem) => {
    setEditingVariantId(variant.id);
    setCurrentVariantDate(variant.scheduledFor);
    setCurrentVariantContent(variant.content);
  };

  const handleDeleteVariant = (id: string) => {
    if (editingVariantId === id) {
      setEditingVariantId(null);
      setCurrentVariantContent("");
    }
    setVariants(prev => prev.filter(v => v.id !== id));
  };

  const handleSendAll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error("Please select a client.");
      return;
    }
    if (variants.length === 0) {
      toast.error("Please add at least one scheduled variant.");
      return;
    }
    if (!baseBody.includes("[content]")) {
      toast.error("The base message must include the '[content]' tag so we know where to inject the variants.");
      return;
    }

    setSending(true);
    let successCount = 0;
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || '';

      for (const variant of variants) {
        // Inject variant into base message
        let finalBody = baseBody.replace("[content]", variant.content);
        
        // Strip the wrapping P tags that Quill adds if they cause double spacing around the injection
        // A simple naive replacement since Quill wraps everything in <p>
        if (finalBody.includes("<p>[content]</p>")) {
           finalBody = baseBody.replace("<p>[content]</p>", variant.content);
        }

        const res = await fetch("/api/send-email", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}` 
          },
          body: JSON.stringify({ 
            clientId, 
            subject, 
            body: finalBody, 
            scheduledFor: variant.scheduledFor 
          }),
        });
        
        if (!res.ok) {
           const data = await res.json();
           console.error("Failed to send variant", variant, data);
           toast.error(`Failed to schedule one of the emails: ${data.error}`);
        } else {
           successCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`Successfully scheduled ${successCount} SEO updates!`);
        setIsOpen(false);
        setVariants([]);
        setBaseBody("");
        onSuccess?.();
      }
    } catch (err: any) {
      toast.error(err.message || "An error occurred during batch processing");
    } finally {
      setSending(false);
    }
  };

  const selectedClient = clients.find(c => c.id === clientId);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger render={trigger || <Button>Send Bulk Update</Button>} />
      <DialogContent className="max-w-6xl sm:max-w-6xl w-[95vw] h-[95vh] flex flex-col overflow-hidden bg-white p-0 gap-0 [&>button]:right-6 [&>button]:top-6 [&>button]:w-8 [&>button]:h-8 [&>button]:rounded-full [&>button]:bg-gray-100 hover:[&>button]:bg-gray-200 [&>button]:transition-colors [&>button]:cursor-pointer [&>button>svg]:w-5 [&>button>svg]:h-5">
        <DialogHeader className="shrink-0 bg-white p-6 border-b">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Send Multiple Scheduled SEO Updates
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x bg-white overflow-hidden">
            
            {/* Left Column: Configuration */}
            <div className="w-full md:w-1/2 p-6 overflow-y-auto bg-white flex flex-col border-b md:border-b-0">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                 {/* Client Selection */}
                 <div className="space-y-2 flex flex-col">
                   <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Client</Label>
                   <Popover open={openClientDropdown} onOpenChange={setOpenClientDropdown}>
                     <PopoverTrigger render={
                       <Button
                         variant="outline"
                         role="combobox"
                         aria-expanded={openClientDropdown}
                         className={cn(
                           "w-full justify-between bg-white font-normal h-10 px-3",
                           !clientId && "text-muted-foreground"
                         )}
                       >
                         <div className="flex items-center gap-2 truncate">
                           <div className="w-4 h-4 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">
                             {clientId ? clients.find(c => c.id === clientId)?.name?.substring(0,1).toUpperCase() : "?"}
                           </div>
                           {clientId
                             ? clients.find((c) => c.id === clientId)?.name
                             : "Select a client..."}
                         </div>
                         <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                       </Button>
                     }/>
                     <PopoverContent className="w-[var(--base-ui-popover-trigger-width)] p-0" align="start">
                       <Command className="w-full">
                         <CommandInput placeholder="Search clients..." className="h-10" />
                         <CommandList className="max-h-[300px]">
                           <CommandEmpty>No client found.</CommandEmpty>
                           <CommandGroup>
                             {clients.filter(c => c.status === 'Active').map((client) => {
                               const hasEmail = !!client.contact_email;
                               return (
                                 <CommandItem
                                   key={client.id}
                                   value={client.name}
                                   onSelect={() => {
                                     setClientId(client.id);
                                     setOpenClientDropdown(false);
                                   }}
                                   className="flex flex-col items-start px-3 py-2 cursor-pointer transition-colors hover:bg-gray-50"
                                 >
                                   <div className="flex items-center w-full">
                                     <div className="flex-1 font-bold text-gray-900">{client.name}</div>
                                     {clientId === client.id && (
                                       <Check className="ml-auto h-4 w-4 text-blue-600 shrink-0" />
                                     )}
                                   </div>
                                   <div className="text-[10px] uppercase tracking-wider font-semibold text-gray-500 mt-0.5">
                                     {hasEmail ? client.contact_email : "⚠️ Missing Email"}
                                   </div>
                                 </CommandItem>
                               );
                             })}
                           </CommandGroup>
                         </CommandList>
                       </Command>
                     </PopoverContent>
                   </Popover>
                   
                   {clientId && !selectedClient?.contact_email && (
                     <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                       <p className="text-xs text-red-600 font-bold flex items-center gap-1.5">
                         <AlertCircle className="w-3.5 h-3.5" />
                         Missing contact email. Cannot send update.
                       </p>
                     </div>
                   )}
                 </div>
                 
                 {/* Template Selection */}
                 <div className="space-y-2 flex flex-col justify-start">
                   <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Templates</Label>
                   <Popover open={openTemplateDropdown} onOpenChange={setOpenTemplateDropdown}>
                     <PopoverTrigger render={
                       <Button
                         variant="outline"
                         role="combobox"
                         aria-expanded={openTemplateDropdown}
                         className={cn(
                           "w-full justify-between bg-white font-normal h-10 px-3",
                           !templateId && "text-muted-foreground"
                         )}
                       >
                         <div className="flex items-center gap-2 truncate">
                           <FileText className="w-4 h-4 text-gray-400 shrink-0" />
                           {templateId
                             ? templates.find((t) => t.id === templateId)?.name
                             : "Select a template..."}
                         </div>
                         <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                       </Button>
                     }/>
                     <PopoverContent className="w-[var(--base-ui-popover-trigger-width)] min-w-[300px] p-0" align="start">
                       <Command className="w-full">
                         <CommandInput placeholder="Search templates..." className="h-10" />
                         <CommandList className="max-h-[300px]">
                           {templates.length === 0 ? (
                             <CommandEmpty className="py-6 text-center text-sm text-gray-500">
                               No templates found.<br/>Add them in Settings.
                             </CommandEmpty>
                           ) : (
                             <CommandEmpty>No template found.</CommandEmpty>
                           )}
                           <CommandGroup>
                             {templates.map((template) => (
                               <CommandItem
                                 key={template.id}
                                 value={template.name}
                                 onSelect={() => {
                                   setTemplateId(template.id);
                                   setOpenTemplateDropdown(false);
                                   setBaseBody(template.content);
                                   toast.success("Template text injected");
                                 }}
                                 className="flex flex-col items-start px-3 py-2 cursor-pointer transition-colors hover:bg-gray-50"
                               >
                                 <div className="flex items-center w-full">
                                   <div className="flex-1 font-bold text-gray-900">{template.name}</div>
                                   {templateId === template.id && (
                                     <Check className="ml-auto h-4 w-4 text-blue-600 shrink-0" />
                                   )}
                                 </div>
                               </CommandItem>
                             ))}
                           </CommandGroup>
                         </CommandList>
                       </Command>
                     </PopoverContent>
                   </Popover>
                 </div>
               </div>

               <div className="space-y-4 flex-1 flex flex-col">
                 <div className="space-y-2">
                   <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</Label>
                   <Input value={subject} onChange={e => setSubject(e.target.value)} className="bg-white" />
                 </div>
                 
                 <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
                   <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Base Message</Label>
                   <div className="text-[11px] text-gray-400 -mt-1 pb-1">Ensure your template includes <code className="bg-gray-100 text-blue-600 px-1 py-0.5 rounded font-bold">[content]</code> to mark the injection point.</div>
                   <div className="bg-white flex-1 rounded-md border border-input shadow-sm flex flex-col [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:bg-gray-50/50 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-full">
                     <ReactQuill 
                       theme="snow" 
                       value={baseBody} 
                       onChange={setBaseBody}
                       className="flex-1 flex flex-col"
                     />
                   </div>
                 </div>
               </div>
            </div>

            {/* Right Column: Variants List */}
            <div className="w-full md:w-1/2 bg-gray-50 flex flex-col">
               
               {/* Add Variant Form */}
               <div className="p-4 border-b bg-white">
                  <div className="flex items-end gap-3 mb-3">
                     <div className="space-y-1.5 flex-1">
                       <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Scheduled Time</Label>
                       <DateTimePicker 
                         value={currentVariantDate} 
                         onChange={setCurrentVariantDate} 
                         className="h-9" 
                       />
                     </div>
                  </div>
                  <div className="space-y-1.5 mb-3">
                     <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Variant text</Label>
                     <div className="bg-white rounded-md border shadow-sm [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:bg-gray-50/50 [&_.ql-container]:border-0 [&_.ql-editor]:min-h-[100px] [&_.ql-editor]:max-h-[200px] overflow-y-auto">
                       <ReactQuill 
                         theme="snow" 
                         value={currentVariantContent} 
                         onChange={setCurrentVariantContent}
                       />
                     </div>
                  </div>
                  <Button 
                    type="button" 
                    variant={editingVariantId ? "default" : "secondary"}
                    size="sm" 
                    onClick={handleAddVariant}
                    className="w-full font-semibold"
                  >
                    {editingVariantId ? "Save Changes" : "✚ Add Variant to Schedule"}
                  </Button>
               </div>

               {/* Variants List */}
               <div className="flex-1 p-4 overflow-y-auto space-y-3">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider sticky top-0 bg-gray-50 pt-1 pb-2">
                    Scheduled Items ({variants.length})
                  </h3>
                  
                  {variants.length === 0 ? (
                    <div className="text-center p-8 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 text-sm">
                      No variants added yet.
                    </div>
                  ) : (
                    variants.sort((a,b) => new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime()).map(variant => {
                      // Extract plain text preview using Regex to prevent SSR document errors
                      let textPreview = variant.content.replace(/<[^>]*>?/gm, '').trim();
                      if (textPreview.length > 50) textPreview = textPreview.substring(0, 50) + "...";

                      return (
                        <div key={variant.id} className="bg-white border rounded-xl p-3 shadow-sm flex items-center justify-between gap-4 group">
                           <div className="flex-1 min-w-0">
                               <p className="font-medium text-sm text-gray-900 truncate">{textPreview || "(Empty Content)"}</p>
                               <p className="text-[11px] text-blue-600 font-semibold mt-0.5">
                                 {new Date(variant.scheduledFor).toLocaleString('en-GB', {
                                    weekday: 'short', month: 'short', day: 'numeric', 
                                    hour: 'numeric', minute: 'numeric'
                                 })}
                               </p>
                           </div>
                           <div className="flex items-center gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                             <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-500 hover:text-blue-600" onClick={() => handleEditVariant(variant)}>
                               <Pencil className="h-3.5 w-3.5" />
                             </Button>
                             <Button size="icon" variant="ghost" className="h-7 w-7 text-gray-500 hover:text-red-600" onClick={() => handleDeleteVariant(variant.id)}>
                               <Trash2 className="h-3.5 w-3.5" />
                             </Button>
                           </div>
                        </div>
                      )
                    })
                  )}
               </div>

            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="shrink-0 p-6 bg-white border-t flex items-center justify-between">
          <div className="text-xs text-gray-500 font-medium">
             Total scheduled emails: <span className="font-bold text-gray-900">{variants.length}</span>
          </div>
          <Button 
            onClick={handleSendAll}
            disabled={sending || variants.length === 0 || !clientId || !selectedClient?.contact_email} 
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[200px] font-bold uppercase tracking-tight h-11"
          >
            {sending ? "Processing Batch..." : "Send Scheduled Bulk Update"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
