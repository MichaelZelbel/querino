import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Search, Shield, Save, Users, Trash2, Coins } from "lucide-react";
import { format } from "date-fns";
import { AICreditSettings } from "@/components/admin/AICreditSettings";
import { UserTokenBalance } from "@/components/admin/UserTokenBalance";
import { UserTokenModal } from "@/components/admin/UserTokenModal";
import type { AppRole } from "@/types/userRole";

interface AllowancePeriod {
  id: string;
  user_id: string;
  tokens_granted: number;
  tokens_used: number;
}

interface UserWithRole {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: AppRole;
  created_at: string | null;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthContext();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [editedUsers, setEditedUsers] = useState<Record<string, { role?: AppRole }>>({});
  const [allowances, setAllowances] = useState<Record<string, AllowancePeriod>>({});
  const [tokenModalUser, setTokenModalUser] = useState<{ id: string; displayName: string | null } | null>(null);

  // Access control check
  useEffect(() => {
    if (!authLoading && !roleLoading) {
      if (!user) {
        toast.error("You don't have permission to view the admin panel.");
        navigate("/");
        return;
      }
      if (!isAdmin) {
        toast.error("You don't have permission to view the admin panel.");
        navigate("/");
        return;
      }
    }
  }, [user, isAdmin, authLoading, roleLoading, navigate]);

