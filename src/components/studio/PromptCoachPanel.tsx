import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Send,
  Loader2,
  Bot,
  User,
  Undo2,
  MessageSquare,
  Sparkles,
} from "lucide-react";
import { runCanvasAI, type RunCanvasAIResult } from "@/lib/runCanvasAI";
import { toast } from "sonner";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface PromptCoachPanelProps {
  artifactId: string;
  canvasContent: string;
  onApplyContent: (content: string, changeNote?: string) => void;
  onUndo: () => void;
  canUndo: boolean;
  isNewPrompt?: boolean;
  userId: string;
  workspaceId?: string | null;
  sessionId: string;
}

const QUICK_ACTIONS = [
  { label: "Make clearer", message: "Make this prompt clearer and more specific." },
  { label: "Make stricter", message: "Make this prompt stricter with fewer ambiguities." },
  { label: "Add output format", message: "Add a clear output format specification to this prompt." },
  { label: "Shorten", message: "Shorten this prompt while preserving its intent." },
  { label: "Add examples", message: "Add concrete examples to illustrate the expected behavior." },
];

export function PromptCoachPanel({
  artifactId,
  canvasContent,
  onApplyContent,
  onUndo,
  canUndo,
  isNewPrompt = false,
  userId,
  workspaceId,
  sessionId,
}: PromptCoachPanelProps) {
  // Persist chat history in localStorage keyed by sessionId so it survives navigation
  const storageKey = `prompt_coach_messages:${sessionId}`;

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored) as ChatMessage[];
    } catch {
      // ignore parse errors
    }
    return isNewPrompt
      ? [{ role: "assistant", content: "What do you want this prompt to do?" }]
      : [];
  });
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mode, setMode] = useState<"chat_only" | "collab_edit">("collab_edit");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Persist messages whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch {
      // ignore storage errors (e.g. private browsing quota)
    }
  }, [messages, storageKey]);

  // When sessionId changes (draft promoted to real prompt), migrate messages to new key
  useEffect(() => {
    // Re-read from new key in case messages were already stored there (e.g. returning to edit page)
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as ChatMessage[];
        if (parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch {
      // ignore
    }
  }, [storageKey]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (overrideMessage?: string) => {
    const msg = overrideMessage || input.trim();
    if (!msg || isLoading) return;

    const userMsg: ChatMessage = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    if (!overrideMessage) setInput("");
    setIsLoading(true);

    try {
      const result: RunCanvasAIResult = await runCanvasAI({
        artifactType: "prompt",
        artifactId,
        mode: overrideMessage ? "collab_edit" : mode,
        message: msg,
        canvasContent,
        userId,
        workspaceId,
        sessionId,
      });

      const assistantMsg: ChatMessage = {
        role: "assistant",
        content: result.assistantMessage,
      };
      setMessages((prev) => [...prev, assistantMsg]);

      if (result.canvas?.updated && result.canvas.content) {
        onApplyContent(result.canvas.content, result.canvas.changeNote);
        toast("AI updated the prompt", {
          description: result.canvas.changeNote || "Content was modified",
          action: canUndo
            ? undefined
            : {
                label: "Undo",
                onClick: onUndo,
              },
        });
      }
    } catch (err) {
      console.error("[PromptCoach] Error:", err);
      const errorMessage =
        err instanceof Error ? err.message : "AI request failed";
      toast.error(errorMessage);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Error: ${errorMessage}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex h-full flex-col rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Prompt Coach</span>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant={mode === "collab_edit" ? "default" : "ghost"}
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setMode("collab_edit")}
          >
            <Sparkles className="h-3 w-3" />
            Edit
          </Button>
          <Button
            variant={mode === "chat_only" ? "default" : "ghost"}
            size="sm"
            className="h-7 gap-1 text-xs"
            onClick={() => setMode("chat_only")}
          >
            <MessageSquare className="h-3 w-3" />
            Chat
          </Button>
          {canUndo && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 text-xs"
              onClick={onUndo}
            >
              <Undo2 className="h-3 w-3" />
              Undo
            </Button>
          )}
        </div>
      </div>

      {/* Helper text */}
      <div className="px-4 py-2 text-xs text-muted-foreground border-b border-border">
        This AI sees your current prompt content.
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 min-h-0">
        <div ref={scrollRef} className="space-y-3 p-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Bot className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">
                Ask me to improve your prompt, or use the quick actions below.
              </p>
            </div>
          )}
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === "user" && (
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-2">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-3.5 w-3.5 text-primary" />
              </div>
              <div className="rounded-lg bg-secondary px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-1.5 border-t border-border px-4 py-2">
        {QUICK_ACTIONS.map((action) => (
          <Badge
            key={action.label}
            variant="outline"
            className="cursor-pointer hover:bg-secondary transition-colors text-xs"
            onClick={() => !isLoading && handleSend(action.message)}
          >
            {action.label}
          </Badge>
        ))}
      </div>

      {/* Input */}
      <div className="border-t border-border p-3">
        <div className="flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask the Prompt Coach..."
            rows={2}
            className="min-h-[60px] resize-none text-sm"
            disabled={isLoading}
          />
          <Button
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="h-[60px] w-10 shrink-0"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
