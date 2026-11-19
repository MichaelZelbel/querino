import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CREATOR_LINK_LABEL_MAX,
  type CreatorLinkForm,
} from "@/lib/creatorLink";

export interface CreatorLinkErrors {
  url?: string;
  label?: string;
}

interface CreatorLinkFieldsProps {
  value: CreatorLinkForm;
  onChange: (value: CreatorLinkForm) => void;
  errors?: CreatorLinkErrors;
  idPrefix: string;
}

/** "Your link": the address and the name of the one link under an item. */
export function CreatorLinkFields({
  value,
  onChange,
  errors,
  idPrefix,
}: CreatorLinkFieldsProps) {
  const urlId = `${idPrefix}-creator-link-url`;
  const labelId = `${idPrefix}-creator-link-label`;
  return (
    <div className="space-y-3">
      <div>
        <p className="text-base font-medium text-foreground">Your link</p>
        <p className="text-sm text-muted-foreground">
          Optional. One link to your own project, shown under the item once it
          has been checked. Leave the address empty for no link.
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor={urlId}>Address</Label>
        <Input
          id={urlId}
          type="url"
          inputMode="url"
          placeholder="https://"
          value={value.url}
          onChange={(e) => onChange({ ...value, url: e.target.value })}
          aria-invalid={!!errors?.url}
        />
        {errors?.url && (
          <p className="text-sm text-destructive">{errors.url}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor={labelId}>Name</Label>
        <Input
          id={labelId}
          placeholder="My newsletter"
          maxLength={CREATOR_LINK_LABEL_MAX}
          value={value.label}
          onChange={(e) => onChange({ ...value, label: e.target.value })}
          aria-invalid={!!errors?.label}
        />
        <p className="text-xs text-muted-foreground">
          {value.label.length}/{CREATOR_LINK_LABEL_MAX} characters
        </p>
        {errors?.label && (
          <p className="text-sm text-destructive">{errors.label}</p>
        )}
      </div>
    </div>
  );
}
