import { Badge } from "@/components/ui/badge";

interface LanguageBadgeProps {
  language?: string | null;
  className?: string;
}

export function LanguageBadge({ language, className }: LanguageBadgeProps) {
  if (!language || language === "en") return null;

  return (
    <Badge variant="outline" className={`text-[10px] px-1.5 py-0 font-medium uppercase ${className || ""}`}>
      {language}
    </Badge>
  );
}
