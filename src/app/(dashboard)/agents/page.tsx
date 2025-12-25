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

export const dynamic = 'force-dynamic'

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
            <Suspense fallback={<AgentsViewLoading/>}>
                <AgentsListHeader />
            </Suspense>
            <Suspense fallback={<AgentsViewLoading/>}>
                <HydrationBoundary state={dehydrate(queryClient)}>
                    <ErrorBoundary fallback={<AgentsViewError />}>
                        <AgentsView />
                    </ErrorBoundary>
                </HydrationBoundary>
            </Suspense>
        </>
    )
}
export default Page