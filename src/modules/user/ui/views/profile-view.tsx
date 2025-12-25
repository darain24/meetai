'use client'

import { trpc } from "@/trpc/client"
import { LoadingState } from "@/components/loading-state"
import { ErrorState } from "@/components/error-state"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ArrowLeft, TrashIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { toast } from "sonner"
import { useConfirm } from "@/hooks/use-confirm"
import { authClient } from "@/lib/auth-client"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import { GeneratedAvatar } from "@/components/generated-avatar"

export const ProfileView = () => {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const [name, setName] = useState("")
  const [image, setImage] = useState("")
  const [deleteConfirmation, confirmDelete] = useConfirm(
    'Are you sure?',
    'This will permanently delete your account and all associated data. This action cannot be undone.'
  )

  const { data: user, isLoading, error } = trpc.user.getOne.useQuery()
  const utils = trpc.useUtils()

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setImage(user.image || "")
    }
  }, [user])

  const updateUser = trpc.user.update.useMutation({
    onSuccess: async () => {
      toast.success("Profile updated successfully")
      await utils.user.getOne.invalidate()
      // Refresh session to get updated user data
      await authClient.getSession()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const deleteUser = trpc.user.delete.useMutation({
    onSuccess: async () => {
      toast.success("Account deleted successfully")
      // Sign out and redirect to login
      await authClient.signOut({
        fetchOptions: {
          onSuccess: () => {
            router.push("/sign-in")
          }
        }
      })
    },
    onError: (error) => {
      toast.error(error.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateUser.mutate({
      name: name.trim(),
      image: image.trim() || undefined,
    })
  }

  const handleDelete = async () => {
    const ok = await confirmDelete()
    if (!ok) return
    deleteUser.mutate()
  }

  if (isLoading) {
    return <LoadingState title="Loading profile" description="Please wait..." />
  }

  if (error || !user) {
    return <ErrorState title="Error loading profile" description={error?.message || "Failed to load profile"} />
  }

  return (
    <>
      {deleteConfirmation}
      <div className="flex-1 pb-4 px-4 md:px-8 flex flex-col gap-y-6 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center gap-4 pt-6">
          <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Profile</h1>
            <p className="text-muted-foreground mt-1">Manage your account settings</p>
          </div>
        </div>

        {/* Profile Card */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your profile information</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Avatar Preview */}
              <div className="flex items-center gap-4">
                {image ? (
                  <Avatar className="size-20">
                    <AvatarImage src={image} alt={name} />
                    <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                ) : (
                  <GeneratedAvatar 
                    seed={name || "User"} 
                    variant="initials" 
                    className="size-20"
                  />
                )}
                <div className="flex-1">
                  <Label htmlFor="image">Profile Image URL</Label>
                  <Input
                    id="image"
                    type="url"
                    placeholder="https://example.com/avatar.jpg"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Enter a URL for your profile image
                  </p>
                </div>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* Email (read-only) */}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end gap-2">
                <Button
                  type="submit"
                  disabled={updateUser.isPending || !name.trim()}
                >
                  {updateUser.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Once you delete your account, there is no going back. Please be certain.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteUser.isPending}
              >
                <TrashIcon className="size-4 mr-2" />
                {deleteUser.isPending ? "Deleting..." : "Delete Account"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  )
}



