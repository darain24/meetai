import { AgentsView, AgentsViewError, AgentsViewLoading } from "@/modules/agents/server/ui/views/agents-view"
import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { getQueryClient, caller } from "@/trpc/server"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"


const Page = async () => {
    const queryClient = getQueryClient()
    void queryClient.prefetchQuery({
        queryKey: ['agents', 'getMany'],
        queryFn: () => caller.agents.getMany()
    })


    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense 
            fallback={<AgentsViewLoading/>}
            >
                <ErrorBoundary fallback={<AgentsViewError />}>
                    <AgentsView />
                </ErrorBoundary>
            </Suspense>
        </HydrationBoundary>
    )
}
export default Page