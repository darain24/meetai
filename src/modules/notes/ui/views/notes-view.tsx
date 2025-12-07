'use client'

import { trpc } from "@/trpc/client"
import { LoadingState } from "@/components/loading-state"
import { ErrorState } from "@/components/error-state"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import { CreateNoteDialog } from "../components/create-note-dialog"
import { EditNoteDialog } from "../components/edit-note-dialog"
import { NotesList } from "../components/notes-list"
import { useNotesFilters } from "../../hooks/use-notes-filters"
import { DataPagination } from "@/components/data-pagination"
import { Toggle } from "@/components/ui/toggle"
import { useConfirm } from "@/hooks/use-confirm"
import { toast } from "sonner"
import { Note, NoteGetOne } from "../../types"

export const NotesView = () => {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingNote, setEditingNote] = useState<NoteGetOne | null>(null)
  const [deleteConfirmation, confirmDelete] = useConfirm(
    'Are you sure?',
    'This will permanently delete this note.'
  )
  const [filters, setFilters] = useNotesFilters()
  const utils = trpc.useUtils()
  const { data, isLoading, error } = trpc.notes.list.useQuery({
    search: filters.search || undefined,
    pinned: filters.pinned ?? undefined,
    page: filters.page,
    pageSize: 10,
  })

  const deleteNote = trpc.notes.delete.useMutation({
    onSuccess: async () => {
      toast.success("Note deleted successfully")
      await utils.notes.list.invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleEdit = async (note: Note) => {
    try {
      // Fetch full note data for editing
      const fullNote = await utils.notes.getOne.fetch({ id: note.id })
      if (fullNote) {
        setEditingNote(fullNote)
        setIsEditDialogOpen(true)
      }
    } catch (error) {
      toast.error("Failed to load note for editing")
    }
  }

  const handleDelete = async (note: Note) => {
    const ok = await confirmDelete()
    if (!ok) return
    deleteNote.mutate({ id: note.id })
  }

  if (isLoading) {
    return <LoadingState title="Loading notes" description="Please wait..." />
  }

  if (error) {
    return <ErrorState title="Error loading notes" description={error.message} />
  }

  return (
    <>
      {deleteConfirmation}
      <CreateNoteDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
      {editingNote && (
        <EditNoteDialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open)
            if (!open) setEditingNote(null)
          }}
          noteId={editingNote.id}
          initialValues={editingNote}
        />
      )}
      <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
        <div className="flex items-center justify-between py-4">
          <h5 className="font-medium text-xl">Notes</h5>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusIcon className="size-4 mr-2" />
            New Note
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Toggle
            pressed={filters.pinned === true}
            onPressedChange={(pressed) => {
              setFilters({ pinned: pressed ? true : undefined, page: 1 })
            }}
            variant="outline"
          >
            Pinned Only
          </Toggle>
        </div>
        {data && data.items.length > 0 ? (
          <>
            <NotesList 
              notes={data.items} 
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
            <DataPagination 
              totalPages={data.totalPages} 
              page={filters.page}
              onPageChange={(page) => setFilters({ page })}
            />
          </>
        ) : (
          <EmptyState
            title="Create your first note"
            description="Notes help you capture ideas, thoughts, and information. Create a note to get started."
          />
        )}
      </div>
    </>
  )
}


