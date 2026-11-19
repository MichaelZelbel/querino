import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/sonner";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  creatorLinkQueryKey,
  useOwnCreatorLink,
  writeCreatorLink,
} from "@/hooks/useCreatorLink";
import {
  creatorLinkErrorText,
  creatorLinkPrefill,
  creatorLinkStatusText,
  validateCreatorLink,
  type CreatorLinkForm,
  type CreatorLinkItemType,
} from "@/lib/creatorLink";
import { formatCount } from "@/components/shared/formatDate";
import { CreatorLinkFields, type CreatorLinkErrors } from "./CreatorLinkFields";

interface CreatorLinkEditorProps {
  itemType: CreatorLinkItemType;
  itemId: string;
}

/**
 * The Edit page's link card. It saves on its own button, apart from the page's
 * Save, so a link change never creates a version or touches the item.
 */
export function CreatorLinkEditor({
  itemType,
  itemId,
}: CreatorLinkEditorProps) {
  const { profile } = useAuthContext();
  const queryClient = useQueryClient();
  const { data: stored, isLoading } = useOwnCreatorLink(itemType, itemId, true);
  const [form, setForm] = useState<CreatorLinkForm>({ url: "", label: "" });
  const [errors, setErrors] = useState<CreatorLinkErrors>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    setForm(
      stored
        ? { url: stored.url, label: stored.label }
        : creatorLinkPrefill(profile?.website),
    );
    setErrors({});
  }, [isLoading, stored, profile?.website]);

  const save = async (next: CreatorLinkForm | null, done: string) => {
    setSaving(true);
    try {
      await writeCreatorLink(itemType, itemId, next);
      await queryClient.invalidateQueries({
        queryKey: creatorLinkQueryKey(itemType, itemId),
      });
      toast.success(done);
    } catch (error) {
      console.error("Error saving creator link:", error);
      toast.error(
        creatorLinkErrorText(error) ?? "Your link could not be saved",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    const result = validateCreatorLink(form);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    void save(
      result.value,
      result.value
        ? "Link saved. It is shown once it has been checked."
        : "Link removed",
    );
  };

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : (
        <>
          <CreatorLinkFields
            value={form}
            onChange={setForm}
            errors={errors}
            idPrefix="edit"
          />
          {stored && (
            <p className="text-sm text-muted-foreground">
              {creatorLinkStatusText(stored)} ·{" "}
              {formatCount(stored.click_count)}{" "}
              {stored.click_count === 1 ? "click" : "clicks"}
            </p>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save link
            </Button>
            {stored && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void save(null, "Link removed")}
                disabled={saving}
              >
                Remove link
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
