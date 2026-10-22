"use client";

import React from "react";
import { Send, FileText, TrendingUp, Mails, Lock } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/auth-provider";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { SendSeoUpdateDialog } from "@/components/send-seo-update-dialog";
import { EditTaskDialog } from "@/components/edit-task-dialog";
import { SendMultipleSeoUpdatesDialog } from "@/components/send-multiple-seo-updates-dialog";

interface QuickActionsSidebarProps {
  onAction?: () => void;
  clientId?: string;
  layout?: "vertical" | "horizontal";
}

export function QuickActionsSidebar({ onAction, clientId, layout = "vertical" }: QuickActionsSidebarProps) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const isHorizontal = layout === "horizontal";

  return (
    <div className={isHorizontal ? "flex flex-wrap items-center gap-2" : "space-y-2.5 w-full"}>
      {/* Create New Task Action */}
      <Dialog>
        <DialogTrigger render={
          <button
            id="btn-create-new-task"
            data-name="create-new-task"
            type="button"
            className={isHorizontal
              ? "h-8 px-2.5 bg-white border border-gray-200 rounded-lg shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all group flex items-center gap-1.5 cursor-pointer text-left"
              : "w-full p-2 sm:p-2.5 bg-white border border-gray-200 rounded-xl shadow-xs hover:border-blue-400 hover:shadow-sm transition-all group flex items-center gap-2.5 cursor-pointer text-left"
            }
          >
            <div className={isHorizontal
              ? "w-5 h-5 rounded bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 transition-colors duration-200 shrink-0"
              : "w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 transition-colors duration-300 shrink-0"
            }>
              <FileText className={isHorizontal ? "w-3 h-3 text-orange-500 group-hover:text-white transition-colors" : "w-4 h-4 text-orange-500 group-hover:text-white transition-colors duration-300"} />
            </div>
            <div className={isHorizontal ? "" : "min-w-0 flex-1"}>
              <h3 className={isHorizontal ? "font-semibold text-xs text-gray-800 whitespace-nowrap" : "font-semibold text-xs sm:text-sm text-gray-900 leading-tight truncate"}>
                New Task
              </h3>
            </div>
          </button>
        } />
        <EditTaskDialog defaultClientId={clientId} onTaskCreated={() => {
          window.dispatchEvent(new Event("taskCreated"));
          onAction?.();
        }} />
      </Dialog>

      {/* Send SEO Update Action */}
      <div className={isHorizontal ? "" : "w-full"}>
        <SendSeoUpdateDialog 
          defaultClientId={clientId}
          onSuccess={() => {
            window.dispatchEvent(new Event("email-scheduled"));
            onAction?.();
          }}
          trigger={
            <button
              id="btn-send-seo-update"
              data-name="send-seo-update"
              type="button"
              className={isHorizontal
                ? "h-8 px-2.5 bg-white border border-gray-200 rounded-lg shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all group flex items-center gap-1.5 cursor-pointer text-left"
                : "w-full p-2 sm:p-2.5 bg-white border border-gray-200 rounded-xl shadow-xs hover:border-blue-400 hover:shadow-sm transition-all group flex items-center gap-2.5 cursor-pointer text-left"
              }
            >
              <div className={isHorizontal
                ? "w-5 h-5 rounded bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-200 shrink-0"
                : "w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300 shrink-0"
              }>
                <Send className={isHorizontal ? "w-3 h-3 text-blue-600 group-hover:text-white transition-colors" : "w-4 h-4 text-blue-600 group-hover:text-white transition-colors duration-300"} />
              </div>
              <div className={isHorizontal ? "" : "min-w-0 flex-1"}>
                <h3 className={isHorizontal ? "font-semibold text-xs text-gray-800 whitespace-nowrap" : "font-semibold text-xs sm:text-sm text-gray-900 leading-tight truncate"}>
                  + Seo Update
                </h3>
              </div>
            </button>
          }
        />
      </div>

      {/* Schedule Multiple SEO Updates Action */}
      <div className={isHorizontal ? "" : "w-full"}>
        <SendMultipleSeoUpdatesDialog 
          defaultClientId={clientId}
          onSuccess={() => {
            window.dispatchEvent(new Event("email-scheduled"));
            onAction?.();
          }}
          trigger={
            <button
              id="btn-schedule-seo-updates"
              data-name="schedule-seo-updates"
              type="button"
              className={isHorizontal
                ? "h-8 px-2.5 bg-white border border-gray-200 rounded-lg shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all group flex items-center gap-1.5 cursor-pointer text-left"
                : "w-full p-2 sm:p-2.5 bg-white border border-gray-200 rounded-xl shadow-xs hover:border-blue-400 hover:shadow-sm transition-all group flex items-center gap-2.5 cursor-pointer text-left"
              }
            >
              <div className={isHorizontal
                ? "w-5 h-5 rounded bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-200 shrink-0"
                : "w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300 shrink-0"
              }>
                <Mails className={isHorizontal ? "w-3 h-3 text-blue-600 group-hover:text-white transition-colors" : "w-4 h-4 text-blue-600 group-hover:text-white transition-colors duration-300"} />
              </div>
              <div className={isHorizontal ? "" : "min-w-0 flex-1"}>
                <h3 className={isHorizontal ? "font-semibold text-xs text-gray-800 whitespace-nowrap" : "font-semibold text-xs sm:text-sm text-gray-900 leading-tight truncate"}>
                  Mass Updates
                </h3>
              </div>
            </button>
          }
        />
      </div>

      {/* Reports Hub Action */}
      {isAdmin ? (
        <Link href={`/reports${clientId ? `?clientId=${clientId}` : ''}`} className={isHorizontal ? "" : "w-full"}>
          <div
            id="btn-reports-hub"
            data-name="reports-hub"
            className={isHorizontal
              ? "h-8 px-2.5 bg-white border border-gray-200 rounded-lg shadow-2xs hover:border-blue-400 hover:shadow-xs transition-all group flex items-center gap-1.5 cursor-pointer"
              : "w-full p-2 sm:p-2.5 bg-white border border-gray-200 rounded-xl shadow-xs hover:border-blue-400 hover:shadow-sm transition-all group flex items-center gap-2.5 cursor-pointer"
            }
          >
            <div className={isHorizontal
              ? "w-5 h-5 rounded bg-purple-50 flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-200 shrink-0"
              : "w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-300 shrink-0"
            }>
              <TrendingUp className={isHorizontal ? "w-3 h-3 text-purple-600 group-hover:text-white transition-colors" : "w-4 h-4 text-purple-600 group-hover:text-white transition-colors duration-300"} />
            </div>
            <div className={isHorizontal ? "" : "min-w-0 flex-1"}>
              <h3 className={isHorizontal ? "font-semibold text-xs text-gray-800 whitespace-nowrap" : "font-semibold text-xs sm:text-sm text-gray-900 leading-tight truncate"}>
                Reports Hub
              </h3>
            </div>
          </div>
        </Link>
      ) : (
        <button
          disabled
          id="btn-reports-hub"
          data-name="reports-hub"
          type="button"
          className={isHorizontal
            ? "h-8 px-2.5 bg-gray-50 border border-gray-100 rounded-lg shadow-2xs opacity-60 flex items-center gap-1.5 cursor-not-allowed text-left"
            : "w-full p-2 sm:p-2.5 bg-gray-50 border border-gray-100 rounded-xl shadow-xs opacity-60 flex items-center gap-2.5 cursor-not-allowed relative overflow-hidden group text-left"
          }
        >
          <div className={isHorizontal
            ? "w-5 h-5 rounded bg-gray-100 flex items-center justify-center shrink-0"
            : "w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0"
          }>
            <TrendingUp className={isHorizontal ? "w-3 h-3 text-gray-400" : "w-4 h-4 text-gray-400"} />
          </div>
          <div className={isHorizontal ? "" : "min-w-0 flex-1"}>
            <h3 className={isHorizontal ? "font-semibold text-xs text-gray-400 flex items-center gap-1 leading-tight whitespace-nowrap" : "font-semibold text-xs sm:text-sm text-gray-400 flex items-center gap-1.5 leading-tight truncate"}>
              Reports Hub
              <Lock className="w-3 h-3 shrink-0" />
            </h3>
          </div>
        </button>
      )}
    </div>
  );
}
