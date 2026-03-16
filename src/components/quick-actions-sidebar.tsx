"use client";

import React from "react";
import { Send, FileText, TrendingUp, Mails } from "lucide-react";
import { Dialog, DialogTrigger, DialogContent } from "@/components/ui/dialog";
import { SendSeoUpdateDialog } from "@/components/send-seo-update-dialog";
import { EditTaskDialog } from "@/components/edit-task-dialog";
import { SendMultipleSeoUpdatesDialog } from "@/components/send-multiple-seo-updates-dialog";

interface QuickActionsSidebarProps {
  onAction?: () => void;
  clientId?: string;
}

export function QuickActionsSidebar({ onAction, clientId }: QuickActionsSidebarProps) {
  return (
    <div className="space-y-4 w-full">
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
      <div className="w-full p-6 bg-gray-50 border border-gray-100 rounded-xl shadow-sm hover:bg-white hover:border-gray-200 transition-all group flex items-center gap-4 cursor-not-allowed opacity-60">
        <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors duration-300">
          <TrendingUp className="w-6 h-6 text-gray-400" />
        </div>
        <div>
          <h3 className="font-bold text-gray-400">Reports Hub</h3>
          <p className="text-[10px] text-gray-300 italic">coming later</p>
        </div>
      </div>
    </div>
  );
}
