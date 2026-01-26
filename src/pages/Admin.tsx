import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/contexts/AuthContext";
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
import { Search, Shield, Save, Users, Trash2, CreditCard } from "lucide-react";
import { format } from "date-fns";
import { StripeModeToggle } from "@/components/stripe/StripeModeToggle";
import { AICreditSettings } from "@/components/admin/AICreditSettings";
import { UserTokenBalance } from "@/components/admin/UserTokenBalance";

interface AllowancePeriod {
  id: string;
  user_id: string;
  tokens_granted: number;
  tokens_used: number;
}

interface UserProfile {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
  role: string | null;
  plan_type: string | null;
  plan_source: string | null;
  created_at: string | null;
}

export default function Admin() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuthContext();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [editedUsers, setEditedUsers] = useState<Record<string, Partial<UserProfile>>>({});
  const [allowances, setAllowances] = useState<Record<string, AllowancePeriod>>({});

  // Access control check
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        toast.error("You don't have permission to view the admin panel.");
        navigate("/");
        return;
      }
      if (profile?.role !== "admin") {
        toast.error("You don't have permission to view the admin panel.");
        navigate("/");
        return;
      }
    }
  }, [user, profile, authLoading, navigate]);

  // Fetch users
  useEffect(() => {
    if (profile?.role === "admin") {
      fetchUsers();
      fetchAllowances();
    }
  }, [profile]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, role, plan_type, plan_source, created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setUsers(data || []);
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

      // Create a map of user_id to their current period allowance
      const allowanceMap: Record<string, AllowancePeriod> = {};
      (data || []).forEach((row) => {
        // If multiple periods exist for a user, keep the one with latest period_end
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

  const handleFieldChange = (userId: string, field: string, value: string) => {
    setEditedUsers((prev) => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value,
      },
    }));
  };

  const handleSaveUser = async (userId: string) => {
    const changes = editedUsers[userId];
    if (!changes) return;

    setSavingUserId(userId);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          role: changes.role,
          plan_type: changes.plan_type,
          plan_source: changes.plan_source,
        })
        .eq("id", userId);

      if (error) throw error;

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId
            ? { ...u, ...changes }
            : u
        )
      );

      // Clear edited state for this user
      setEditedUsers((prev) => {
        const { [userId]: _, ...rest } = prev;
        return rest;
      });

      toast.success("User updated successfully");
    } catch (error) {
      console.error("Error updating user:", error);
      toast.error("Failed to update user");
    } finally {
      setSavingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // Prevent self-deletion
    if (userId === user?.id) {
      toast.error("You cannot delete your own account");
      return;
    }

    setDeletingUserId(userId);
    try {
      // Get the current session for auth header
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error("Not authenticated");
      }

      // Call edge function to delete user from auth.users (cascades to profiles)
      const response = await supabase.functions.invoke("delete-user", {
        body: { userId },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to delete user");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      // Remove from local state
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      
      // Clear any pending edits for this user
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

  const getUserValue = (userId: string, field: keyof UserProfile) => {
    const editedValue = editedUsers[userId]?.[field];
    if (editedValue !== undefined) return editedValue;
    const user = users.find((u) => u.id === userId);
    return user?.[field] || "";
  };

  const hasChanges = (userId: string) => {
    return !!editedUsers[userId] && Object.keys(editedUsers[userId]).length > 0;
  };

  // Don't render anything until auth check is complete
  if (authLoading) {
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

  if (!user || profile?.role !== "admin") {
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
            <p className="text-muted-foreground">Manage users, plans, and roles</p>
          </div>
        </div>

        {/* Stripe Mode Toggle */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Stripe Environment</CardTitle>
            </div>
            <CardDescription>
              Toggle between Live and Sandbox mode for testing payments
            </CardDescription>
          </CardHeader>
          <CardContent>
            <StripeModeToggle showInProduction={true} />
          </CardContent>
        </Card>

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
                      <TableHead>Plan Type</TableHead>
                      <TableHead>Plan Source</TableHead>
                      <TableHead>Remaining Tokens</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead className="w-24"></TableHead>
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
                            value={getUserValue(u.id, "role") as string}
                            onValueChange={(value) => handleFieldChange(u.id, "role", value)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">user</SelectItem>
                              <SelectItem value="admin">admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={getUserValue(u.id, "plan_type") as string}
                            onValueChange={(value) => handleFieldChange(u.id, "plan_type", value)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="free">free</SelectItem>
                              <SelectItem value="premium">premium</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select
                            value={getUserValue(u.id, "plan_source") as string}
                            onValueChange={(value) => handleFieldChange(u.id, "plan_source", value)}
                          >
                            <SelectTrigger className="w-28">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="internal">internal</SelectItem>
                              <SelectItem value="stripe">stripe</SelectItem>
                              <SelectItem value="gifted">gifted</SelectItem>
                              <SelectItem value="test">test</SelectItem>
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
      <Footer />
    </div>
  );
}
