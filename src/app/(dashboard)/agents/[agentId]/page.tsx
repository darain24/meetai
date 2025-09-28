import { AgentIdView, AgentsIdViewLoading, AgentsIdViewError } from "@/modules/agents/ui/views/agents-id-view";
import { getQueryClient, caller } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";

interface Props {
    params: Promise<{agentId: string}>
}

const Page = async ({params}: Props) => {
    const {agentId} = await params;
    const queryClient = getQueryClient();
    void queryClient.prefetchQuery({
        queryKey: ['agents', 'getOne', { id: agentId }],
        queryFn: () => caller.agents.getOne({ id: agentId })
    });
    return (
        <HydrationBoundary state={dehydrate(queryClient)}>
            <Suspense fallback={<AgentsIdViewLoading/>}>
                <ErrorBoundary fallback={<AgentsIdViewError/>}>
                    <AgentIdView agentId={agentId}/>
                </ErrorBoundary>
            </Suspense>
        </HydrationBoundary>
    )
}

export default Page;