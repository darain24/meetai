import { ChannelView } from "@/modules/channels/ui/views/channel-view";

interface Props {
  params: Promise<{
    channelId: string;
  }>;
}

export default async function ChannelPage({ params }: Props) {
  const { channelId } = await params;
  return <ChannelView channelId={channelId} />;
}


