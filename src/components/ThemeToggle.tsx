import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ThemeToggleProps {
  /** When true, render a labeled button suitable for the mobile menu. */
  withLabel?: boolean;
  className?: string;
}

export function ThemeToggle({ withLabel = false, className }: ThemeToggleProps) {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && resolvedTheme === "dark";
  const next = isDark ? "light" : "dark";
  const label = isDark ? "Switch to light mode" : "Switch to dark mode";

  if (withLabel) {
    return (
      <Button
        variant="ghost"
        className={className ?? "w-full justify-start gap-2"}
        onClick={() => setTheme(next)}
        aria-label={label}
      >
        {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        {isDark ? "Light mode" : "Dark mode"}
      </Button>
    );
  }

  const button = (
    <Button
      variant="ghost"
      size="icon"
      className={className ?? "h-9 w-9"}
      onClick={() => setTheme(next)}
      aria-label={label}
    >
      {/* Render both and animate so there's no layout shift before mount */}
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">{label}</span>
    </Button>
  );

  return (
    <Tooltip>
      <TooltipTrigger asChild>{button}</TooltipTrigger>
      <TooltipContent>
        <p>Toggle theme</p>
      </TooltipContent>
    </Tooltip>
  );
}
