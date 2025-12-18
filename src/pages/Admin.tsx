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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, Shield, Crown, Gift, Save, Users } from "lucide-react";
import { format } from "date-fns";

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
  const [editedUsers, setEditedUsers] = useState<Record<string, Partial<UserProfile>>>({});

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

  const handleMakeMePremium = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          plan_type: "premium",
          plan_source: "gifted",
        })
        .eq("id", user.id);

      if (error) throw error;

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, plan_type: "premium", plan_source: "gifted" }
            : u
        )
      );

      toast.success("Your plan has been upgraded to Premium (Gifted)");
      // Reload to refresh profile in auth context
      window.location.reload();
    } catch (error) {
      console.error("Error upgrading plan:", error);
      toast.error("Failed to upgrade plan");
    }
  };

  const handleMakeMeAdmin = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: "admin" })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Your role has been updated to Admin");
      window.location.reload();
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
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

        {/* Quick Actions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Shortcuts for common admin tasks</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button onClick={handleMakeMePremium} variant="outline" className="gap-2">
              <Gift className="h-4 w-4" />
              Make me Premium (Gifted)
            </Button>
            <Button onClick={handleMakeMeAdmin} variant="outline" className="gap-2">
              <Crown className="h-4 w-4" />
              Make me Admin
            </Button>
          </CardContent>
        </Card>

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
                              <SelectItem value="team">team</SelectItem>
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
                        <TableCell className="text-sm text-muted-foreground">
                          {u.created_at
                            ? format(new Date(u.created_at), "MMM d, yyyy")
                            : "—"}
                        </TableCell>
                        <TableCell>
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