  // Fetch users and initialize allowances
  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      initializeAndFetchAllowances();
    }
  }, [isAdmin]);

  const initializeAndFetchAllowances = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await supabase.functions.invoke("ensure-token-allowance", {
        body: { batch_init: true },
      });

      if (response.error) {
        console.error("Error initializing allowances:", response.error);
        await fetchAllowances();
        return;
      }

      if (response.data?.results) {
        const allowanceMap: Record<string, AllowancePeriod> = {};
        response.data.results.forEach((result: any) => {
          if (result.status === "exists" || result.status === "created") {
            const balance = result.balance;
            allowanceMap[result.userId] = {
              id: balance.id,
              user_id: balance.user_id,
              tokens_granted: balance.tokens_granted,
              tokens_used: balance.tokens_used,
            };
          }
        });
        setAllowances(allowanceMap);
      } else {
        await fetchAllowances();
      }
    } catch (error) {
      console.error("Error in initializeAndFetchAllowances:", error);
      await fetchAllowances();
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, created_at")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles from user_roles table
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Create a map of user_id to role
      const roleMap = new Map<string, AppRole>();
      (roles || []).forEach((r) => {
        roleMap.set(r.user_id, r.role as AppRole);
      });

      // Combine profiles with roles
      const usersWithRoles: UserWithRole[] = (profiles || []).map((p) => ({
        id: p.id,
        display_name: p.display_name,
        avatar_url: p.avatar_url,
        created_at: p.created_at,
        role: roleMap.get(p.id) || "free",
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllowances = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("ai_allowance_periods")
        .select("id, user_id, tokens_granted, tokens_used, period_start, period_end")
        .lte("period_start", now)
        .gt("period_end", now);

      if (error) throw error;

      const allowanceMap: Record<string, AllowancePeriod> = {};
      (data || []).forEach((row) => {
        if (!allowanceMap[row.user_id] || row.period_end > allowanceMap[row.user_id].id) {
          allowanceMap[row.user_id] = {
            id: row.id,
            user_id: row.user_id,
            tokens_granted: row.tokens_granted,
            tokens_used: row.tokens_used,
          };
        }
      });
      setAllowances(allowanceMap);
    } catch (error) {
      console.error("Error fetching allowances:", error);
    }
  };

  const handleAllowanceUpdate = (userId: string, newAllowance: AllowancePeriod) => {
    setAllowances((prev) => ({
      ...prev,
      [userId]: newAllowance,
    }));
  };

  const handleRoleChange = (userId: string, value: AppRole) => {
    setEditedUsers((prev) => ({
      ...prev,
      [userId]: { role: value },
    }));
  };

  const handleSaveUser = async (userId: string) => {
    const changes = editedUsers[userId];
    if (!changes?.role) return;

    setSavingUserId(userId);
    try {
      // Update user_roles table
      const { error } = await supabase
        .from("user_roles")
        .update({ role: changes.role })
        .eq("user_id", userId);

      if (error) throw error;

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, role: changes.role! }
            : u
        )
      );

      // Clear edited state for this user
      setEditedUsers((prev) => {
        const { [userId]: _, ...rest } = prev;
        return rest;
      });

      toast.success("User role updated successfully");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user role");
    } finally {
      setSavingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (userId === user?.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    setDeletingUserId(userId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      const response = await supabase.functions.invoke("delete-user", {
        body: { userId },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to delete user");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      setUsers((prev) => prev.filter((u) => u.id !== userId));
      
      setEditedUsers((prev) => {
        const { [userId]: _, ...rest } = prev;
        return rest;
      });

      toast.success("User deleted successfully");
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    } finally {
      setDeletingUserId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const query = searchQuery.toLowerCase();
    return (
      u.display_name?.toLowerCase().includes(query) ||
      u.id.toLowerCase().includes(query)
    );
  });

  const getInitials = (name: string | null) => {
    if (!name) return "U";
    return name.slice(0, 2).toUpperCase();
  };

  const getUserRole = (userId: string): AppRole => {
    const editedValue = editedUsers[userId]?.role;
    if (editedValue !== undefined) return editedValue;
    const userItem = users.find((u) => u.id === userId);
    return userItem?.role || "free";
  };

  const hasChanges = (userId: string) => {
    return !!editedUsers[userId] && Object.keys(editedUsers[userId]).length > 0;
  };

  // Don't render anything until auth check is complete
  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <Skeleton className="h-64 w-full" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
            <p className="text-muted-foreground">Manage users and roles</p>
          </div>
        </div>

        {/* AI Credit Settings */}
        <div className="mb-8">
          <AICreditSettings />
        </div>

        {/* Users Management */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Users Management</CardTitle>
              </div>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <CardDescription>
              {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                {searchQuery ? "No users match your search." : "No users found."}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Remaining Tokens</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-8"></TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={u.avatar_url || undefined} />
                              <AvatarFallback className="text-xs">
                                {getInitials(u.display_name)}
                              </AvatarFallback>
                            </Avatar>
                            <div className="min-w-0">
                              <p className="font-medium truncate">
                                {u.display_name || "Unnamed User"}
                              </p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {u.id}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={getUserRole(u.id)}
                            onValueChange={(value) => handleRoleChange(u.id, value as AppRole)}
                          >
                            <SelectTrigger className="w-36">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">free</SelectItem>
                              <SelectItem value="premium">premium</SelectItem>
                              <SelectItem value="premium_gift">premium_gift</SelectItem>
                              <SelectItem value="admin">admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <UserTokenBalance
                            userId={u.id}
                            allowances={allowances}
                            onUpdate={handleAllowanceUpdate}
                          />
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {u.created_at
                            ? format(new Date(u.created_at), "MMM d, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setTokenModalUser({ id: u.id, displayName: u.display_name })}
                            title="Manage tokens & plan"
                          >
                            <Coins className="h-4 w-4 text-amber-500" />
                          </Button>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {hasChanges(u.id) && (
                              <Button
                                size="sm"
                                onClick={() => handleSaveUser(u.id)}
                                disabled={savingUserId === u.id}
                                className="gap-1"
                              >
                                <Save className="h-3 w-3" />
                                {savingUserId === u.id ? "Saving..." : "Save"}
                              </Button>
                            )}
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                  disabled={u.id === user?.id || deletingUserId === u.id}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete User</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to delete{" "}
                                    <span className="font-semibold">
                                      {u.display_name || "this user"}
                                    </span>
                                    ? This action cannot be undone and will remove all their data.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {deletingUserId === u.id ? "Deleting..." : "Delete"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      
      {/* Token Management Modal */}
      <UserTokenModal
        open={!!tokenModalUser}
        onOpenChange={(open) => !open && setTokenModalUser(null)}
        userId={tokenModalUser?.id || ""}
        displayName={tokenModalUser?.displayName || null}
        onSave={(updatedAllowance) => {
          setAllowances((prev) => ({
            ...prev,
            [updatedAllowance.user_id]: {
              id: updatedAllowance.id,
              user_id: updatedAllowance.user_id,
              tokens_granted: updatedAllowance.tokens_granted,
              tokens_used: updatedAllowance.tokens_used,
            },
          }));
        }}
      />
      
      <Footer />
    </div>
  );
}
