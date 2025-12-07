import { inferRouterOutputs } from "@trpc/server"
import { AppRouter } from "@/trpc/routers/_app"

export type ChannelGetMany = inferRouterOutputs<AppRouter>["channels"]["getMany"]
export type ChannelGetMessages = inferRouterOutputs<AppRouter>["channels"]["getMessages"]
export type Channel = ChannelGetMany["items"][number]


