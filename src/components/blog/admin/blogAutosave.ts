// When the blog editor may autosave. Only a post that is a draft in the
// database, and still marked Draft in the form, autosaves. Switching the status
// select of a published post to Draft used to start the autosave, which then
// wrote half-typed text and slugs into the live post every three seconds; the
// status itself only changes on an explicit Save.
export function canAutosavePost(opts: {
  isNew: boolean;
  savedStatus: string | null | undefined;
  formStatus: string;
}): boolean {
  return (
    !opts.isNew && opts.savedStatus === "draft" && opts.formStatus === "draft"
  );
}
