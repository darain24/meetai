import { trpc } from "@/trpc/client";
import { MeetingGetOne } from "../../types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { meetingsInsertSchema } from "../../schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";

import { CommandSelect } from "@/components/command-select";
import { GeneratedAvatar } from "@/components/generated-avatar";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { NewAgentDialog } from "@/modules/agents/ui/components/new-agent-dialog";

interface MeetingFormProps {
  onSuccess?: (id? : string) => void;
  onCancel?: () => void;
  initialsValues?: MeetingGetOne;
}

export const MeetingForm = ({
  onSuccess,
  onCancel,
  initialsValues,
}: MeetingFormProps) => {
  const utils = trpc.useUtils();
  const [agentSearch, setAgentSearch] = useState('')
  const [openNewAgentDialog, setOpenNewAgentDialog] = useState(false)
  const agents = trpc.agents.getMany.useQuery({
    pageSize: 100,
    search: agentSearch
  })



  const createMeeting = trpc.meetings.create.useMutation({
    onSuccess: async (data) => {
      await utils.meetings.getMany.invalidate();
      onSuccess?.(data.id)
    },
    onError: (error) => {
      toast.error(error.message)
    },
  });
  const updateMeeting = trpc.meetings.update.useMutation({
    onSuccess: async () => {
      await utils.meetings.getMany.invalidate();
      if (initialsValues?.id) {
        await utils.meetings.getOne.invalidate({ id: initialsValues.id });
      }
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  });

  const form = useForm<z.infer<typeof meetingsInsertSchema>>({
    resolver: zodResolver(meetingsInsertSchema),
    defaultValues: {
      name: initialsValues?.name ?? "",
      agentId: initialsValues?.agentId ?? "",
    },
  });

  const isEdit = !!initialsValues?.id;
  const isPending = createMeeting.isPending || updateMeeting.isPending;

  const onSubmit = (values: z.infer<typeof meetingsInsertSchema>) => {
    if (isEdit) {
      updateMeeting.mutate({...values, id: initialsValues?.id});
    } else {
      createMeeting.mutate(values);
    }
  };

  return (
    <>
    <NewAgentDialog open={openNewAgentDialog} onOpenChange={setOpenNewAgentDialog} />
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Math Consultations" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="agentId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Agent</FormLabel>
              <FormControl>
                <CommandSelect 
                  options = {(agents.data?.items ?? []).map((agent) => ({
                    id: agent.id,
                    value: agent.id,
                    children: (
                      <div className="flex items-center gap-x-2">
                        <GeneratedAvatar
                          seed= {agent.name}
                          variant="botttsNeutral"
                          className="border size-6"
                        />
                        <span>{agent.name}</span>
                      </div>
                    )
                  }))}
                  onSelect={field.onChange}
                  onSearch={setAgentSearch}
                  value={field.value}
                  placeholder="Select an agent"
                />
              </FormControl>
              <FormDescription>
                  Not found what you&apos;re looking for?{' '}
                  <button className = 'text-primary hover:underline' type="button" onClick={() => setOpenNewAgentDialog(true)}>
                    Create a new agent
                  </button>
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-between gap-x-2 ">
          {onCancel && (
            <Button
              type="button"
              variant="ghost"
              onClick={onCancel}
              disabled={isPending}
            >
              Cancel
            </Button>
          )}
            <Button type="submit" disabled={isPending}>
                {isEdit ? "Update" : "Create"}
            </Button>
        </div>
      </form>
    </Form>
    </>
  );
};
