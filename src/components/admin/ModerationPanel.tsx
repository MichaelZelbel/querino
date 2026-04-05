import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { ShieldAlert, Plus, Trash2, RotateCcw, Ban, CheckCircle, Bot, Eye, RefreshCw } from "lucide-react";
import { format } from "date-fns";

interface Stopword {
  id: string;
  word: string;
  category: string;
  severity: string;
  created_at: string;
}

interface ModerationEvent {
  id: string;
  user_id: string;
  action: string;
  item_type: string;
  item_id: string | null;
  flagged_content: string | null;
  matched_words: string[] | null;
  category: string | null;
  result: string;
  tier: string;
  created_at: string;
}

interface UserSuspension {
  id: string;
  user_id: string;
  strike_count: number;
  suspended: boolean;
  suspended_at: string | null;
  suspended_until: string | null;
  suspension_reason: string | null;
}

interface QueueItem {
  id: string;
  item_type: string;
  item_id: string;
  user_id: string;
  content_snapshot: string;
  status: string;
  ai_category: string | null;
  ai_confidence: number | null;
  ai_reason: string | null;
  retry_count: number;
  created_at: string;
  reviewed_at: string | null;
}

export function ModerationPanel() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-primary" />
          <div>
            <CardTitle>Content Moderation</CardTitle>
            <CardDescription>Manage stopwords, review moderation logs, AI review queue, and handle user suspensions</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="stopwords">
          <TabsList className="mb-4">
            <TabsTrigger value="stopwords">Stopwords</TabsTrigger>
            <TabsTrigger value="log">Moderation Log</TabsTrigger>
            <TabsTrigger value="ai-queue">AI Review Queue</TabsTrigger>
            <TabsTrigger value="suspensions">Suspensions</TabsTrigger>
          </TabsList>
          <TabsContent value="stopwords"><StopwordsTab /></TabsContent>
          <TabsContent value="log"><ModerationLogTab /></TabsContent>
          <TabsContent value="ai-queue"><AIReviewQueueTab /></TabsContent>
          <TabsContent value="suspensions"><SuspensionsTab /></TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function StopwordsTab() {
  const [stopwords, setStopwords] = useState<Stopword[]>([]);
  const [loading, setLoading] = useState(true);
  const [newWord, setNewWord] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [bulkInput, setBulkInput] = useState("");
  const [showBulk, setShowBulk] = useState(false);

  useEffect(() => {
    fetchStopwords();
  }, []);

  const fetchStopwords = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("moderation_stopwords")
      .select("*")
      .order("created_at", { ascending: false }) as any;
    setStopwords(data || []);
    setLoading(false);
  };

  const addWord = async () => {
    if (!newWord.trim()) return;
    const { error } = await (supabase.from("moderation_stopwords") as any).insert({
      word: newWord.trim().toLowerCase(),
      category: newCategory,
      severity: "block",
    });
    if (error) {
      toast.error(error.message?.includes("duplicate") ? "Word already exists" : "Failed to add word");
      return;
    }
    setNewWord("");
    toast.success("Stopword added");
    fetchStopwords();
  };

  const bulkAdd = async () => {
    const words = bulkInput
      .split("\n")
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);
    if (words.length === 0) return;

    const rows = words.map((word) => ({
      word,
      category: newCategory,
      severity: "block",
    }));

    const { error } = await (supabase.from("moderation_stopwords") as any).insert(rows);
    if (error) {
      toast.error("Some words may already exist. Added what we could.");
    } else {
      toast.success(`Added ${words.length} stopwords`);
    }
    setBulkInput("");
    setShowBulk(false);
    fetchStopwords();
  };

  const deleteWord = async (id: string) => {
    await (supabase.from("moderation_stopwords") as any).delete().eq("id", id);
    toast.success("Stopword removed");
    fetchStopwords();
  };

  if (loading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input
            placeholder="Add a stopword..."
            value={newWord}
            onChange={(e) => setNewWord(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addWord()}
          />
        </div>
        <Select value={newCategory} onValueChange={setNewCategory}>
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="sexual">Sexual</SelectItem>
            <SelectItem value="hate">Hate</SelectItem>
            <SelectItem value="spam">Spam</SelectItem>
            <SelectItem value="malware">Malware</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={addWord} size="sm" className="gap-1">
          <Plus className="h-4 w-4" /> Add
        </Button>
        <Button variant="outline" size="sm" onClick={() => setShowBulk(!showBulk)}>
          Bulk Import
        </Button>
      </div>

      {showBulk && (
        <div className="space-y-2 p-3 border rounded-lg">
          <Textarea
            placeholder="One word per line..."
            value={bulkInput}
            onChange={(e) => setBulkInput(e.target.value)}
            rows={5}
          />
          <Button onClick={bulkAdd} size="sm">Import All</Button>
        </div>
      )}

      <p className="text-sm text-muted-foreground">{stopwords.length} stopwords configured</p>

      <div className="max-h-[400px] overflow-auto border rounded">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Word</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stopwords.map((sw) => (
              <TableRow key={sw.id}>
                <TableCell className="font-mono text-sm">{sw.word}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{sw.category}</Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => deleteWord(sw.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function TierBadge({ tier }: { tier: string }) {
  if (tier === "ai") {
    return (
      <Badge variant="outline" className="gap-1 text-xs">
        <Bot className="h-3 w-3" /> AI
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="text-xs">
      Stopword
    </Badge>
  );
}

function ModerationLogTab() {
  const [events, setEvents] = useState<ModerationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterResult, setFilterResult] = useState<string>("all");

  useEffect(() => {
    fetchEvents();
  }, [filterResult]);

  const fetchEvents = async () => {
    setLoading(true);
    let query = (supabase.from("moderation_events") as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filterResult !== "all") {
      query = query.eq("result", filterResult);
    }

    const { data } = await query;
    setEvents(data || []);
    setLoading(false);
  };

  if (loading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center">
        <Select value={filterResult} onValueChange={setFilterResult}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Results</SelectItem>
            <SelectItem value="blocked">Blocked</SelectItem>
            <SelectItem value="cleared">Cleared</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">{events.length} events</span>
      </div>

      <div className="max-h-[500px] overflow-auto border rounded">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Tier</TableHead>
              <TableHead>Result</TableHead>
              <TableHead>Matched</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((ev) => (
              <TableRow key={ev.id}>
                <TableCell className="text-xs whitespace-nowrap">
                  {format(new Date(ev.created_at), "MMM d, HH:mm")}
                </TableCell>
                <TableCell className="text-xs font-mono truncate max-w-[100px]">
                  {ev.user_id.slice(0, 8)}…
                </TableCell>
                <TableCell className="text-xs">{ev.action}</TableCell>
                <TableCell className="text-xs">{ev.item_type}</TableCell>
                <TableCell>
                  <TierBadge tier={ev.tier} />
                </TableCell>
                <TableCell>
                  <Badge variant={ev.result === "blocked" ? "destructive" : "secondary"}>
                    {ev.result}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs max-w-[200px] truncate">
                  {ev.matched_words?.join(", ") || "—"}
                </TableCell>
              </TableRow>
            ))}
            {events.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No moderation events yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function AIReviewQueueTab() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchItems();
  }, [filterStatus]);

  const fetchItems = async () => {
    setLoading(true);
    let query = (supabase.from("moderation_review_queue") as any)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (filterStatus !== "all") {
      query = query.eq("status", filterStatus);
    }

    const { data } = await query;
    setItems(data || []);
    setLoading(false);
  };

  const triggerProcessing = async () => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-moderate-content");
      if (error) throw error;
      toast.success(`Processed: ${data?.processed || 0} items, ${data?.violations || 0} violations`);
      fetchItems();
    } catch (err) {
      toast.error("Failed to trigger AI review");
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  const requeueItem = async (id: string) => {
    await (supabase.from("moderation_review_queue") as any)
      .update({ status: "pending", retry_count: 0, ai_category: null, ai_confidence: null, ai_reason: null, reviewed_at: null })
      .eq("id", id);
    toast.success("Re-queued for review");
    fetchItems();
  };

  if (loading) return <Skeleton className="h-32 w-full" />;

  const pendingCount = items.filter((i) => i.status === "pending").length;
  const flaggedCount = items.filter((i) => i.status === "flagged").length;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 items-center flex-wrap">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="violation">Violation</SelectItem>
            <SelectItem value="error">Error</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {pendingCount} pending · {flaggedCount} flagged · {items.length} total
        </span>
        <Button
          onClick={triggerProcessing}
          disabled={processing || pendingCount === 0}
          size="sm"
          className="gap-1 ml-auto"
        >
          <Bot className="h-4 w-4" />
          {processing ? "Processing…" : "Process Queue Now"}
        </Button>
      </div>

      <div className="max-h-[500px] overflow-auto border rounded">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Time</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Confidence</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="text-xs whitespace-nowrap">
                  {format(new Date(item.created_at), "MMM d, HH:mm")}
                </TableCell>
                <TableCell className="text-xs">{item.item_type}</TableCell>
                <TableCell className="text-xs font-mono truncate max-w-[100px]">
                  {item.user_id.slice(0, 8)}…
                </TableCell>
                <TableCell>
                  <QueueStatusBadge status={item.status} />
                </TableCell>
                <TableCell className="text-xs">
                  {item.ai_category || "—"}
                </TableCell>
                <TableCell className="text-xs">
                  {item.ai_confidence != null ? `${Math.round(item.ai_confidence * 100)}%` : "—"}
                </TableCell>
                <TableCell className="text-xs max-w-[200px] truncate" title={item.ai_reason || undefined}>
                  {item.ai_reason || "—"}
                </TableCell>
                <TableCell>
                  {(item.status === "reviewed" || item.status === "violation" || item.status === "error" || item.status === "flagged") && (
                    <Button variant="ghost" size="sm" onClick={() => requeueItem(item.id)} className="text-xs gap-1">
                      <RefreshCw className="h-3 w-3" /> Re-review
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No items in the AI review queue
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function QueueStatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return <Badge variant="outline">Pending</Badge>;
    case "flagged":
      return <Badge variant="outline" className="border-accent text-accent-foreground">Flagged</Badge>;
    case "reviewed":
      return <Badge variant="secondary" className="gap-1"><CheckCircle className="h-3 w-3" /> Safe</Badge>;
    case "violation":
      return <Badge variant="destructive" className="gap-1"><Ban className="h-3 w-3" /> Violation</Badge>;
    case "error":
      return <Badge variant="outline" className="text-destructive border-destructive">Error</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function SuspensionsTab() {
  const [suspensions, setSuspensions] = useState<UserSuspension[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSuspensions();
  }, []);

  const fetchSuspensions = async () => {
    setLoading(true);
    const { data } = await (supabase.from("user_suspensions") as any)
      .select("*")
      .order("strike_count", { ascending: false });
    setSuspensions(data || []);
    setLoading(false);
  };

  const toggleSuspension = async (s: UserSuspension) => {
    const newSuspended = !s.suspended;
    await (supabase.from("user_suspensions") as any)
      .update({
        suspended: newSuspended,
        suspended_at: newSuspended ? new Date().toISOString() : null,
        suspension_reason: newSuspended ? "Manually suspended by admin" : null,
      })
      .eq("id", s.id);
    toast.success(newSuspended ? "User suspended" : "User unsuspended");
    fetchSuspensions();
  };

  const clearStrikes = async (id: string) => {
    await (supabase.from("user_suspensions") as any)
      .update({ strike_count: 0, suspended: false, suspended_at: null, suspension_reason: null })
      .eq("id", id);
    toast.success("Strikes cleared");
    fetchSuspensions();
  };

  if (loading) return <Skeleton className="h-32 w-full" />;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {suspensions.filter((s) => s.suspended).length} users currently suspended, {suspensions.length} users with strikes
      </p>

      <div className="max-h-[500px] overflow-auto border rounded">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Strikes</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {suspensions.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-mono text-xs">{s.user_id.slice(0, 12)}…</TableCell>
                <TableCell>
                  <Badge variant={s.strike_count >= 5 ? "destructive" : "secondary"}>
                    {s.strike_count}
                  </Badge>
                </TableCell>
                <TableCell>
                  {s.suspended ? (
                    <Badge variant="destructive" className="gap-1">
                      <Ban className="h-3 w-3" /> Suspended
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="gap-1">
                      <CheckCircle className="h-3 w-3" /> Active
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs max-w-[200px] truncate">
                  {s.suspension_reason || "—"}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSuspension(s)}
                      className="text-xs"
                    >
                      {s.suspended ? "Unsuspend" : "Suspend"}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-xs gap-1">
                          <RotateCcw className="h-3 w-3" /> Clear
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Clear all strikes?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will reset the strike counter to 0 and unsuspend the user if they were suspended.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => clearStrikes(s.id)}>
                            Clear Strikes
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {suspensions.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No users with strikes
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
