import { trpc } from "@/trpc/client";
import { AgentGetOne } from "../../types";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { agentsInsertSchema } from "../../schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";

import { GeneratedAvatar } from "@/components/generated-avatar";

import { Textarea } from "@/components/ui/textarea";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AgentFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialsValues?: AgentGetOne;
}

export const AgentForm = ({
  onSuccess,
  onCancel,
  initialsValues,
}: AgentFormProps) => {
  const queryClient = useQueryClient();
  const utils = trpc.useUtils();


  const createAgent = trpc.agents.create.useMutation({
    onSuccess: async () => {
      await utils.agents.getMany.invalidate();
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  });
  const updateAgent = trpc.agents.update.useMutation({
    onSuccess: async () => {
      await utils.agents.getMany.invalidate();
      if (initialsValues?.id) {
        await utils.agents.getOne.invalidate({ id: initialsValues.id });
      }
      onSuccess?.()
    },
    onError: (error) => {
      toast.error(error.message)
    },
  });

  const form = useForm<z.infer<typeof agentsInsertSchema>>({
    resolver: zodResolver(agentsInsertSchema),
    defaultValues: {
      name: initialsValues?.name ?? "",
      instructions: initialsValues?.instructions ?? "",
    },
  });

  const isEdit = !!initialsValues?.id;
  const isPending = createAgent.isPending || updateAgent.isPending;

  const onSubmit = (values: z.infer<typeof agentsInsertSchema>) => {
    if (isEdit) {
      updateAgent.mutate({...values, id: initialsValues?.id});
    } else {
      createAgent.mutate(values);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <GeneratedAvatar
          seed={form.watch("name")}
          variant="botttsNeutral"
          className="size-16 border"
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Math tutor" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="instructions"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Instructions</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="You are a helpful math assistant that can help with math problems"
                  {...field}
                />
              </FormControl>
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
  );
};
