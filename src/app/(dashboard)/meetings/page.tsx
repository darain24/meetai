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
 

const page = async () => {
    let session;
    
    try {
        session = await auth.api.getSession({
            headers: await headers(),
        })
    } catch (error) {
        // If session query fails (e.g., invalid token), redirect to sign-in
        console.error('Session query failed:', error);
        redirect('/sign-in')
    }
    
    if(!session) {
        redirect('/sign-in')
    }
    const queryClient = getQueryClient()
    void queryClient.prefetchQuery({ 
        queryKey: ['meetings', 'getMany', {}], 
        queryFn: () => caller.meetings.getMany({}), 
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
