import { AgentsView, AgentsViewError, AgentsViewLoading } from "@/modules/agents/ui/views/agents-view"
import { HydrationBoundary, dehydrate } from "@tanstack/react-query"
import { getQueryClient, caller } from "@/trpc/server"
import { Suspense } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { AgentsListHeader } from "@/modules/agents/ui/components/agents-list-header"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { SearchParams } from "nuqs/server"
import { filterSearchParams } from "@/modules/agents/params"

interface Props {
    searchParams: Promise<SearchParams>
}

const Page = async ({searchParams}: Props) => {
    const filters = {
        search: filterSearchParams.search.parseServerSide((await searchParams).search),
        page: filterSearchParams.page.parseServerSide((await searchParams).page),
    }
    const session = await auth.api.getSession({
        headers: await headers(),
      })
    
      if(!session) {
        redirect('/sign-in')
      }
    const queryClient = getQueryClient()
    void queryClient.prefetchQuery({ 
      queryKey: ['agents', 'getMany', {}], 
      queryFn: () => caller.agents.getMany({}), 
      ...filters,
    })


    return (
        <>
            <AgentsListHeader />
            <HydrationBoundary state={dehydrate(queryClient)}>
                <Suspense 
                fallback={<AgentsViewLoading/>}
                >
                    <ErrorBoundary fallback={<AgentsViewError />}>
                        <AgentsView />
                    </ErrorBoundary>
                </Suspense>
            </HydrationBoundary>
        </>
    )
}
export default Page