"use client";

import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import Link from "next/link";

const MOCK_TASKS = [
  { id: "1", title: "Keyword Research for Q4", dueDate: "2023-11-20", status: "In Progress" },
  { id: "2", title: "Technical SEO Audit", dueDate: "2023-11-25", status: "Pending" },
  { id: "3", title: "Optimize Landing Pages", dueDate: "2023-11-15", status: "Stuck" },
  { id: "4", title: "Setup Conversion Tracking", dueDate: "2023-11-30", status: "Pending" },
  { id: "5", title: "Monthly Report Generation", dueDate: "2023-12-01", status: "Completed" },
];

const MOCK_ARTICLES = [
  { id: "1", title: "Top 10 SEO Strategies for 2024", status: "Draft" },
  { id: "2", title: "How to Improve Core Web Vitals", status: "Published" },
  { id: "3", title: "The Ultimate Guide to Local SEO", status: "Draft" },
  { id: "4", title: "Why Backlinks Still Matter", status: "Published" },
  { id: "5", title: "E-A-T Explained", status: "Published" },
];

const MOCK_EMAILS = [
  { id: "1", title: "SEO Update from BrandTactics", date: "2023-11-01" },
  { id: "2", title: "Monthly Performance Report", date: "2023-10-01" },
  { id: "3", title: "New Content Strategy Approved", date: "2023-09-15" },
];

function getStatusColor(status: string) {
  switch (status) {
    case "In Progress": return "bg-blue-100 text-blue-700 hover:bg-blue-100";
    case "Stuck": return "bg-red-100 text-red-700 hover:bg-red-100";
    case "Completed": return "bg-green-100 text-green-700 hover:bg-green-100";
    case "Pending":
    case "Draft": return "bg-gray-100 text-gray-700 hover:bg-gray-100";
    case "Published": return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
    default: return "bg-gray-100 text-gray-700 hover:bg-gray-100";
  }
}

export default function ClientOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-6">
        
        {/* Tasks Overview */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold">Tasks Overview</CardTitle>
            <Link href={`/clients/${id}/tasks`} className="text-sm font-medium text-blue-600 hover:underline flex items-center">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Badge variant="outline" className="bg-gray-50">24 Total</Badge>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">8 In Progress</Badge>
              <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-50">2 Stuck</Badge>
            </div>
            
            <div className="space-y-3">
              {MOCK_TASKS.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-md bg-gray-50 border border-gray-100">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500">Due: {task.dueDate}</p>
                  </div>
                  <Badge className={`shrink-0 ${getStatusColor(task.status)}`}>
                    {task.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Articles Overview */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold">Articles Overview</CardTitle>
            <Link href={`/clients/${id}/articles`} className="text-sm font-medium text-blue-600 hover:underline flex items-center">
              View All <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-4">
              <Badge variant="outline" className="bg-gray-50">12 Total</Badge>
              <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100">4 Drafts</Badge>
              <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50">8 Published</Badge>
            </div>
            
            <div className="space-y-3">
              {MOCK_ARTICLES.map((article) => (
                <div key={article.id} className="flex items-center justify-between p-3 rounded-md bg-gray-50 border border-gray-100">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-medium text-gray-900 truncate">{article.title}</p>
                  </div>
                  <Badge className={`shrink-0 ${getStatusColor(article.status)}`}>
                    {article.status}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Client Email Updates Overview */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-bold">Recent Updates Sent</CardTitle>
            <Link href={`/clients/${id}/emails`} className="text-sm font-medium text-blue-600 hover:underline flex items-center">
              View Log <ChevronRight className="w-4 h-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {MOCK_EMAILS.map((email) => (
                <div key={email.id} className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 mb-1">{email.date}</span>
                  <p className="text-sm font-medium text-gray-900 line-clamp-2">{email.title}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
