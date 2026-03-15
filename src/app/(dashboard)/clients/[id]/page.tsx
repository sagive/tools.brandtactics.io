"use client";

import React, { useState, useEffect } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronRight, Loader2 } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

function getStatusColor(status: string) {
  switch (status) {
    case "Working on it":
    case "In Progress": return "bg-blue-100 text-blue-700 hover:bg-blue-100";
    case "Stuck": return "bg-red-100 text-red-700 hover:bg-red-100";
    case "Completed": return "bg-green-100 text-green-700 hover:bg-green-100";
    case "Review": return "bg-purple-100 text-purple-700 hover:bg-purple-100";
    case "Pending":
    case "Draft": return "bg-gray-100 text-gray-700 hover:bg-gray-100";
    case "Published": return "bg-emerald-100 text-emerald-700 hover:bg-emerald-100";
    default: return "bg-gray-100 text-gray-700 hover:bg-gray-100";
  }
}

export default function ClientOverview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const [data, setData] = useState<{
    tasks: any[];
    articles: any[];
    emails: any[];
    taskStats: { total: number; inProgress: number; stuck: number };
    articleStats: { total: number; draft: number; published: number };
    isLoading: boolean;
  }>({
    tasks: [],
    articles: [],
    emails: [],
    taskStats: { total: 0, inProgress: 0, stuck: 0 },
    articleStats: { total: 0, draft: 0, published: 0 },
    isLoading: true
  });

  useEffect(() => {
    async function fetchData() {
      try {
        // 1. Fetch Tasks
        const { data: tasksData } = await supabase
          .from("tasks")
          .select("*")
          .eq("client_id", id)
          .order("created_at", { ascending: false });

        // 2. Fetch Articles
        const { data: articlesData } = await supabase
          .from("articles")
          .select("*")
          .eq("client_id", id)
          .order("created_at", { ascending: false });

        // 3. Fetch Emails
        const { data: emailsData } = await supabase
          .from("email_updates")
          .select("*")
          .eq("client_id", id)
          .order("sent_date", { ascending: false })
          .limit(3);

        const tasks = tasksData || [];
        const articles = articlesData || [];
        const emails = emailsData || [];

        setData({
          tasks: tasks.slice(0, 5),
          articles: articles.slice(0, 5),
          emails: emails,
          taskStats: {
            total: tasks.length,
            inProgress: tasks.filter(t => t.status === "Working on it" || t.status === "In Progress").length,
            stuck: tasks.filter(t => t.status === "Stuck").length
          },
          articleStats: {
            total: articles.length,
            draft: articles.filter(a => a.status === "Draft").length,
            published: articles.filter(a => a.status === "Published").length
          },
          isLoading: false
        });
      } catch (error) {
        console.error("Error fetching client data:", error);
        setData(prev => ({ ...prev, isLoading: false }));
      }
    }

    fetchData();
  }, [id]);

  if (data.isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

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
              <Badge variant="outline" className="bg-gray-50">{data.taskStats.total} Total</Badge>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">{data.taskStats.inProgress} In Progress</Badge>
              <Badge variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-50">{data.taskStats.stuck} Stuck</Badge>
            </div>
            
            <div className="space-y-3">
              {data.tasks.length === 0 ? (
                <p className="text-sm text-gray-500 italic p-4 text-center bg-gray-50 rounded-md border border-dashed">No tasks found for this client.</p>
              ) : data.tasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 rounded-md bg-gray-50 border border-gray-100">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
                    <p className="text-xs text-gray-500">
                      {task.end_date ? `Due: ${format(new Date(task.end_date), "MMM d, yyyy")}` : "No due date"}
                    </p>
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
              <Badge variant="outline" className="bg-gray-50">{data.articleStats.total} Total</Badge>
              <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100">{data.articleStats.draft} Drafts</Badge>
              <Badge variant="secondary" className="bg-green-50 text-green-700 hover:bg-green-50">{data.articleStats.published} Published</Badge>
            </div>
            
            <div className="space-y-3">
              {data.articles.length === 0 ? (
                <p className="text-sm text-gray-500 italic p-4 text-center bg-gray-50 rounded-md border border-dashed">No articles found for this client.</p>
              ) : data.articles.map((article) => (
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
              {data.emails.length === 0 ? (
                <p className="col-span-full text-sm text-gray-500 italic p-8 text-center bg-gray-50 rounded-md border border-dashed">No email updates sent yet.</p>
              ) : data.emails.map((email) => (
                <div key={email.id} className="p-4 rounded-lg border border-gray-200 bg-white shadow-sm flex flex-col">
                  <span className="text-xs font-semibold text-gray-500 mb-1">
                    {email.sent_date ? format(new Date(email.sent_date), "MMM d, yyyy") : "Unknown Date"}
                  </span>
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
