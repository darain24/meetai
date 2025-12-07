'use client'

import { trpc } from "@/trpc/client"
import { LoadingState } from "@/components/loading-state"
import { ErrorState } from "@/components/error-state"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { CreateChannelDialog } from "../components/create-channel-dialog"
import { EditChannelDialog } from "../components/edit-channel-dialog"
import { DataTable } from "@/components/data-table"
import { createChannelsColumns, Channel } from "../components/channels-columns"
import { useChannelsFilters } from "../../hooks/use-channels-filters"
import { DataPagination } from "@/components/data-pagination"
import { useConfirm } from "@/hooks/use-confirm"
import { toast } from "sonner"

export const ChannelsView = () => {
  const router = useRouter()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingChannel, setEditingChannel] = useState<Channel | null>(null)
  const [deleteConfirmation, confirmDelete] = useConfirm(
    'Are you sure?',
    'This will permanently delete this channel and all its messages.'
  )
  const [filters, setFilters] = useChannelsFilters()
  const utils = trpc.useUtils()
  const { data, isLoading, error } = trpc.channels.getMany.useQuery({
    ...filters,
    pageSize: 10,
  })

  const deleteChannel = trpc.channels.delete.useMutation({
    onSuccess: async () => {
      toast.success("Channel deleted successfully")
      await utils.channels.list.invalidate()
      await utils.channels.getMany.invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleEdit = (channel: Channel) => {
    setEditingChannel(channel)
    setIsEditDialogOpen(true)
  }

  const handleDelete = async (channel: Channel) => {
    const ok = await confirmDelete()
    if (!ok) return
    deleteChannel.mutate({ id: channel.id })
  }

  const columns = createChannelsColumns({ onEdit: handleEdit, onDelete: handleDelete })

  if (isLoading) {
    return <LoadingState title="Loading channels" description="Please wait..." />
  }

  if (error) {
    return <ErrorState title="Error loading channels" description={error.message} />
  }

  return (
    <>
      {deleteConfirmation}
      <CreateChannelDialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen} />
      {editingChannel && (
        <EditChannelDialog
          open={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open)
            if (!open) setEditingChannel(null)
          }}
          channelId={editingChannel.id}
          initialName={editingChannel.name}
        />
      )}
      <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-4">
        <div className="flex items-center justify-between py-4">
          <h5 className="font-medium text-xl">Channels</h5>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <PlusIcon className="size-4 mr-2" />
            New Channel
          </Button>
        </div>
        {data && data.items.length > 0 ? (
          <>
            <DataTable 
              data={data.items} 
              columns={columns} 
              onRowClick={(row) => router.push(`/channels/${row.id}`)}
            />
            <DataPagination 
              totalPages={data.totalPages} 
              page={filters.page}
              onPageChange={(page) => setFilters({ page })}
            />
          </>
        ) : (
          <EmptyState
            title="Create your first channel"
            description="Channels are where your team can communicate and collaborate. Create a channel to get started."
          />
        )}
      </div>
    </>
  )
}


