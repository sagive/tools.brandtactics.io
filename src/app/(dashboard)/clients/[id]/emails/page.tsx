"use client";

import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const ENGAGEMENT_DATA = [
  { name: '1 Nov', openRate: 40, ctr: 24 },
  { name: '5 Nov', openRate: 30, ctr: 13 },
  { name: '10 Nov', openRate: 20, ctr: 28 },
  { name: '15 Nov', openRate: 27, ctr: 39 },
  { name: '20 Nov', openRate: 18, ctr: 48 },
  { name: '25 Nov', openRate: 23, ctr: 38 },
  { name: '30 Nov', openRate: 34, ctr: 43 },
];

const DELIVERY_DATA = [
  { name: 'Delivered', value: 95 },
  { name: 'Failed', value: 5 },
];
const COLORS = ['#22c55e', '#ef4444'];

const LOG_DATA = [
  { id: "1", title: "SEO Update from BrandTactics", recipient: "jane@acme.com", status: "Delivered", date: "2023-11-30 09:41 AM" },
  { id: "2", title: "Monthly Performance Report", recipient: "jane@acme.com", status: "Delivered", date: "2023-11-01 10:00 AM" },
  { id: "3", title: "Action Required: Analytics Access", recipient: "admin@acme.com", status: "Failed", date: "2023-10-25 03:12 PM" },
  { id: "4", title: "Content Strategy Proposal", recipient: "jane@acme.com", status: "Delivered", date: "2023-10-15 11:30 AM" },
];

export default function ClientEmails({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <h2 className="text-2xl font-bold tracking-tight text-gray-900 border-l-4 border-blue-600 pl-3">Email Analytics & Logs</h2>
        
        <Dialog>
          <DialogTrigger className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium h-9 px-4 py-2 w-full sm:w-auto bg-blue-600 text-white hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> New Notification Template
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Notification Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input placeholder="e.g., Monthly Recap" />
              </div>
              <div className="space-y-2">
                <Label>Default Body Content</Label>
                <Textarea className="min-h-[150px]" placeholder="Hello {{client_name}}, here is your monthly report..." />
              </div>
              <Button className="w-full">Save Template</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Engagement Chart */}
        <Card className="shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase">30-Day Engagement Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={ENGAGEMENT_DATA} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                  <Tooltip />
                  <Line type="monotone" dataKey="openRate" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} name="Open Rate" />
                  <Line type="monotone" dataKey="ctr" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} name="Click-Through Rate" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Delivery Pie Chart & Stats */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-gray-500 uppercase">Delivery Health</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-40 w-full mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={DELIVERY_DATA}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {DELIVERY_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            
            <div className="w-full space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center text-gray-600"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span> Delivered</span>
                <span className="font-semibold text-gray-900">118 (95%)</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="flex items-center text-gray-600"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> Failed / Bounced</span>
                <span className="font-semibold text-gray-900">7 (5%)</span>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      <Card className="shadow-sm overflow-hidden">
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <h3 className="font-semibold text-gray-900">Activity Log</h3>
          <div className="relative w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
            <Input placeholder="Search logs..." className="pl-9 h-9 text-sm" />
          </div>
        </div>
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow>
              <TableHead>Email Subject</TableHead>
              <TableHead>Recipient</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Sent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {LOG_DATA.map((log) => (
              <TableRow key={log.id} className="hover:bg-gray-50/50">
                <TableCell className="font-medium text-gray-900">{log.title}</TableCell>
                <TableCell className="text-gray-500 text-sm">{log.recipient}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={
                    log.status === 'Delivered' 
                    ? 'bg-green-50 text-green-700' 
                    : 'bg-red-50 text-red-700'
                  }>
                    {log.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-gray-500 text-sm">{log.date}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="p-3 border-t bg-gray-50/50 text-xs text-gray-500 flex items-center justify-between">
          Showing 1 to 4 of 125 logs
          <div className="flex gap-1">
            <Button variant="outline" size="sm" disabled>Prev</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
