"use client"

import { ColumnDef } from "@tanstack/react-table"
import { Channel } from "../../types"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { EditIcon, MoreVerticalIcon, TrashIcon } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface ChannelsColumnsProps {
  onEdit: (channel: Channel) => void
  onDelete: (channel: Channel) => void
}

export const createChannelsColumns = ({ onEdit, onDelete }: ChannelsColumnsProps): ColumnDef<Channel>[] => [
  {
    accessorKey: "name",
    header: "Channel Name",
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-1">
        <span className="font-semibold">#{row.original.name}</span>
        <span className="text-sm text-muted-foreground">
          Created {format(row.original.createdAt, 'MMM d, yyyy')}
        </span>
      </div>
    ),
  },
  {
    id: "actions",
    header: "",
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()} className="flex justify-end w-full">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVerticalIcon className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onEdit(row.original)}>
              <EditIcon className="size-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => onDelete(row.original)}
              className="text-destructive focus:text-destructive"
            >
              <TrashIcon className="size-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    ),
    meta: {
      align: "right",
    },
  },
]

// Backward compatibility - default columns without edit
export const channelsColumns: ColumnDef<Channel>[] = [
  {
    accessorKey: "name",
    header: "Channel Name",
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-1">
        <span className="font-semibold">#{row.original.name}</span>
        <span className="text-sm text-muted-foreground">
          Created {format(row.original.createdAt, 'MMM d, yyyy')}
        </span>
      </div>
    ),
  },
]

// Re-export Channel type for consumers
export type { Channel }

