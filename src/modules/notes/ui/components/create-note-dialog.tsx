'use client'

import { useState } from "react"
import { ResponsiveDialog } from "@/components/responsive-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { trpc } from "@/trpc/client"
import { toast } from "sonner"

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const CreateNoteDialog = ({ open, onOpenChange }: Props) => {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState("")
  const utils = trpc.useUtils()
  
  const createNote = trpc.notes.create.useMutation({
    onSuccess: () => {
      toast.success("Note created successfully")
      onOpenChange(false)
      setTitle("")
      setContent("")
      setTags([])
      setTagInput("")
      utils.notes.list.invalidate()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const handleRemoveTag = (tag: string) => {
    setTags(tags.filter(t => t !== tag))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    createNote.mutate({ 
      title: title.trim(), 
      content: content.trim(),
      tags 
    })
  }

  return (
    <ResponsiveDialog
      title="Create Note"
      description="Create a new note"
      open={open}
      onOpenChange={onOpenChange}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="Note title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            placeholder="Write your note here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[200px]"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tags">Tags</Label>
          <div className="flex gap-2">
            <Input
              id="tags"
              placeholder="Add a tag"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddTag()
                }
              }}
            />
            <Button type="button" onClick={handleAddTag} variant="outline">
              Add
            </Button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-muted rounded-md text-sm"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-destructive"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={createNote.isPending || !title.trim()}>
            {createNote.isPending ? "Creating..." : "Create Note"}
          </Button>
        </div>
      </form>
    </ResponsiveDialog>
  )
}


