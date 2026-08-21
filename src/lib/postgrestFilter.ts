// The search-filter escaping lives in supabase/functions/_shared so the edge
// functions and the browser share one implementation rather than a copy each.
// Finding S4 of the August 2026 audit is what three copies of one rule cost.
export {
  escapeFilterValue,
  ilikeContains,
  orIlikeContains,
  ownedByUserOrTeams,
} from "../../supabase/functions/_shared/postgrestFilter";
