import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { LANGUAGES, DEFAULT_LANGUAGE } from "@/config/languages";
import { Globe } from "lucide-react";

interface LanguageSelectProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  className?: string;
}

export function LanguageSelect({ value, onChange, label = "Language", className }: LanguageSelectProps) {
  return (
    <div className={`space-y-2 ${className || ""}`}>
      <Label className="flex items-center gap-2">
        <Globe className="h-4 w-4" />
        {label}
      </Label>
      <Select value={value || DEFAULT_LANGUAGE} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((lang) => (
            <SelectItem key={lang.code} value={lang.code}>
              {lang.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
