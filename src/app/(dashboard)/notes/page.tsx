import { NotesView } from "@/modules/notes/ui/views/notes-view";
import { Suspense } from "react";
import { LoadingState } from "@/components/loading-state";

export default function NotesPage() {
  return (
    <Suspense fallback={<LoadingState title="Loading notes" description="Please wait..." />}>
      <NotesView />
    </Suspense>
  );
}


