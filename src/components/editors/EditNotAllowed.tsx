import { ArrowLeft, ShieldAlert } from "lucide-react";
import { Link } from "@/lib/router-compat";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import type { ArtifactListTable } from "@/lib/artifactListColumns";
import { EDIT_TYPE_LABEL } from "@/lib/editAccess";

interface EditNotAllowedProps {
  table: ArtifactListTable;
  backTo: string;
}

/** The one page every Edit route shows to a person who may not edit. */
export function EditNotAllowed({ table, backTo }: EditNotAllowedProps) {
  const label = EDIT_TYPE_LABEL[table];
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1 py-20">
        <div className="container mx-auto max-w-4xl px-4 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
          </div>
          <h1 className="mb-8 text-display-md font-bold text-foreground">
            You can't edit this {label}.
          </h1>
          <Link to={backTo}>
            <Button className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {backTo === "/library" ? "Back to Library" : `View the ${label}`}
            </Button>
          </Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
