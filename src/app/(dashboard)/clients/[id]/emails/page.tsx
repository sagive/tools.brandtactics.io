"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
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
    
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(`/api/email-updates?id=${id}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to delete log entry");
      }

      toast.success("Log entry deleted");
      setEmails(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete log entry");
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
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="bg-gray-50/50 text-[10px] uppercase tracking-widest font-bold text-gray-500 border-b border-gray-100">
                  <th className="px-4 py-3.5">Topic (Subject)</th>
                  <th className="px-3 py-3.5 w-28">Status</th>
                  <th className="px-3 py-3.5 w-36 whitespace-nowrap">Date & Time</th>
                  <th className="px-4 py-3.5 text-right w-24 whitespace-nowrap">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-500">
                      Loading updates...
                    </td>
                  </tr>
                ) : emails.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-sm text-gray-500">
                      No updates sent yet.
                    </td>
                  </tr>
                ) : (
                  emails.map((email) => (
                    <tr key={email.id} className="border-b border-gray-100 last:border-none hover:bg-gray-50/50 transition-colors group">
                      <td className="px-4 py-3.5 min-w-0">
                        <Dialog>
                          <DialogTrigger render={
                            <button 
                              className="text-sm text-gray-700 hover:text-blue-600 font-medium text-left truncate block w-full max-w-[220px] sm:max-w-none decoration-dashed hover:underline underline-offset-4 focus:outline-none" 
                              title="Click to view full message"
                            >
                              {truncate(email.title, 50) || "No Subject"}
                            </button>
                          } />
                          <DialogContent className="max-w-4xl sm:max-w-4xl w-[90vw] max-h-[85vh] overflow-hidden flex flex-col p-0 gap-0 bg-white rounded-xl">
                            <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-100 shrink-0">
                              <h4 className="font-bold text-base text-gray-900 leading-tight pr-8">
                                {email.title || "No Subject"}
                              </h4>
                            </div>
                            <div className="p-6 overflow-y-auto flex-1">
                              <div className="text-[14px] text-gray-700 leading-relaxed w-full prose prose-sm prose-p:my-2 prose-a:text-blue-600 [&>p]:whitespace-pre-wrap">
                                <div dangerouslySetInnerHTML={{ __html: email.body || "No content." }} />
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap w-28">
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
                      <td className="px-3 py-3.5 whitespace-nowrap w-36">
                        <span className="text-xs sm:text-[13px] font-medium text-gray-600">
                          {email.scheduled_for 
                            ? format(new Date(email.scheduled_for), "HH:mm - dd/MM/yyyy") 
                            : email.created_at 
                              ? format(new Date(email.created_at), "HH:mm - dd/MM/yyyy") 
                              : "N/A"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right w-24">
                        <div className="flex items-center justify-end gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 shrink-0"
                            title="Resend this exact email"
                            onClick={() => handleResend(email)}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 shrink-0"
                            title="Delete this log"
                            onClick={() => handleDelete(email.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
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
