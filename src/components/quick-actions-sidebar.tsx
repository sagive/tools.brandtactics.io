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
          <div className="w-full p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all group flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center group-hover:bg-orange-500 transition-colors duration-300">
              <FileText className="w-5 h-5 text-orange-500 group-hover:text-white transition-colors duration-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 leading-tight">Create New Task</h3>
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
            <div className="w-full p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all group flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                <Send className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 leading-tight">+ Seo Update</h3>
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
            <div className="w-full p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all group flex items-center gap-3 cursor-pointer">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300">
                <Mails className="w-5 h-5 text-blue-600 group-hover:text-white transition-colors duration-300" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900 leading-tight">Schedule Seo Updates</h3>
              </div>
            </div>
          }
        />
      </div>

      {/* Reports Hub Action */}
      {isAdmin ? (
        <Link href={`/reports${clientId ? `?clientId=${clientId}` : ''}`} className="w-full">
          <div className="w-full p-3 bg-white border border-gray-200 rounded-xl shadow-sm hover:border-blue-400 hover:shadow-md transition-all group flex items-center gap-3 cursor-pointer">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center group-hover:bg-purple-600 transition-colors duration-300">
              <TrendingUp className="w-5 h-5 text-purple-600 group-hover:text-white transition-colors duration-300" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-900 leading-tight">Reports Hub</h3>
            </div>
          </div>
        </Link>
      ) : (
        <div className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl shadow-sm opacity-60 flex items-center gap-3 cursor-not-allowed relative overflow-hidden group">
          <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-gray-400 flex items-center gap-2 leading-tight">
              Reports Hub
              <Lock className="w-3 h-3" />
            </h3>
          </div>
        </div>
      )}
    </div>
  );
}
