import { JSX, useState } from "react";
import { Button } from "@/components/ui/button";
import { ResponsiveDialog } from "@/components/responsive-dialog";
import { title } from "process";

export const useConfirm = (
  title: string,
  description: string
): [JSX.Element, () => Promise<unknown>] => {
  const [promise, setPromise] = useState<{
    resolve: (value: boolean) => void;
  } | null>(null);

  const confirm = () => {
    return new Promise((resolve) => {
      setPromise({ resolve });
    });
  };

  const handleClose = () => {
    setPromise(null);
  };

  const handleConfirm = () => {
    promise?.resolve(true);
    handleClose();
  };

  const handleCancel = () => {
    promise?.resolve(false);
    handleClose();
  };

  const ConfirmationDialog = () => (
    <ResponsiveDialog
      title={title}
      description={description}
      open={promise !== null}
      onOpenChange={handleClose}
    >
      <div className="pt-4 w-full flex flex-col-reverse gap-y-2 lg:flex-row gap-x-2 items-center justify-end">
        <Button variant="outline" onClick={handleCancel} className="w-full lg:w-auto">
          Cancel
        </Button>
        <Button onClick={handleConfirm} className="w-full lg:w-auto">
          Confirm
        </Button>
      </div>
    </ResponsiveDialog>
  );

  return [<ConfirmationDialog key="confirm-dialog" />, confirm];
};
