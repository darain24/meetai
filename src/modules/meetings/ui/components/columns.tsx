"use client";

import { ColumnDef } from "@tanstack/react-table";
import { MeetingGetMany } from "../../types";
import { 
  CircleCheckIcon,
  CircleXIcon,
  ClockArrowUpIcon,
  ClockFadingIcon,
  LoaderIcon,
  VideoIcon
 } from "lucide-react";
import {cn} from '@/lib/utils' 
import { Badge } from "@/components/ui/badge";
import  humanizeDuration  from "humanize-duration";
import { format } from "date-fns";


function formatDuration(seconds: number){
  return humanizeDuration(seconds * 1000, {
    largest: 1,
    round: true,
    units: ['h', 'm', 's'],
  });
}

const statusIconMap = {
  upcoming: ClockArrowUpIcon,
  active: LoaderIcon,
  completed: CircleCheckIcon,
  cancelled: CircleXIcon,
  processing: ClockFadingIcon,
}

const statusColorMap ={
  upcoming: 'text-yellow-800 bg-yellow-500/20 border-yellow-800/5',
  active: 'text-blue-800 bg-blue-500/20 border-blue-800/5',
  completed: 'text-emerald-800 bg-emerald-500/20 border-emerald-800/5',
  cancelled: 'text-rose-800 bg-rose-500/20 border-rose-800/5',
  processing: 'text-gray-800 bg-gray-500/20 border-gray-800/5',
}

export const columns: ColumnDef<MeetingGetMany[number]>[] = [
  {
    accessorKey: "name",
    header: "Meeting Name",
    cell: ({ row }) => (
      <div className="flex flex-col gap-y-1">
        <span className="font-semibold capitalize">{row.original.name}</span>
        <span className="text-sm text-muted-foreground">
          {row.original.startedAt ? format(row.original.startedAt, 'MMM d') : ''}
        </span>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({row}) => {
      const Icon = statusIconMap[row.original.status as keyof typeof statusIconMap];
      return (
        <Badge
          variant="outline"
          className={cn("capitalize flex items-center gap-x-2 [&>svg]:size-4", statusColorMap[row.original.status as keyof typeof statusColorMap])}
        >
          <Icon className={cn(
            row.original.status === 'processing' && 'animate-spin'
          )}/>
          {row.original.status}
        </Badge>
      );
    },
  },
  {
    accessorKey: "duration",
    header: "Duration",
    cell: ({row}) => {
      if (!row.original.duration) return null;
      return (
        <Badge 
          variant="outline"
          className="capitalize flex items-center gap-x-2 [&>svg]:size-4"
        >
          <ClockFadingIcon className='text-blue-700'/>
          {formatDuration(row.original.duration)}
        </Badge>
      );
    },
  }
];
