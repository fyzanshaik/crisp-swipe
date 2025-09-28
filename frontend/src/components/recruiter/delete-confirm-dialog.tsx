import { memo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Trash2 } from "lucide-react";
import type { Interview } from "./types";

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interview: Interview | null;
  onConfirm: () => void;
}

export const DeleteConfirmDialog = memo<DeleteConfirmDialogProps>(
  ({ open, onOpenChange, interview, onConfirm }) => (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-600" />
            Delete Interview
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{interview?.title}"? This action cannot be undone and will permanently remove the interview and all associated data.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            Delete Interview
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
);

DeleteConfirmDialog.displayName = "DeleteConfirmDialog";
