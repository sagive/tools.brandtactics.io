"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Send, Trash2, Mail } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SendSeoUpdateDialog } from "@/components/send-seo-update-dialog";
import { format } from "date-fns";

export default function ClientEmailsPage() {
  const { id: clientId } = useParams();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);

  useEffect(() => {
    if (clientId) {
      fetchClientData();
      fetchEmails();

      const handleEmailScheduled = () => {
        fetchEmails();
      };

      window.addEventListener("email-scheduled", handleEmailScheduled);
      return () => window.removeEventListener("email-scheduled", handleEmailScheduled);
    }
  }, [clientId]);

  async function fetchClientData() {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("id", clientId)
      .single();
    if (data) setClient(data);
  }

  async function fetchEmails() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("email_updates")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEmails(data || []);
    } catch (err: any) {
      toast.error("Failed to load email updates");
    } finally {
      setLoading(false);
    }
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
      setEmails(emails.filter(e => e.id !== id));
    }
  };

  const handleResend = async (email: any) => {
    if (!confirm("Are you sure you want to resend this email?")) return;
    
    try {
      const response = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: email.client_id,
          subject: email.title,
          body: email.body,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to resend email");
      }
      
      toast.success("Email resent successfully!");
      fetchEmails(); // Refresh list to show the new log entry
    } catch (error) {
      toast.error("Could not resend email");
    }
  };

  const truncate = (str: string, length: number) => {
    if (!str) return "";
    return str.length > length ? str.substring(0, length) + "..." : str;
  };

  return (
    <div className="space-y-6">

      <Card className="shadow-sm border-gray-200 overflow-hidden">
        <CardHeader className="pb-3 border-b bg-gray-50/30">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Activity Log</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] uppercase tracking-widest font-bold text-gray-500 border-b border-gray-100">
                  <th className="px-6 py-4">Recipient</th>
                  <th className="px-6 py-4">Topic (Subject)</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                      Loading updates...
                    </td>
                  </tr>
                ) : emails.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                      No updates sent yet.
                    </td>
                  </tr>
                ) : (
                  emails.map((email) => (
                    <tr key={email.id} className="border-b border-gray-100 last:border-none hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600 shrink-0">
                            {client?.name?.substring(0, 1).toUpperCase() || "C"}
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{client?.name || "Client"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 min-w-[300px] max-w-[400px]">
                        <Popover>
                          <PopoverTrigger render={
                            <button 
                              className="text-sm text-gray-700 hover:text-blue-600 font-medium text-left truncate w-full decoration-dashed hover:underline underline-offset-4 focus:outline-none" 
                              title="Click to view full message"
                            >
                              {truncate(email.title, 55) || "No Subject"}
                            </button>
                          } />
                          <PopoverContent className="w-[450px] p-5 shadow-xl border-gray-100 bg-white" align="start">
                            <div className="space-y-3">
                              <h4 className="font-bold text-sm text-gray-900 leading-tight">
                                {email.title || "No Subject"}
                              </h4>
                              <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md border border-gray-100 max-h-[300px] overflow-y-auto w-full prose prose-sm prose-p:my-1 prose-a:text-blue-600 [&>p]:whitespace-pre-wrap">
                                <div dangerouslySetInnerHTML={{ __html: email.body || "No content." }} />
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {email.status === 'Scheduled' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                            Scheduled
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-green-50 text-green-700 border border-green-100">
                            {email.status || 'Sent'}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-[14px] font-medium text-gray-600">
                          {email.scheduled_for 
                            ? format(new Date(email.scheduled_for), "HH:mm - dd/MM/yyyy") 
                            : email.created_at 
                              ? format(new Date(email.created_at), "HH:mm - dd/MM/yyyy") 
                              : "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600"
                          title="Resend this exact email"
                          onClick={() => handleResend(email)}
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-600"
                          title="Delete this log"
                          onClick={() => handleDelete(email.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
