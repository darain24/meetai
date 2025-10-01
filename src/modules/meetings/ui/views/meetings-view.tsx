'use client'

import { ErrorState } from "@/components/error-state"
import { LoadingState } from "@/components/loading-state"
import { trpc } from "@/trpc/client"

export const MeetingsView = () => {
    const [data] = trpc.meetings.getMany.useSuspenseQuery({})
    
    return (
        <div>
            {JSON.stringify(data)}
        </div>
    )
}
export const MeetingsViewLoading = () => {
    return (
      <LoadingState
        title="Loading Agents"
        description="This may take a few seconds"
      />
    );
  };
  
  export const MeetingsViewError = () => {
    return (
      <ErrorState
        title="Error Loading Agents"
        description="Something went wrong"
      />
    );
  };