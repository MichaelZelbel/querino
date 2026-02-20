import { Textarea } from "@/components/ui/textarea";

interface LineNumberedEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: boolean;
  minHeight?: number;
}

export function LineNumberedEditor({
  id,
  value,
  onChange,
  placeholder = "Write your content here...",
  error = false,
  minHeight = 300,
}: LineNumberedEditorProps) {
  const lines = value.split("\n");

  return (
    <div className="rounded-md border border-input bg-background overflow-hidden">
      <div className="relative">
        <div className="flex">
          <div
            className="select-none pr-3 pt-2 pb-2 text-right font-mono text-xs text-muted-foreground/50 leading-[1.7rem] min-w-[2.5rem] border-r border-border mr-0"
            aria-hidden="true"
          >
            {Array.from({ length: lines.length }, (_, i) => (
              <div key={i + 1}>{i + 1}</div>
            ))}
          </div>
          <Textarea
            id={id}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`font-mono text-sm border-0 rounded-none focus-visible:ring-0 focus-visible:ring-offset-0 leading-[1.7rem] resize-y ${error ? "border-destructive" : ""}`}
            style={{ paddingTop: "0.5rem", minHeight: `${minHeight}px` }}
          />
        </div>
      </div>
    </div>
  );
}
