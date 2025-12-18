import { Check, X, Crown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { featureComparison } from '@/config/pricing';
import { cn } from '@/lib/utils';

export function FeatureComparisonTable() {
  const renderValue = (value: boolean | string, isPremium?: boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-success mx-auto" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground/50 mx-auto" />
      );
    }
    return (
      <span className="text-sm text-foreground">{value}</span>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-border">
            <th className="text-left py-4 px-4 font-medium text-foreground w-[40%]">
              Feature
            </th>
            <th className="text-center py-4 px-4 font-medium text-foreground w-[20%]">
              Free
            </th>
            <th className="text-center py-4 px-4 font-medium w-[20%]">
              <div className="flex items-center justify-center gap-2">
                <span className="text-primary">Premium</span>
                <Badge variant="secondary" className="bg-primary/10 text-primary border-0 text-[10px]">
                  Popular
                </Badge>
              </div>
            </th>
            <th className="text-center py-4 px-4 font-medium text-foreground w-[20%]">
              Team
            </th>
          </tr>
        </thead>
        <tbody>
          {featureComparison.map((section) => (
            <>
              {/* Category Header */}
              <tr key={section.category} className="bg-muted/30">
                <td colSpan={4} className="py-3 px-4 font-semibold text-foreground text-sm">
                  {section.category}
                </td>
              </tr>
              {/* Features in this category */}
              {section.features.map((feature, idx) => (
                <tr 
                  key={`${section.category}-${feature.name}`} 
                  className={cn(
                    "border-b border-border/50 hover:bg-muted/20 transition-colors",
                    idx === section.features.length - 1 && "border-b-0"
                  )}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-foreground">{feature.name}</span>
                      {feature.isPremium && (
                        <Crown className="h-3.5 w-3.5 text-primary" />
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {renderValue(feature.free, feature.isPremium)}
                  </td>
                  <td className="py-3 px-4 text-center bg-primary/5">
                    {renderValue(feature.premium, feature.isPremium)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {renderValue(feature.team, feature.isPremium)}
                  </td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
