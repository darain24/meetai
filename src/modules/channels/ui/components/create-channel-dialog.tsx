'use client'

import { useState } from "react"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { trpc } from "@/trpc/client"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CreateChannelDialog = ({ open, onOpenChange }: Props) => {
  const router = useRouter()
  const [name, setName] = useState("")
  const utils = trpc.useUtils()
  
  const createChannel = trpc.channels.create.useMutation({
    onSuccess: (data) => {
      toast.success("Channel created successfully")
      onOpenChange(false)
      setName("")
      utils.channels.list.invalidate()
      utils.channels.getMany.invalidate()
      router.push(`/channels/${data.id}`)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    createChannel.mutate({ name: name.trim() })
  }

  return (
    <ResponsiveDialog
      title="Create Channel"
      description="Create a new channel for your team"
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
          <Button type="submit" disabled={createChannel.isPending || !name.trim()}>
            {createChannel.isPending ? "Creating..." : "Create Channel"}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  )
}


