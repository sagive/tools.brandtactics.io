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
}

export function QuickActionsSidebar({ onAction, clientId }: QuickActionsSidebarProps) {
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';

  return (
    <div className="space-y-4 w-full">
      {/* Create New Task Action */}
      <Dialog>
        <DialogTrigger className="w-full text-left">
          <div className="w-full p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all group flex items-center gap-4 cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 transition-colors duration-300">
              <FileText className="w-6 h-6 text-orange-500 group-hover:text-white transition-colors duration-300" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Create New Task</h3>
              <p className="text-xs text-gray-500">NEW TASK POPUP</p>
            </div>
          </div>
        </DialogTrigger>
        <EditTaskDialog defaultClientId={clientId} onTaskCreated={() => {
          window.dispatchEvent(new Event("taskCreated"));
          onAction?.();
        }} />
      </Dialog>

      {/* Send SEO Update Action */}
      <div className="w-full">
        <SendSeoUpdateDialog 
          defaultClientId={clientId}
          onSuccess={() => {
            window.dispatchEvent(new Event("email-scheduled"));
            onAction?.();
          }}
          trigger={
            <div className="w-full p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all group flex items-center gap-4 cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                <Send className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">+ Seo Update</h3>
                <p className="text-xs text-gray-500">NEW UPDATE POPUP</p>
              </div>
            </div>
          }
        />
      </div>

      {/* Schedule Multiple SEO Updates Action */}
      <div className="w-full">
        <SendMultipleSeoUpdatesDialog 
          defaultClientId={clientId}
          onSuccess={() => {
            window.dispatchEvent(new Event("email-scheduled"));
            onAction?.();
          }}
          trigger={
            <div className="w-full p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all group flex items-center gap-4 cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                <Mails className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900">Schedule Seo Updates</h3>
                <p className="text-xs text-gray-500 uppercase">set and forget multiple seo update</p>
              </div>
            </div>
          }
        />
      </div>

      {/* Reports Hub Action */}
      {isAdmin ? (
        <Link href={`/reports${clientId ? `?clientId=${clientId}` : ''}`} className="w-full">
          <div className="w-full p-6 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all group flex items-center gap-4 cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-300">
              <TrendingUp className="w-6 h-6 text-purple-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Reports Hub</h3>
              <p className="text-xs text-gray-500 uppercase tracking-tight">View analytics & insights</p>
            </div>
          </div>
        </Link>
      ) : (
        <div className="w-full p-6 bg-gray-50 border border-gray-100 rounded-xl shadow-sm opacity-60 flex items-center gap-4 cursor-not-allowed relative overflow-hidden group">
          <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h3 className="font-bold text-gray-400 flex items-center gap-2">
              Reports Hub
              <Lock className="w-3 h-3" />
            </h3>
            <p className="text-[10px] text-gray-300 italic">Admin access required</p>
          </div>
        </div>
      )}
    </div>
  );
}
