import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { parsePromptKitDocument } from "@/lib/promptKitParser";

interface PromptKitArticleViewProps {
  content: string;
  onCopyItem: (body: string, index: number) => void;
  copiedIdx: number | null;
}

const COLLAPSE_THRESHOLD = 700;

function PromptCard({
  index,
  title,
  body,
  onCopy,
  copied,
}: {
  index: number;
  title: string;
  body: string;
  onCopy: () => void;
  copied: boolean;
}) {
  const [expanded, setExpanded] = useState(body.length <= COLLAPSE_THRESHOLD);
  const shown = expanded ? body : body.slice(0, COLLAPSE_THRESHOLD).trimEnd() + "…";
  const canCollapse = body.length > COLLAPSE_THRESHOLD;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden not-prose">
      <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <Badge variant="secondary" className="shrink-0">
            #{index}
          </Badge>
          <h3 className="font-semibold text-foreground truncate">{title || "Untitled"}</h3>
        </div>
        <Button
          size="sm"
          variant={copied ? "success" : "outline"}
          onClick={onCopy}
          className="gap-1.5 shrink-0"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              Copy this prompt
            </>
          )}
        </Button>
      </div>
      <pre className="whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed px-4 py-4 m-0 bg-background">
        {shown}
      </pre>
      {canCollapse && (
        <div className="border-t border-border bg-muted/20 px-3 py-1.5 flex justify-center">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setExpanded((e) => !e)}
            className="h-7 gap-1.5 text-xs text-muted-foreground"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                Collapse
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                Show full prompt
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export function PromptKitArticleView({ content, onCopyItem, copiedIdx }: PromptKitArticleViewProps) {
  const segments = parsePromptKitDocument(content || "");

  if (segments.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-6">
        <p className="text-muted-foreground">This kit is empty.</p>
      </div>
    );
  }

  const hasPrompt = segments.some((s) => s.type === "prompt");
  if (!hasPrompt) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-6">
        <p className="text-muted-foreground">
          This kit doesn't contain any prompts yet (no <code className="font-mono">## Prompt:</code>{" "}
          headings found).
        </p>
        <pre className="mt-4 whitespace-pre-wrap font-mono text-sm text-foreground leading-relaxed">
          {content}
        </pre>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {segments.map((seg, i) =>
        seg.type === "prose" ? (
          <div
            key={`prose-${i}`}
            className="prose prose-sm md:prose-base dark:prose-invert max-w-none"
          >
            <ReactMarkdown>{seg.markdown}</ReactMarkdown>
          </div>
        ) : (
          <PromptCard
            key={`prompt-${seg.index}`}
            index={seg.index}
            title={seg.title}
            body={seg.body}
            copied={copiedIdx === seg.index}
            onCopy={() => onCopyItem(seg.body, seg.index)}
          />
        ),
      )}
    </div>
  );
}
