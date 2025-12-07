'use client'

import { format } from 'date-fns'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PinIcon, MoreVerticalIcon, EditIcon, TrashIcon } from 'lucide-react'
import { Note } from '../../types'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Props {
  note: Note
  onEdit?: (note: Note) => void
  onDelete?: (note: Note) => void
}

export const NoteCard = ({ note, onEdit, onDelete }: Props) => {
  const router = useRouter()

  return (
    <Card
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow relative",
        note.pinned && "border-primary"
      )}
      onClick={() => router.push(`/notes/${note.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-2">{note.title}</CardTitle>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {note.pinned && (
              <PinIcon className="size-4 text-primary flex-shrink-0" />
            )}
            {(onEdit || onDelete) && (
              <div onClick={(e) => e.stopPropagation()} className="relative z-10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVerticalIcon className="size-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEdit && (
                      <DropdownMenuItem onClick={() => onEdit(note)}>
                        <EditIcon className="size-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    {onDelete && (
                      <DropdownMenuItem 
                        onClick={() => onDelete(note)}
                        className="text-destructive focus:text-destructive"
                      >
                        <TrashIcon className="size-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {note.content}
        </p>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {note.tags && note.tags.length > 0 ? (
              note.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))
            ) : null}
          </div>
          <span className="text-xs text-muted-foreground">
            {format(new Date(note.updatedAt), 'MMM d')}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}


