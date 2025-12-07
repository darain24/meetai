import { inferRouterOutputs } from "@trpc/server"
import { AppRouter } from "@/trpc/routers/_app"

export type Note = inferRouterOutputs<AppRouter>["notes"]["list"]["items"][number]
export type NoteGetOne = inferRouterOutputs<AppRouter>["notes"]["getOne"]
export type NotesListResponse = inferRouterOutputs<AppRouter>["notes"]["list"]


