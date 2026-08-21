"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Send, Trash2, Mail, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { SendSeoUpdateDialog } from "@/components/send-seo-update-dialog";
import { format } from "date-fns";

export default function ClientEmailsPage() {
  const { id: clientId } = useParams();
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<any>(null);

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id) return;
    setIsDeleting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;

      const res = await fetch(`/api/email-updates?id=${deleteTarget.id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });

      if (!res.ok) {
        // Fallback to client-side supabase delete
        const { error: directErr } = await supabase
          .from("email_updates")
          .delete()
          .eq("id", deleteTarget.id);
        
        if (directErr) {
          throw new Error(directErr.message);
        }
      }

      toast.success("עדכון ה-SEO נמחק בהצלחה");
      setEmails(prev => prev.filter(e => e.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err.message || "Failed to delete log entry");
    } finally {
      setIsDeleting(false);
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
                              className="text-sm text-gray-700 hover:text-blue-600 font-medium text-left truncate block w-full max-w-[220px] sm:max-w-none decoration-dashed hover:underline underline-offset-4 focus:outline-none cursor-pointer" 
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
                            className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 shrink-0 cursor-pointer"
                            title="Resend this exact email"
                            onClick={() => handleResend(email)}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            id={`btn-delete-email-${email.id}`}
                            data-name="delete-email-btn"
                            className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50 shrink-0 cursor-pointer"
                            title="Delete this log"
                            onClick={() => setDeleteTarget(email)}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && !isDeleting && setDeleteTarget(null)}>
        <DialogContent className="max-w-md w-[92vw] p-6 bg-white rounded-xl shadow-2xl">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">אישור מחיקת עדכון SEO</h3>
                <p className="text-xs text-gray-500">Delete SEO Update Log</p>
              </div>
            </div>

            <div className="bg-gray-50 p-3.5 rounded-lg border border-gray-200/80 space-y-1.5 text-xs text-gray-700">
              <p className="font-semibold text-gray-900 line-clamp-2" dir="auto">
                {deleteTarget?.title || "ללא כותרת"}
              </p>
              <div className="flex items-center justify-between text-gray-500 text-[11px] pt-1.5 border-t border-gray-200/60">
                <span>סטטוס: {deleteTarget?.status || "Scheduled"}</span>
                <span>
                  {deleteTarget?.scheduled_for
                    ? format(new Date(deleteTarget.scheduled_for), "dd/MM/yyyy HH:mm")
                    : deleteTarget?.created_at
                    ? format(new Date(deleteTarget.created_at), "dd/MM/yyyy HH:mm")
                    : ""}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed" dir="rtl">
              האם אתה בטוח שברצונך למחוק עדכון זה? הפעולה תסיר את העדכון לחלוטין ממסד הנתונים ולא ניתן לשחזרה.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                size="sm"
                disabled={isDeleting}
                onClick={() => setDeleteTarget(null)}
                className="text-xs font-semibold cursor-pointer"
              >
                ביטול / Cancel
              </Button>
              <Button
                variant="destructive"
                size="sm"
                id="btn-confirm-delete-email"
                data-name="confirm-delete-email"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="text-xs font-bold gap-1.5 bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    מוחק...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    מחק עדכון
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

