"use client";

import { Bell, Search } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/components/auth-provider";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useState, useEffect } from "react";
import { Check, Trash2, Eye, Circle } from "lucide-react";

export function TopNav() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<any[]>([]);

  const fetchNotifications = async () => {
    if (!profile?.email) return;
    const { data } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_email', profile.email)
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();
    
    // Subscribe to new notifications
    const channel = supabase.channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.email]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const handleNotificationClick = async (notif: any) => {
    if (!notif.is_read) {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notif.id);
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    }
    if (notif.action_url) {
      router.push(notif.action_url);
    }
  };

  const markAsRead = async (e: any, id: string) => {
    e.stopPropagation();
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const deleteNotification = async (e: any, id: string) => {
    e.stopPropagation();
    await supabase.from('notifications').delete().eq('id', id);
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = async () => {
    if (!profile?.email) return;
    await supabase.from('notifications').update({ is_read: true }).eq('user_email', profile.email);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Staff Member";
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <header className="h-16 border-b bg-white flex items-center justify-between px-6 z-10 sticky top-0">
      <div className="flex-1 max-w-md hidden md:block">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Search clients, tasks..."
            className="pl-9 bg-gray-50 border-gray-200 focus-visible:ring-blue-500 w-full"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        <span className="text-xs font-semibold text-gray-400 select-none mr-2">v1.0.2</span>

        <Popover>
          <PopoverTrigger className="relative p-2 text-gray-400 hover:text-gray-500">
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500 ring-2 ring-white" />
            )}
            <Bell className="h-5 w-5" />
          </PopoverTrigger>
          <PopoverContent align="end" className="w-[380px] p-0 shadow-lg">
            <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50/80">
              <span className="font-semibold text-sm">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllAsRead} className="text-xs text-blue-600 hover:underline">
                  Mark all as read
                </button>
              )}
            </div>
            <div className="max-h-[400px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  No notifications yet
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <div 
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={`group relative flex flex-col gap-1 border-b p-4 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.is_read ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-1">
                          <p className="text-sm font-medium leading-none flex items-center gap-2 text-gray-900">
                            {notif.title}
                            {!notif.is_read && <span className="flex h-2 w-2 rounded-full bg-blue-600" />}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-gray-400 pt-1">
                            {new Date(notif.created_at).toLocaleDateString()} {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})}
                          </p>
                        </div>
                        
                        {/* Action hints on hover */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2 shrink-0 bg-white/50 backdrop-blur-sm self-start rounded p-1">
                          {!notif.is_read && (
                            <button 
                              onClick={(e) => markAsRead(e, notif.id)}
                              className="text-gray-400 hover:text-blue-600 p-1 rounded hover:bg-white"
                              title="Mark as read"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button 
                            onClick={(e) => deleteNotification(e, notif.id)}
                            className="text-gray-400 hover:text-red-600 p-1 rounded hover:bg-white"
                            title="Delete"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="h-6 w-px bg-gray-200" />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`https://avatar.vercel.sh/${user?.email}.png`} alt={displayName} />
                <AvatarFallback>{displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="text-sm font-medium text-gray-700 hidden sm:block">
                {displayName}
              </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push("/settings?tab=profile")}>
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem>Agency Preferences</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
