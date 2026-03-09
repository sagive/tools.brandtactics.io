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

export default function SettingsPage() {
  const [template, setTemplate] = useState(
`<div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
  <h2 style="color: #2563eb;">BrandTactics Update</h2>
  <div style="background: #f8fafc; padding: 20px; border-radius: 8px;">
    [content]
  </div>
  <p style="color: #64748b; font-size: 12px; margin-top: 20px;">
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

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Settings</h1>
        <p className="text-gray-500 mt-1">Manage global app settings, team members, and templates.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Email Template Settings */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center text-lg">
                <Mail className="w-5 h-5 mr-2 text-blue-600" />
                Global Email Template
              </CardTitle>
              <CardDescription>
                Customize the HTML wrapper for client email updates. Use exactly <code>[content]</code> where you want the message body injected.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>HTML Template Source</Label>
                <Textarea 
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="font-mono text-sm h-64 bg-gray-900 text-green-400 placeholder:text-gray-500"
                  placeholder="<div>[content]</div>"
                />
              </div>
              <Button onClick={handleSaveTemplate} className="bg-blue-600 hover:bg-blue-700">
                <Save className="w-4 h-4 mr-2" /> Save Template
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* User Management Settings */}
        <div className="space-y-6">
          <Card className="shadow-sm">
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
                <Button type="submit" variant="outline" className="w-full">
                  Send Invite
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Staff Directory</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>
                      <div className="font-medium text-gray-900 text-sm">imrisagive@gmail.com</div>
                    </TableCell>
                    <TableCell><Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Admin</Badge></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
