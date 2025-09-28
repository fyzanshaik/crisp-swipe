import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/lib/use-auth";
import { recruiterApi } from "@/lib/recruiter-api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Calendar, BarChart3, Plus, Activity, TrendingUp } from "lucide-react";
import { useMemo, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  StatCard,
  InterviewRow,
  DeleteConfirmDialog,
  ViewInterviewModal,
  EditInterviewModal,
  type Interview,
  type InterviewsData
} from "@/components/recruiter";

export const Route = createFileRoute("/_authenticated/recruiter/dashboard")({
  beforeLoad: ({ context }) => {
    if (context.auth.isLoading) {
      return;
    }
    
    if (context.auth.user?.role !== "recruiter") {
      throw redirect({
        to: "/candidate/dashboard",
      });
    }
  },
  component: RecruiterDashboard,
});

function RecruiterDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    interview: Interview | null;
  }>({ open: false, interview: null });

  const [viewModal, setViewModal] = useState<{
    open: boolean;
    interview: Interview | null;
  }>({ open: false, interview: null });

  const [editModal, setEditModal] = useState<{
    open: boolean;
    interview: Interview | null;
  }>({ open: false, interview: null });
  
  const { data: dashboardData, isLoading: dashboardLoading } = useQuery({
    queryKey: ["recruiter", "dashboard"],
    queryFn: recruiterApi.getDashboard,
  });

  const { data: interviewsData, isLoading: interviewsLoading } = useQuery({
    queryKey: ["recruiter", "interviews"],
    queryFn: recruiterApi.getInterviews,
  });

  const cloneMutation = useMutation({
    mutationFn: recruiterApi.cloneInterview,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiter", "interviews"] });
      toast.success("Interview cloned successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to clone interview: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: recruiterApi.deleteInterview,
    onMutate: async (interviewId: string) => {
      await queryClient.cancelQueries({ queryKey: ["recruiter", "interviews"] });
      const previousData = queryClient.getQueryData(["recruiter", "interviews"]);
      
      queryClient.setQueryData(["recruiter", "interviews"], (old: InterviewsData | undefined) => ({
        interviews: old?.interviews?.filter((interview: Interview) => interview.id !== interviewId) || []
      }));
      
      return { previousData };
    },
    onSuccess: () => {
      toast.success("Interview deleted successfully");
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["recruiter", "interviews"], context.previousData);
      }
      toast.error(`Failed to delete interview: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiter", "interviews"] });
    },
  });

  const closeMutation = useMutation({
    mutationFn: recruiterApi.closeInterview,
    onMutate: async (interviewId: string) => {
      await queryClient.cancelQueries({ queryKey: ["recruiter", "interviews"] });
      const previousData = queryClient.getQueryData(["recruiter", "interviews"]);
      
      queryClient.setQueryData(["recruiter", "interviews"], (old: InterviewsData | undefined) => ({
        interviews: old?.interviews?.map((interview: Interview) => 
          interview.id === interviewId 
            ? { ...interview, status: 'closed' as const }
            : interview
        ) || []
      }));
      
      return { previousData };
    },
    onSuccess: () => {
      toast.success("Interview closed successfully");
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["recruiter", "interviews"], context.previousData);
      }
      toast.error(`Failed to close interview: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiter", "interviews"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Interview> }) => {
      const cleanData: Parameters<typeof recruiterApi.updateInterview>[1] = {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.jobRole !== undefined && { jobRole: data.jobRole }),
        ...(data.description !== undefined && { description: data.description || undefined }),
        ...(data.isPublic !== undefined && { isPublic: data.isPublic ?? undefined }),
        ...(data.deadline !== undefined && { deadline: data.deadline || undefined }),
      };
      return recruiterApi.updateInterview(id, cleanData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiter", "interviews"] });
      toast.success("Interview updated successfully");
    },
    onError: (error: Error) => {
      toast.error(`Failed to update interview: ${error.message}`);
    },
  });

  const publishMutation = useMutation({
    mutationFn: recruiterApi.publishInterview,
    onMutate: async (interviewId: string) => {
      await queryClient.cancelQueries({ queryKey: ["recruiter", "interviews"] });
      const previousData = queryClient.getQueryData(["recruiter", "interviews"]);
      
      queryClient.setQueryData(["recruiter", "interviews"], (old: InterviewsData | undefined) => ({
        interviews: old?.interviews?.map((interview: Interview) => 
          interview.id === interviewId 
            ? { ...interview, status: 'published' as const }
            : interview
        ) || []
      }));
      
      return { previousData };
    },
    onSuccess: () => {
      toast.success("Interview published successfully");
    },
    onError: (error: Error, _variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(["recruiter", "interviews"], context.previousData);
      }
      toast.error(`Failed to publish interview: ${error.message}`);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["recruiter", "interviews"] });
    },
  });

  const statsData = useMemo(() => {
    if (!dashboardData?.stats) return [];
    const { stats } = dashboardData;
    return [
      { 
        title: "Total Interviews", 
        value: stats.totalInterviews, 
        description: "All created interviews",
        icon: BarChart3,
        trend: stats.totalInterviews > 0 ? "+12% from last month" : undefined
      },
      { 
        title: "Active Interviews", 
        value: stats.activeInterviews, 
        description: "Currently published",
        icon: Activity,
        trend: stats.activeInterviews > 0 ? "Live now" : undefined
      },
      { 
        title: "Total Candidates", 
        value: stats.totalCandidates, 
        description: "Applied candidates",
        icon: Users,
        trend: stats.totalCandidates > 0 ? "+8% this week" : undefined
      },
      { 
        title: "Average Score", 
        value: `${stats.avgScore}%`, 
        description: "Overall performance",
        icon: TrendingUp,
        trend: stats.avgScore > 70 ? "Above average" : undefined
      },
    ];
  }, [dashboardData]);

  const handleInterviewAction = async (action: string, interview: Interview) => {
    switch (action) {
      case 'view':
        setViewModal({ open: true, interview });
        break;
      case 'edit':
        if (interview.status === 'closed') {
          toast.error("Cannot edit closed interviews");
          return;
        }
        setEditModal({ open: true, interview });
        break;
      case 'clone':
        cloneMutation.mutate(interview.id);
        break;
      case 'delete':
        setDeleteDialog({ open: true, interview });
        break;
      case 'close':
        if (window.confirm(`Are you sure you want to close "${interview.title}"? This will stop accepting new candidates.`)) {
          closeMutation.mutate(interview.id);
        }
        break;
    }
  };

  const handleConfirmDelete = () => {
    if (deleteDialog.interview) {
      deleteMutation.mutate(deleteDialog.interview.id);
    }
  };

  const handleSaveEdit = useCallback((interviewId: string, data: Partial<Interview>) => {
    updateMutation.mutate({ id: interviewId, data });
  }, [updateMutation]);

  const handlePublish = useCallback((interviewId: string) => {
    publishMutation.mutate(interviewId);
  }, [publishMutation]);

  const handleCloseModal = useCallback((modalType: 'view' | 'edit' | 'delete') => {
    switch (modalType) {
      case 'view':
        setViewModal({ open: false, interview: null });
        break;
      case 'edit':
        setEditModal({ open: false, interview: null });
        break;
      case 'delete':
        setDeleteDialog({ open: false, interview: null });
        break;
    }
  }, []);

  if (dashboardLoading || interviewsLoading) {
    return (
      <div className="flex-1 space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">Loading your interview data...</p>
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/3 mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const interviews = interviewsData?.interviews || [];
  const hasInterviews = interviews.length > 0;

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.name}! Here's what's happening with your interviews.
          </p>
        </div>
        <Button size="lg" className="h-10">
          <Plus className="mr-2 h-4 w-4" />
          Create Interview
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsData.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Interviews</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Manage and track your interview campaigns
              </p>
            </div>
            {hasInterviews && (
              <Button variant="outline" size="sm">
                View All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {!hasInterviews ? (
            <div className="flex flex-col items-center justify-center py-12 px-6">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted mb-4">
                <Calendar className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No interviews yet</h3>
              <p className="text-sm text-muted-foreground text-center mb-6 max-w-sm">
                Get started by creating your first interview. It only takes a few minutes to set up.
              </p>
              <Button size="lg">
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Interview
              </Button>
            </div>
          ) : (
            <div className="px-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Interview</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Access</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interviews.map((interview) => (
                    <InterviewRow
                      key={interview.id}
                      interview={interview}
                      onAction={handleInterviewAction}
                    />
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <DeleteConfirmDialog
        open={deleteDialog.open}
        onOpenChange={() => handleCloseModal('delete')}
        interview={deleteDialog.interview}
        onConfirm={handleConfirmDelete}
      />

      <ViewInterviewModal
        open={viewModal.open}
        onOpenChange={() => handleCloseModal('view')}
        interview={viewModal.interview}
      />

      <EditInterviewModal
        open={editModal.open}
        onOpenChange={() => handleCloseModal('edit')}
        interview={editModal.interview}
        onSave={handleSaveEdit}
        onPublish={handlePublish}
      />
    </div>
  );
}