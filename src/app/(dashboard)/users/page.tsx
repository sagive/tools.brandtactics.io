"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { UserPlus, Trash2, RotateCw, Clock, Users, Shield, Briefcase } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/auth-provider";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";

export default function UsersTeamPage() {
  const [staff, setStaff] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { profile } = useAuth();

  // Invite state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("viewer");
  const [isInviting, setIsInviting] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);

  // Permissions state
  const [permissionsUser, setPermissionsUser] = useState<any>(null); // The user currently being edited
  const [tempAccessibleClients, setTempAccessibleClients] = useState<string[]>([]); // "all" or array of IDs
  const [isSavingPermissions, setIsSavingPermissions] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [staffRes, clientsRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at', { ascending: true }),
      supabase.from('clients').select('id, name').order('name')
    ]);
    
    if (staffRes.data) setStaff(staffRes.data);
    if (clientsRes.data) setClients(clientsRes.data);
    setIsLoading(false);
  };

  const handleInviteUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail) return;
    
    setIsInviting(true);
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole, accessible_clients: ["all"] })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to send invite");
      
      toast.success(`Invite sent successfully to ${inviteEmail}.`);
      setInviteEmail("");
      setInviteRole("viewer");
      setIsInviteOpen(false);
      
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to invite user");
    } finally {
      setIsInviting(false);
    }
  };

  const handleResendInvite = async (email: string, role: string) => {
    toast.info("Resending invite...");
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success("Invite resent successfully.");
      fetchData();
    } catch (err: any) {
      toast.error(err.message || "Failed to resend invite");
    }
  };

  const handleDeleteUser = async (id: string, email: string, isInvite: boolean = false) => {
    const msg = isInvite ? "Are you sure you want to revoke this invitation?" : "Are you sure you want to remove this user from the system?";
    if (!confirm(msg)) return;
    
    try {
      const res = await fetch(`/api/invites?id=${id}&email=${email}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      toast.success(isInvite ? "Invitation revoked" : "User removed");
      setStaff(prev => prev.filter(member => member.id !== id));
    } catch (err: any) {
      toast.error(err.message || (isInvite ? "Failed to revoke invitation" : "Failed to remove user"));
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase.from('users').update({ role: newRole }).eq('id', userId);
      if (error) throw error;
      toast.success("Role updated successfully");
      setStaff(prev => prev.map(member => member.id === userId ? { ...member, role: newRole } : member));
    } catch (err: any) {
      toast.error("Failed to update role");
    }
  };

  const handleSavePermissions = async () => {
    if (!permissionsUser) return;
    setIsSavingPermissions(true);
    try {
      // Make sure backend has 'accessible_clients' JSONB column in users
      const { error } = await supabase
        .from('users')
        .update({ accessible_clients: tempAccessibleClients })
        .eq('id', permissionsUser.id);
        
      if (error) throw error;
      
      toast.success("Client access updated");
      setStaff(prev => prev.map(m => m.id === permissionsUser.id ? { ...m, accessible_clients: tempAccessibleClients } : m));
      setPermissionsUser(null);
    } catch (err: any) {
      toast.error("Failed to update access: Ensure 'accessible_clients' JSONB column exists on 'users' table.");
    } finally {
      setIsSavingPermissions(false);
    }
  };

  const openPermissions = (user: any) => {
    setPermissionsUser(user);
    // Determine default state: if not set, assume "all" for backwards capability
    if (!user.accessible_clients || user.accessible_clients.length === 0) {
      setTempAccessibleClients(["all"]);
    } else {
      setTempAccessibleClients(user.accessible_clients);
    }
  };

  const toggleClientAccess = (clientId: string, checked: boolean) => {
    if (clientId === "all") {
      setTempAccessibleClients(checked ? ["all"] : []);
      return;
    }
    
    let current = [...tempAccessibleClients];
    if (current.includes("all")) current = []; // Break out of "all" mode if specifically picking
    
    if (checked) {
      current.push(clientId);
      if (current.length === clients.length) current = ["all"];
    } else {
      current = current.filter(id => id !== clientId);
    }
    setTempAccessibleClients(current);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">User Management</h1>
          <p className="text-gray-500 mt-1">Manage team members, roles, and client access permissions.</p>
        </div>
        
        {profile?.role === 'admin' && (
          <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
                <UserPlus className="w-4 h-4 mr-2" /> Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation link to a colleague to create a staff account.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleInviteUser} className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>Email Address</Label>
                  <Input 
                    type="email" 
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="teammate@agency.com" 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(val) => setInviteRole(val || "viewer")}>
                    <SelectTrigger className="w-full bg-white">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="author">Author</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isInviting}>
                  {isInviting ? "Sending..." : "Send Invitation"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card className="shadow-sm border-gray-200">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent bg-gray-50/50">
                <TableHead className="pl-6 font-semibold">User</TableHead>
                <TableHead className="font-semibold">Role</TableHead>
                <TableHead className="font-semibold">Client Access</TableHead>
                <TableHead className="text-right pr-6 font-semibold">Status / Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staff.map((member) => {
                const isAdminUser = member.role === 'admin';
                const hasAllAccess = !member.accessible_clients || member.accessible_clients.includes("all") || isAdminUser;
                const clientCount = member.accessible_clients?.length || 0;
                
                return (
                  <TableRow key={member.id} className="hover:bg-gray-50/50 group">
                    <TableCell className="pl-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-semibold text-xs shrink-0">
                          {member.email.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 text-sm">{member.full_name || "Unnamed"}</div>
                          <div className="text-gray-500 text-xs">{member.email}</div>
                          {member.status === 'invited' && (
                            <div className="text-[10px] text-gray-400 mt-0.5 flex items-center">
                              <Clock className="w-3 h-3 mr-1 inline" />
                              Invited {member.invited_at ? new Date(member.invited_at).toLocaleDateString() : 'recently'}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {profile?.role === 'admin' && member.email !== profile?.email ? (
                        <Select 
                          value={member.role || 'viewer'} 
                          onValueChange={(val) => handleUpdateRole(member.id, val)}
                        >
                          <SelectTrigger className="w-[120px] h-8 text-xs bg-transparent border-gray-200 hover:bg-gray-50 transition-colors">
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="author">Author</SelectItem>
                            <SelectItem value="viewer">Viewer</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={cn("capitalize font-semibold", member.role === 'admin' ? "bg-purple-50 text-purple-700 hover:bg-purple-50 border-purple-200" : "bg-gray-100 text-gray-700 border-gray-200")}>
                          {member.role || 'Staff'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {isAdminUser ? (
                        <div className="flex items-center text-xs font-medium text-gray-500">
                           <Shield className="w-3.5 h-3.5 mr-1.5 text-purple-400" /> Full Access
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                           <Badge variant="outline" className={cn("bg-blue-50/50 text-blue-700 border-blue-200 shadow-none font-medium", hasAllAccess && "bg-green-50/50 text-green-700 border-green-200")}>
                              {hasAllAccess ? "All Clients" : `${clientCount} Clients`}
                           </Badge>
                           {profile?.role === 'admin' && (
                             <Button variant="ghost" size="sm" onClick={() => openPermissions(member)} className="h-7 text-xs px-2 text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity">
                               Edit
                             </Button>
                           )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right pr-6">
                      <div className="flex items-center justify-end gap-2">
                        {member.status === 'invited' ? (
                          <>
                            {profile?.role === 'admin' && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50" onClick={() => handleResendInvite(member.email, member.role)} title="Resend Invite">
                                  <RotateCw className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteUser(member.id, member.email, true)} title="Revoke Invitation">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Badge variant="default" className="bg-orange-100 text-orange-700 hover:bg-orange-100 shadow-none border-none">Pending</Badge>
                          </>
                        ) : (
                          <>
                            {profile?.role === 'admin' && member.email !== profile?.email && (
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteUser(member.id, member.email, false)} title="Remove User">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 font-semibold shadow-none">Active</Badge>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {staff.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                    No team members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Permissions Dialog */}
      <Dialog open={!!permissionsUser} onOpenChange={(open) => !open && setPermissionsUser(null)}>
        <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Client Access</DialogTitle>
            <DialogDescription>
              Select which clients <strong className="text-gray-900">{permissionsUser?.full_name || permissionsUser?.email}</strong> can view and edit.
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto py-4 space-y-4">
            <div className="flex items-center space-x-3 p-3 border rounded-lg bg-gray-50">
              <Checkbox 
                id="all-clients" 
                checked={tempAccessibleClients.includes("all")}
                onCheckedChange={(c) => toggleClientAccess("all", !!c)}
              />
              <div className="space-y-1 leading-none">
                <label htmlFor="all-clients" className="text-sm font-medium leading-none cursor-pointer">
                  All Clients Complete Access
                </label>
                <p className="text-xs text-muted-foreground">User will automatically see all future clients too.</p>
              </div>
            </div>
            
            <div className="space-y-3 px-1">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Specific Clients</h4>
              <div className={cn("space-y-2", tempAccessibleClients.includes("all") && "opacity-50 pointer-events-none")}>
                {clients.map(client => (
                  <div key={client.id} className="flex items-center space-x-3 group">
                    <Checkbox 
                      id={`client-${client.id}`} 
                      checked={tempAccessibleClients.includes("all") || tempAccessibleClients.includes(client.id)}
                      onCheckedChange={(c) => toggleClientAccess(client.id, !!c)}
                    />
                    <label htmlFor={`client-${client.id}`} className="text-sm font-medium leading-none cursor-pointer group-hover:text-blue-600 transition-colors">
                      {client.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t mt-auto">
            <Button variant="outline" onClick={() => setPermissionsUser(null)}>Cancel</Button>
            <Button onClick={handleSavePermissions} disabled={isSavingPermissions} className="bg-blue-600 hover:bg-blue-700">
              {isSavingPermissions ? "Saving..." : "Save Access"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
