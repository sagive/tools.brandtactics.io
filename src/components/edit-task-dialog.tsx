"use client";

import { useState } from "react";
import { DialogContent, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { BellIcon, Link2, List, Bold, Italic, Underline, Strikethrough, SmilePlus, X, Send } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function EditTaskDialog({ task }: { task?: any }) {
  const isEditing = !!task;
  const [newComment, setNewComment] = useState("");
  const [isEditingComment, setIsEditingComment] = useState(false);

  return (
    <DialogContent showCloseButton={false} className="max-w-[100%] sm:max-w-none sm:min-w-[850px] w-full sm:w-auto p-0 overflow-hidden bg-white">
      <div className="flex flex-col h-full max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <DialogTitle className="text-xl font-bold">{isEditing ? "Edit Task" : "New Task"}</DialogTitle>
          <div className="flex items-center gap-6 text-sm text-gray-500">
             
             {/* Date Picker Auto-save wrapper */}
             <div className="relative flex items-center gap-2 group cursor-pointer hover:text-gray-900">
               <span className="font-medium">Due: 04/30/2026</span>
               <Input 
                 type="date" 
                 className="absolute inset-0 opacity-0 cursor-pointer w-full h-full p-0 m-0 z-10" 
                 onChange={() => { /* Auto Save Logic */ }}
               />
             </div>
             
             {/* Reminder Dropdown */}
             <DropdownMenu>
               <DropdownMenuTrigger className="hover:text-gray-900 focus:outline-none outline-none ring-0 border-0 bg-transparent p-0 flex items-center shadow-none h-auto w-auto">
                 <BellIcon className="w-4 h-4" />
               </DropdownMenuTrigger>
               <DropdownMenuContent align="end" className="w-48">
                 <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Remind me in...</div>
                 <DropdownMenuItem>1 hour</DropdownMenuItem>
                 <DropdownMenuItem>4 hours</DropdownMenuItem>
                 <DropdownMenuItem>1 day</DropdownMenuItem>
                 <DropdownMenuItem>3 days</DropdownMenuItem>
                 <DropdownMenuItem>1 week</DropdownMenuItem>
                 <DropdownMenuItem>Next month</DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>

             {/* Close Button inline with gap */}
             <DialogClose className="hover:text-gray-900 focus:outline-none rounded-sm opacity-70 transition-opacity hover:opacity-100 outline-none ring-0 border-0 bg-transparent p-0 flex items-center shadow-none h-auto w-auto">
               <X className="w-5 h-5" />
               <span className="sr-only">Close</span>
             </DialogClose>

          </div>
        </div>

        {/* Body Content */}
        <div className="flex flex-col md:flex-row flex-1 overflow-y-auto">
          {/* Left Column Component */}
          <div className="flex-1 p-6 space-y-6 md:border-r border-gray-100">
            
            <div className="space-y-2">
              <Label className="text-gray-600 text-[13px] font-medium">Task title <span className="text-red-500">*</span></Label>
              <Input defaultValue={task?.title || ""} placeholder="Design new website homepage" className="font-medium text-base h-11" />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-600 text-[13px] font-medium">Description</Label>
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
              <div className="space-y-6">
                
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

                <div className="flex items-start gap-3 group">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-xs shrink-0">ME</div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                       <span className="font-semibold text-sm text-gray-900">You</span>
                       <span className="text-xs text-gray-400">1 hr ago</span>
                    </div>
                    {isEditingComment ? (
                      <div className="mt-1 flex flex-col items-end gap-2">
                         <Textarea defaultValue="I have attached the updated guidelines below." className="text-sm min-h-[60px]" />
                         <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setIsEditingComment(false)}>Cancel</Button>
                            <Button size="sm" onClick={() => setIsEditingComment(false)}>Save</Button>
                         </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-700">I have attached the updated guidelines below.</p>
                        <div className="flex items-center gap-3 mt-1 text-xs font-semibold text-gray-500">
                          <button className="hover:text-blue-600">Reply</button>
                          <button className="hover:text-blue-600">Like</button>
                          <button onClick={() => setIsEditingComment(true)} className="hover:text-blue-600">Edit</button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

              </div>

              {/* Add Comment Input */}
              <div className="flex gap-3 pt-4 border-t mt-4 relative">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-semibold text-xs shrink-0 mt-1">ME</div>
                <div className="relative flex-1 flex flex-col items-end">
                  <Input 
                    placeholder="Write a comment..." 
                    className="pr-10 bg-gray-50/50" 
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newComment.trim()) {
                         setNewComment("");
                      }
                    }}
                  />
                  {!newComment.trim() && <SmilePlus className="w-4 h-4 absolute right-3 top-3 text-gray-400 cursor-pointer hover:text-gray-600" />}
                  {newComment.trim() && (
                    <Button 
                      size="sm" 
                      className="mt-2 h-7 rounded bg-[#4640A0] hover:bg-[#342e81] text-xs font-semibold px-3"
                      onClick={() => setNewComment("")}
                    >
                      Publish
                    </Button>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Right Column Component */}
          <div className="w-full md:w-80 bg-gray-50/30 p-6 space-y-6 flex flex-col">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-600 text-[13px] font-medium">Status</Label>
                <Select defaultValue={task?.status || "Working on it"}>
                  <SelectTrigger className="bg-white w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Working on it">
                      <span className="flex items-center gap-2 truncate">
                        <div className="w-2.5 h-2.5 rounded-sm bg-blue-500 shrink-0" /> Working on it
                      </span>
                    </SelectItem>
                    <SelectItem value="Review">
                      <span className="flex items-center gap-2 truncate">
                        <div className="w-2.5 h-2.5 rounded-sm bg-purple-500 shrink-0" /> Review
                      </span>
                    </SelectItem>
                    <SelectItem value="Stuck">
                      <span className="flex items-center gap-2 truncate">
                        <div className="w-2.5 h-2.5 rounded-sm bg-red-500 shrink-0" /> Stuck
                      </span>
                    </SelectItem>
                    <SelectItem value="Completed">
                      <span className="flex items-center gap-2 truncate">
                        <div className="w-2.5 h-2.5 rounded-sm bg-green-500 shrink-0" /> Completed
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-600 text-[13px] font-medium">Priority</Label>
                <Select defaultValue={task?.priority || "High"}>
                  <SelectTrigger className="bg-white w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Low"><span className="text-gray-600 font-medium">Low</span></SelectItem>
                    <SelectItem value="Medium"><span className="text-yellow-600 font-medium">Medium</span></SelectItem>
                    <SelectItem value="High"><span className="text-red-600 font-medium">High</span></SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-600 text-[13px] font-medium">Created by</Label>
                <Select defaultValue="mark">
                  <SelectTrigger className="bg-white px-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mark">
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">MJ</div>
                        <span className="truncate">Mark J.</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-600 text-[13px] font-medium">Assigned to</Label>
                <Select defaultValue="mark">
                  <SelectTrigger className="bg-white px-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mark">
                      <div className="flex items-center gap-2 truncate">
                        <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-bold shrink-0">MJ</div>
                        <span className="truncate">Mark J.</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <hr className="border-gray-200 mt-6" />
            <p className="text-center text-[12px] text-gray-400 font-medium mt-6">Created: Nov 20, 2023</p>

          </div>
        </div>

      </div>
    </DialogContent>
  );
}
