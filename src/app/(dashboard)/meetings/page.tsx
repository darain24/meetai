import { MeetingsView, MeetingsViewError, MeetingsViewLoading } from "@/modules/meetings/ui/views/meetings-view";
import { getQueryClient, caller } from "@/trpc/server";
import { HydrationBoundary } from "@tanstack/react-query";
import { dehydrate } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { MeetingsListHeader } from "@/modules/meetings/ui/components/meetings-list-header";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {loadSearchParams} from "@/modules/meetings/params"
import type {SearchParams} from "nuqs/server"

export const dynamic = 'force-dynamic'

interface Props {
    searchParams: Promise<SearchParams>
}

const page = async ({searchParams}: Props) => {
    const filters = await loadSearchParams(searchParams)
    const session = await auth.api.getSession({
        headers: await headers(),
      })
    
      if(!session) {
        redirect('/sign-in')
      }
    const queryClient = getQueryClient()
    void queryClient.prefetchQuery({ 
        queryKey: ['meetings', 'getMany', {}], 
        queryFn: () => caller.meetings.getMany({}), 
        ...filters,
    })
    return (
        <>
            <MeetingsListHeader />
            <HydrationBoundary state={dehydrate(queryClient)}>
                <Suspense fallback={<MeetingsViewLoading/>}>
                    <ErrorBoundary fallback={<MeetingsViewError />}>
                        <MeetingsView />
                    </ErrorBoundary>
                </Suspense>
            </HydrationBoundary>
        </>
    )
}

export default page;
