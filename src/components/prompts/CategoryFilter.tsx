import { Button } from "@/components/ui/button";
import { categories } from "@/data/mockPrompts";
import { 
  Sparkles, 
  PenTool, 
  Code, 
  Briefcase, 
  Palette, 
  Search, 
  GraduationCap 
} from "lucide-react";

const iconMap = {
  Sparkles,
  PenTool,
  Code,
  Briefcase,
  Palette,
  Search,
  GraduationCap,
};

interface CategoryFilterProps {
  selected: string;
  onSelect: (category: string) => void;
}

export function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const Icon = iconMap[category.icon as keyof typeof iconMap];
        const isSelected = selected === category.id;
        
        return (
          <Button
            key={category.id}
            variant={isSelected ? "default" : "outline"}
            size="sm"
            onClick={() => onSelect(category.id)}
            className="gap-1.5"
          >
            <Icon className="h-4 w-4" />
            {category.label}
          </Button>
        );
      })}
    </div>
  );
}
