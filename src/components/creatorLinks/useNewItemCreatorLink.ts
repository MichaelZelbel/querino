import { useState } from "react";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  creatorLinkPrefill,
  validateCreatorLink,
  type CreatorLinkForm,
  type CreatorLinkValidation,
} from "@/lib/creatorLink";
import type { CreatorLinkErrors } from "./CreatorLinkFields";

/**
 * The "Your link" block of a New page. It starts from the profile's website
 * until the author types; `check` validates it and shows the errors.
 */
export function useNewItemCreatorLink() {
  const { profile } = useAuthContext();
  const [edited, setEdited] = useState<CreatorLinkForm | null>(null);
  const [errors, setErrors] = useState<CreatorLinkErrors>({});
  const value = edited ?? creatorLinkPrefill(profile?.website);

  const check = (): CreatorLinkValidation => {
    const result = validateCreatorLink(value);
    setErrors(result.ok ? {} : result.errors);
    return result;
  };

  return { value, onChange: setEdited, errors, check };
}
