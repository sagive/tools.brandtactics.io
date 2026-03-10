"use client";

import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { CalendarIcon, BellIcon, Link2, List, Bold, Italic, Underline, Strikethrough, SmilePlus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function EditTaskDialog({ task }: { task?: any }) {
  const isEditing = !!task;

  return (
    <DialogContent className="max-w-[100%] sm:max-w-none sm:min-w-[850px] w-full sm:w-auto p-0 overflow-hidden bg-white">
      <div className="flex flex-col h-full max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <DialogTitle className="text-xl font-bold">{isEditing ? "Edit Task" : "New Task"}</DialogTitle>
          <div className="flex items-center gap-4 text-sm text-gray-500">
             <span className="font-medium">Due: 04/30/2026</span>
             <CalendarIcon className="w-4 h-4 cursor-pointer hover:text-gray-900" />
             <BellIcon className="w-4 h-4 cursor-pointer hover:text-gray-900" />
          </div>
        </div>

        {/* Body Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto">
          {/* Left Column Component */}
          <div className="flex-1 p-6 space-y-6 md:border-r border-gray-100">
            
            <div className="space-y-2">
              <Label className="text-gray-600 font-semibold">Task title <span className="text-red-500">*</span></Label>
              <Input defaultValue={task?.title || ""} placeholder="Design new website homepage" className="font-medium text-base h-11" />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-600 font-semibold">Description</Label>
              <div className="border rounded-md overflow-hidden bg-white focus-within:ring-1 focus-within:ring-blue-500 focus-within:border-blue-500">
                 {/* Fake toolbar */}
                 <div className="flex items-center gap-1 border-b bg-gray-50/50 p-2 text-gray-500">
                   <Button variant="ghost" size="icon" className="h-7 w-7"><Bold className="w-3.5 h-3.5" /></Button>
                   <Button variant="ghost" size="icon" className="h-7 w-7"><Italic className="w-3.5 h-3.5" /></Button>
                   <Button variant="ghost" size="icon" className="h-7 w-7"><Underline className="w-3.5 h-3.5" /></Button>
                   <Button variant="ghost" size="icon" className="h-7 w-7"><Strikethrough className="w-3.5 h-3.5" /></Button>
                   <div className="w-px h-4 bg-gray-300 mx-1" />
                   <Button variant="ghost" size="icon" className="h-7 w-7"><List className="w-4 h-4" /></Button>
                   <Button variant="ghost" size="icon" className="h-7 w-7"><Link2 className="w-4 h-4" /></Button>
                 </div>
                 <Textarea 
                   defaultValue="Create a new homepage design for the client with updated branding and a modern layout."
                   className="min-h-[120px] resize-none border-0 focus-visible:ring-0 rounded-none shadow-none" 
                 />
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <Label className="text-gray-900 font-bold text-base">Comments</Label>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs shrink-0 pt-0.5">MJ</div>
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                       <span className="font-semibold text-sm text-gray-900">Mark Johnson</span>
                       <span className="text-xs text-gray-400">2 hrs ago</span>
                    </div>
                    <p className="text-sm text-gray-700">Can you share the brand guidelines and assets for this project?</p>
                    <div className="flex items-center gap-3 mt-1 text-xs font-semibold text-gray-500">
                      <button className="hover:text-blue-600">Reply</button>
                      <button className="hover:text-blue-600">Like</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add Comment Input */}
              <div className="flex gap-3 pt-4 border-t mt-4">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-xs shrink-0">ME</div>
                <div className="relative flex-1">
                  <Input placeholder="Write a comment..." className="pr-10 bg-gray-50/50" />
                  <SmilePlus className="w-4 h-4 absolute right-3 top-2.5 text-gray-400 cursor-pointer hover:text-gray-600" />
                </div>
              </div>
            </div>

          </div>

          {/* Right Column Component */}
          <div className="w-full md:w-80 bg-gray-50/30 p-6 space-y-6">
            
            <div className="space-y-2">
              <Label className="text-gray-600 font-semibold">Status</Label>
              <Select defaultValue={task?.status || "Working on it"}>
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Working on it">
                    <span className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" /> Working on it
                    </span>
                  </SelectItem>
                  <SelectItem value="Review">
                    <span className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm bg-purple-500" /> Review
                    </span>
                  </SelectItem>
                  <SelectItem value="Stuck">
                    <span className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm bg-red-500" /> Stuck
                    </span>
                  </SelectItem>
                  <SelectItem value="Completed">
                    <span className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-sm bg-green-500" /> Completed
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-600 font-semibold">Created by</Label>
              <Select defaultValue="mark">
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mark">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">MJ</div>
                      <span>Mark Johnson</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-600 font-semibold">Assignee</Label>
              <Select defaultValue="mark">
                <SelectTrigger className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mark">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold">MJ</div>
                      <span>Mark Johnson</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-600 font-semibold">Start Date</Label>
                <Input type="date" className="bg-white text-sm" defaultValue="2024-04-24" />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-600 font-semibold">End Date</Label>
                <Input type="date" className="bg-white text-sm" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-600 font-semibold">Estimate</Label>
              <Select defaultValue="10h">
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5h">5h</SelectItem>
                  <SelectItem value="10h">10h</SelectItem>
                  <SelectItem value="20h">20h</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-600 font-semibold">Priority</Label>
              <Select defaultValue={task?.priority || "High"}>
                <SelectTrigger className="bg-white"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Low"><span className="text-gray-600 font-medium">Low</span></SelectItem>
                  <SelectItem value="Medium"><span className="text-yellow-600 font-medium">Medium</span></SelectItem>
                  <SelectItem value="High"><span className="text-red-600 font-medium">High</span></SelectItem>
                </SelectContent>
              </Select>
            </div>

          </div>
        </div>
        
        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t bg-gray-50/50 gap-3">
          <Button variant="ghost" className="text-gray-600 font-semibold">Cancel</Button>
          <Button className="bg-[#4640A0] hover:bg-[#342e81] text-white font-semibold px-8 shadow-sm">Save</Button>
        </div>

      </div>
    </DialogContent>
  );
}
