import { NoteDetailView } from "@/modules/notes/ui/views/note-detail-view";

interface Props {
  params: Promise<{
    noteId: string;
  }>;
}

export default async function NoteDetailPage({ params }: Props) {
  const { noteId } = await params;
  return <NoteDetailView noteId={noteId} />;
}


