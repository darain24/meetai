'use client'

import { useState, useEffect } from "react"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { trpc } from "@/trpc/client"
import { toast } from "sonner"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  channelId: string
  initialName: string
  onSuccess?: () => void
}

export const EditChannelDialog = ({ open, onOpenChange, channelId, initialName, onSuccess }: Props) => {
  const [name, setName] = useState("")
  const utils = trpc.useUtils()
  
  useEffect(() => {
    if (initialName) {
      setName(initialName)
    }
  }, [initialName, open])
  
  const updateChannel = trpc.channels.update.useMutation({
    onSuccess: () => {
      toast.success("Channel updated successfully")
      onOpenChange(false)
      utils.channels.list.invalidate()
      utils.channels.getMany.invalidate()
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    updateChannel.mutate({ 
      id: channelId,
      name: name.trim()
    })
  }

  return (
    <ResponsiveDialog
      title="Edit Channel"
      description="Update the channel name"
      open={open}
      onOpenChange={onOpenChange}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="name">Channel Name</Label>
          <Input
            id="name"
            placeholder="e.g. general, engineering, marketing"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={updateChannel.isPending || !name.trim()}>
            {updateChannel.isPending ? "Updating..." : "Update Channel"}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  )
}

