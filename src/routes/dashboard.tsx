import { createFileRoute, redirect } from "@tanstack/react-router";

// Legacy URL: permanent redirect to /library, replace so it never lands in history.
export const Route = createFileRoute("/dashboard")({
  beforeLoad: () => {
    throw redirect({ to: "/library", replace: true, statusCode: 301 });
  },
});
