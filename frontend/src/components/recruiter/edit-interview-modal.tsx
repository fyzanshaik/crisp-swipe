import { memo, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Edit, Calendar, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import type { Interview } from "./types";

interface EditInterviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interview: Interview | null;
  onSave: (interviewId: string, data: Partial<Interview>) => void;
  onPublish?: (interviewId: string) => void;
}

export const EditInterviewModal = memo<EditInterviewModalProps>(
  ({ open, onOpenChange, interview, onSave, onPublish }) => {
    const [formData, setFormData] = useState({
      title: '',
      jobRole: '',
      description: '',
      isPublic: true,
      deadline: ''
    });

    useEffect(() => {
      if (interview && open) {
        setFormData({
          title: interview.title || '',
          jobRole: interview.jobRole || '',
          description: interview.description || '',
          isPublic: interview.isPublic ?? true,
          deadline: interview.deadline ? new Date(interview.deadline).toISOString().slice(0, 16) : ''
        });
      }
    }, [interview, open]);

    const handleSave = useCallback(() => {
      if (!interview) return;

      if (!formData.title.trim()) {
        toast.error("Interview title is required");
        return;
      }

      if (!formData.jobRole.trim()) {
        toast.error("Job role is required");
        return;
      }

      const updateData: Partial<Interview> = {
        title: formData.title.trim(),
        jobRole: formData.jobRole.trim(),
        description: formData.description.trim() || null,
        isPublic: formData.isPublic,
        deadline: formData.deadline ? new Date(formData.deadline).toISOString() : null
      };

      onSave(interview.id, updateData);
      onOpenChange(false);
    }, [interview, formData, onSave, onOpenChange]);

    const handlePublish = useCallback(() => {
      if (!interview || !onPublish) return;

      if (!formData.title.trim() || !formData.jobRole.trim()) {
        toast.error("Please fill in all required fields before publishing");
        return;
      }

      // Save changes first, then publish
      handleSave();
      setTimeout(() => {
        onPublish(interview.id);
      }, 100);
    }, [interview, formData, onPublish, handleSave]);

    if (!interview) return null;

    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="h-5 w-5 text-blue-600" />
              Edit Interview
            </DialogTitle>
            <DialogDescription>
              Update the interview details. Changes will be saved immediately.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Interview Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Interview Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., Frontend Developer Interview"
              />
            </div>

            {/* Job Role */}
            <div className="space-y-2">
              <Label htmlFor="jobRole">Job Role *</Label>
              <Input
                id="jobRole"
                value={formData.jobRole}
                onChange={(e) => setFormData(prev => ({ ...prev, jobRole: e.target.value }))}
                placeholder="e.g., Full Stack Developer"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Optional description about this interview"
                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              />
            </div>

            {/* Access Type */}
            <div className="space-y-3">
              <Label className="text-base">Interview Access</Label>
              <div className="space-y-2">
                <div 
                  className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    formData.isPublic 
                      ? 'border-primary bg-primary/5' 
                      : 'border-input hover:border-muted-foreground/50'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                >
                  <div className="relative">
                    <input
                      type="radio"
                      checked={formData.isPublic}
                      onChange={() => setFormData(prev => ({ ...prev, isPublic: true }))}
                      className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      <span className="font-medium">Public Access</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Anyone can access this interview with the link</p>
                  </div>
                </div>
                
                <div 
                  className={`flex items-center space-x-3 rounded-lg border p-3 cursor-pointer transition-colors ${
                    !formData.isPublic 
                      ? 'border-primary bg-primary/5' 
                      : 'border-input hover:border-muted-foreground/50'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, isPublic: false }))}
                >
                  <div className="relative">
                    <input
                      type="radio"
                      checked={!formData.isPublic}
                      onChange={() => setFormData(prev => ({ ...prev, isPublic: false }))}
                      className="h-4 w-4 border-gray-300 text-primary focus:ring-primary"
                    />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4 text-orange-500" />
                      <span className="font-medium">Private Access</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Only assigned candidates can access</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Deadline */}
            <div className="space-y-2">
              <Label htmlFor="deadline" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Deadline
              </Label>
              <input
                id="deadline"
                type="datetime-local"
                value={formData.deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Status Info */}
            <div className={`p-4 rounded-lg border ${
              interview.status === 'published' ? 'bg-green-50 border-green-200' :
              interview.status === 'draft' ? 'bg-blue-50 border-blue-200' :
              interview.status === 'closed' ? 'bg-red-50 border-red-200' :
              'bg-muted border-border'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <div className={`h-2 w-2 rounded-full ${
                  interview.status === 'published' ? 'bg-green-500' :
                  interview.status === 'draft' ? 'bg-blue-500' :
                  interview.status === 'closed' ? 'bg-red-500' :
                  'bg-gray-400'
                }`} />
                <span className="text-sm font-medium">
                  Status: {interview.status === 'published' ? 'Active' : interview.status === 'draft' ? 'Draft' : interview.status || 'Unknown'}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {interview.status === 'draft' && "Interview is saved as draft. Publish to make it available to candidates."}
                {interview.status === 'published' && "Interview is live and accepting candidates."}
                {interview.status === 'closed' && "Interview is closed. No new candidates can apply."}
              </p>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <div className="flex gap-2">
              <Button 
                onClick={handleSave} 
                disabled={interview.status === 'closed'}
                variant="outline"
              >
                Save Changes
              </Button>
              {interview.status === 'draft' && onPublish && (
                <Button 
                  onClick={handlePublish}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Save & Publish
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
);

EditInterviewModal.displayName = "EditInterviewModal";
