"use client";

import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, UserPlus, Mail } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const [template, setTemplate] = useState(
`<div style="font-family: sans-serif; max-w: 600px; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: white;">
  <h2 style="color: #2563eb; margin-top: 0;">BrandTactics Update</h2>
  <div style="background: #f8fafc; padding: 24px; border-radius: 8px; border: 1px solid #f1f5f9; color: #334155; line-height: 1.6;">
    [content]
  </div>
  <p style="color: #64748b; font-size: 12px; margin-top: 24px; text-align: center; border-top: 1px solid #f1f5f9; pt: 16px;">
    Sent via BrandTactics Client Portal
  </p>
</div>`
  );

  const [inviteEmail, setInviteEmail] = useState("");

  const handleSaveTemplate = () => {
    toast.success("Email template saved successfully.");
  };

  const handleInviteUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    toast.success(`Invite sent to ${inviteEmail}.`);
    setInviteEmail("");
  };

  // Preview content wrapper
  const previewHtml = template.replace('[content]', `
    <p>This is a preview of how your message will look inside the template wrapper.</p>
    <ul>
      <li>Task completed: "New Website Design"</li>
      <li>New comment from Sarah</li>
      <li>Monthly report is ready</li>
    </ul>
    <p>You can use standard HTML formatting here.</p>
  `);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1 uppercase text-[11px] font-bold tracking-widest">Manage global app settings, team members, and templates.</p>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="bg-gray-100/50 border border-gray-200 p-1 rounded-lg">
          <TabsTrigger value="users" className="px-6 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Users & Team</TabsTrigger>
          <TabsTrigger value="email" className="px-6 py-2 rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">Email Template</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6 mt-0 outline-none ring-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <UserPlus className="w-5 h-5 mr-2 text-purple-600" />
                  Invite Team Member
                </CardTitle>
                <CardDescription>
                  Send an invitation link to a colleague to create a staff account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleInviteUser} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email Address</Label>
                    <Input 
                      type="email" 
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="teammate@brandtactics.com" 
                    />
                  </div>
                  <Button type="submit" variant="default" className="w-full bg-purple-600 hover:bg-purple-700">
                    Send Invite
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="shadow-sm border-gray-200">
              <CardHeader>
                <CardTitle className="text-lg">Staff Directory</CardTitle>
                <CardDescription>Manage existing team members and their access roles.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-6">User</TableHead>
                      <TableHead>Role</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell className="pl-6">
                        <div className="font-medium text-gray-900 text-sm">imrisagive@gmail.com</div>
                      </TableCell>
                      <TableCell><Badge className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-50">Admin</Badge></TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="email" className="space-y-6 mt-0 outline-none ring-0">
          <Card className="shadow-sm border-gray-200 overflow-hidden">
            <CardHeader className="border-b bg-gray-50/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center text-lg">
                    <Mail className="w-5 h-5 mr-2 text-blue-600" />
                    Global Email Template
                  </CardTitle>
                  <CardDescription>
                    Customize the HTML wrapper for client email updates. Use exactly <code>[content]</code> where you want the body injected.
                  </CardDescription>
                </div>
                <Button onClick={handleSaveTemplate} className="bg-blue-600 hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" /> Save Template
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200 h-[600px]">
                {/* Editor Side */}
                <div className="flex flex-col h-full bg-gray-50/30">
                  <div className="px-4 py-2 border-b bg-white flex items-center justify-between">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">HTML Source</span>
                  </div>
                  <Textarea 
                    value={template}
                    onChange={(e) => setTemplate(e.target.value)}
                    className="flex-1 font-mono text-sm resize-none border-0 focus-visible:ring-0 bg-gray-900 text-green-400 p-6 shadow-none rounded-none overflow-y-auto"
                    placeholder="<div>[content]</div>"
                  />
                </div>

                {/* Preview Side */}
                <div className="flex flex-col h-full bg-gray-100/30">
                  <div className="px-4 py-2 border-b bg-white">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Live Preview</span>
                  </div>
                  <div className="flex-1 overflow-auto p-8 flex justify-center bg-[#f0f2f5]">
                    <div className="w-full max-w-[600px] shadow-lg rounded-xl overflow-hidden bg-white">
                      <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
