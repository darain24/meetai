import { ChannelsView } from "@/modules/channels/ui/views/channels-view";
import { Suspense } from "react";
import { LoadingState } from "@/components/loading-state";

export default function ChannelsPage() {
  return (
    <Suspense fallback={<LoadingState title="Loading channels" description="Please wait..." />}>
      <ChannelsView />
    </Suspense>
  );
}


