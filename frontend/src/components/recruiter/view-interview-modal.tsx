import { memo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, Calendar, Globe, Users, Clock, Link as LinkIcon, Copy as CopyIcon } from "lucide-react";
import { toast } from "sonner";
import type { Interview } from "./types";

interface ViewInterviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interview: Interview | null;
}

export const ViewInterviewModal = memo<ViewInterviewModalProps>(
  ({ open, onOpenChange, interview }) => {
    const formatDate = useCallback((dateString: string | null) => {
      if (!dateString) return 'No deadline set';
      return new Date(dateString).toLocaleString();
    }, []);

    const getStatusColor = useCallback((status: string | null) => {
      switch (status) {
        case 'published': return 'text-green-600';
        case 'draft': return 'text-blue-600';
        case 'closed': return 'text-red-600';
        default: return 'text-muted-foreground';
      }
    }, []);

    const handleCopyLink = useCallback(async () => {
      if (!interview) return;
      const link = `${window.location.origin}/interview/${interview.id}`;
      try {
        await navigator.clipboard.writeText(link);
        toast.success("Interview link copied to clipboard");
      } catch (err) {
        toast.error("Failed to copy link "+err);
      }
    }, [interview]);

    if (!interview || !open) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-blue-600" />
              Interview Details
            </DialogTitle>
            <DialogDescription>
              View complete information about this interview
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Info */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{interview.title}</h3>
                <p className="text-sm text-muted-foreground">
                  {interview.description || 'No description provided'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Job Role:</span>
                    <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                      {interview.jobRole}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <div className={`h-2 w-2 rounded-full ${
                      interview.status === 'published' ? 'bg-green-500' :
                      interview.status === 'draft' ? 'bg-gray-500' :
                      interview.status === 'closed' ? 'bg-red-500' : 'bg-gray-300'
                    }`} />
                    <span className="font-medium">Status:</span>
                    <span className={`capitalize ${getStatusColor(interview.status)}`}>
                      {interview.status === 'published' ? 'Active' : interview.status || 'Unknown'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Globe className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Access:</span>
                    <span className={interview.isPublic ? 'text-blue-600' : 'text-orange-600'}>
                      {interview.isPublic ? 'Public' : 'Private'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Created:</span>
                    <span>{formatDate(interview.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-muted/30">
              <div className="flex items-center gap-2 text-sm mb-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">Deadline:</span>
              </div>
              <p className="text-sm ml-6 text-muted-foreground">
                {interview.deadline ? formatDate(interview.deadline) : 'No deadline set'}
              </p>
            </div>

            {interview.status === 'published' && (
              <div className="border rounded-lg p-4 bg-primary/5 border-primary/20">
                <div className="flex items-center gap-2 text-sm mb-2">
                  <LinkIcon className="h-4 w-4 text-primary" />
                  <span className="font-medium">Interview Link:</span>
                </div>
                <div className="flex items-center gap-2 ml-6">
                  <code className="text-xs bg-background px-2 py-1 rounded border flex-1 font-mono">
                    {`${window.location.origin}/interview/${interview.id}`}
                  </code>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={handleCopyLink}
                    className="shrink-0"
                  >
                    <CopyIcon className="h-3 w-3 mr-1" />
                    Copy
                  </Button>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {interview.status !== 'closed' && (
              <Button onClick={() => onOpenChange(false)}>
                Edit Interview
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

ViewInterviewModal.displayName = "ViewInterviewModal";
