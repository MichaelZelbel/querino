// Who may press the buttons that generate or refresh AI Insights.
//
// The ai_insights row may be written only by the item's author or an admin
// (is_item_owner in its row-level security). The edge function charges the
// credits before the page writes that row, so a button shown to anyone else
// spent the viewer's credits on a result the database then refused, and put
// the raw database error on screen. The header's refresh icon already checked
// this; the "Generate Insights" button in the panel body did not (2026-09-30).
//
// `isOwner` undefined keeps the old behaviour for callers that do not pass it.
export function canWriteInsights(isOwner: boolean | undefined): boolean {
  return isOwner !== false;
}
