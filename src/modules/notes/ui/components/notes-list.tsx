'use client'

import { format } from 'date-fns'
import { NoteCard } from './note-card'
import { Note } from '../../types'

interface Props {
  notes: Note[]
  onEdit?: (note: Note) => void
  onDelete?: (note: Note) => void
}

export const NotesList = ({ notes, onEdit, onDelete }: Props) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {notes.map((note) => (
        <NoteCard 
          key={note.id} 
          note={note} 
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}


