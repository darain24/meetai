'use client'

import { trpc } from "@/trpc/client"
import { LoadingState } from "@/components/loading-state"
import { ErrorState } from "@/components/error-state"
import { Button } from "@/components/ui/button"
import { ArrowLeft, PinIcon, EditIcon, TrashIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { EditNoteDialog } from "../components/edit-note-dialog"
import { useConfirm } from "@/hooks/use-confirm"
import { toast } from "sonner"

interface Props {
  noteId: string
}

export const NoteDetailView = ({ noteId }: Props) => {
  const router = useRouter()
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [removeConfirmation, confirmRemove] = useConfirm(
    'Are you sure?',
    'This will permanently delete this note.'
  )
  
  const utils = trpc.useUtils()
  const { data: note, isLoading, error } = trpc.notes.getOne.useQuery({ id: noteId })
  
  const deleteNote = trpc.notes.delete.useMutation({
    onSuccess: async () => {
      toast.success("Note deleted")
      await utils.notes.list.invalidate()
      router.push("/notes")
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  const togglePin = trpc.notes.togglePin.useMutation({
    onSuccess: async () => {
      await utils.notes.getOne.invalidate({ id: noteId })
      await utils.notes.list.invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
    }
  })

  const handleDelete = async () => {
    const ok = await confirmRemove()
    if (!ok) return
    deleteNote.mutate({ id: noteId })
  }

  if (isLoading) {
    return <LoadingState title="Loading note" description="Please wait..." />
  }

  if (error || !note) {
    return <ErrorState title="Note not found" description={error?.message || "This note does not exist."} />
  }

  return (
    <>
      {removeConfirmation}
      <EditNoteDialog 
        open={isEditDialogOpen} 
        onOpenChange={setIsEditDialogOpen}
        noteId={noteId}
        initialValues={note}
      />
      <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => router.push("/notes")}>
              <ArrowLeft className="size-4" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{note.title}</h1>
              {note.pinned && <PinIcon className="size-5 text-primary" />}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => togglePin.mutate({ id: noteId })}
            >
              <PinIcon className={note.pinned ? "size-4 text-primary" : "size-4"} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <EditIcon className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleDelete}
              disabled={deleteNote.isPending}
            >
              <TrashIcon className="size-4" />
            </Button>
          </div>
        </div>
        
        {note.tags && note.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {note.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-1 bg-muted rounded-md text-sm"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="prose max-w-none">
          <div className="whitespace-pre-wrap text-foreground">
            {note.content}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          Last updated {new Date(note.updatedAt).toLocaleString()}
        </div>
      </div>
    </>
  )
}


