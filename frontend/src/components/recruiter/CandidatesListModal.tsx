import { memo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { recruiterApi } from "@/lib/recruiter-api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Mail, Calendar, Trophy, Eye, FileText } from "lucide-react";
import { CandidateDetailsModal } from "./CandidateDetailsModal";

interface CandidatesListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  interviewId: string | null;
  interviewTitle?: string;
}

export const CandidatesListModal = memo(function CandidatesListModal({
  open,
  onOpenChange,
  interviewId,
  interviewTitle,
}: CandidatesListModalProps) {
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);

  const { data: candidatesData, isLoading } = useQuery({
    queryKey: ["recruiter", "candidates", interviewId],
    queryFn: () => recruiterApi.getCandidates(interviewId!),
    enabled: !!interviewId && open,
  });

  const candidates = candidatesData?.candidates || [];

  const getStatusConfig = (status: string | null) => {
    switch (status) {
      case "completed":
        return { label: "Completed", className: "bg-green-500/10 text-green-600 border-green-500/50" };
      case "in_progress":
        return { label: "In Progress", className: "bg-blue-500/10 text-blue-600 border-blue-500/50" };
      case "abandoned":
        return { label: "Abandoned", className: "bg-red-500/10 text-red-600 border-red-500/50" };
      default:
        return { label: "Not Started", className: "bg-muted text-muted-foreground" };
    }
  };

  const getScoreColor = (percentage: string | number | null) => {
    if (!percentage) return "text-muted-foreground";
    const pct = typeof percentage === 'string' ? parseFloat(percentage) : percentage;
    if (pct >= 80) return "text-green-600";
    if (pct >= 60) return "text-blue-600";
    if (pct >= 40) return "text-yellow-600";
    return "text-red-600";
  };

  const handleViewDetails = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setDetailsModalOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[1000px] w-[92vw] max-h-[90vh] p-0 gap-0">
          <div className="px-6 py-4 border-b">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                Candidates - {interviewTitle}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                View all candidates who attempted this interview
              </p>
            </DialogHeader>
          </div>

          <div className="overflow-y-auto px-6 py-5" style={{ maxHeight: "calc(90vh - 80px)" }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground">Loading candidates...</p>
                </div>
              </div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Users className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No candidates yet</h3>
                <p className="text-sm text-muted-foreground">
                  Candidates will appear here once they start the interview
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {candidates.map((candidate) => {
                  const statusConfig = getStatusConfig(candidate.status);
                  const scoreColor = getScoreColor(candidate.percentage);

                  return (
                    <Card key={candidate.id} className="border-2 hover:border-primary/30 transition-all">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-base truncate">
                                {candidate.user?.name || candidate.resume?.extractedName || "Anonymous"}
                              </h3>
                              <Badge className={`border ${statusConfig.className} text-xs px-2 py-0.5`}>
                                {statusConfig.label}
                              </Badge>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <Mail className="h-3.5 w-3.5" />
                                <span className="truncate">
                                  {candidate.user?.email || candidate.resume?.extractedEmail || "N/A"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>
                                  {candidate.completedAt
                                    ? new Date(candidate.completedAt).toLocaleDateString()
                                    : candidate.startedAt
                                      ? new Date(candidate.startedAt).toLocaleDateString()
                                      : "Not started"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {candidate.status === "completed" && (
                              <div className="text-right">
                                <div className="flex items-center gap-1.5 mb-1">
                                  <Trophy className="h-4 w-4 text-primary" />
                                  <span className={`text-lg font-bold ${scoreColor}`}>
                                    {candidate.percentage}%
                                  </span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  {candidate.finalScore} / {candidate.maxScore}
                                </p>
                              </div>
                            )}

                            <Button
                              size="sm"
                              onClick={() => handleViewDetails(candidate.id)}
                              disabled={candidate.status !== "completed"}
                            >
                              <Eye className="h-3.5 w-3.5 mr-1.5" />
                              View Details
                            </Button>
                          </div>
                        </div>

                        {candidate.recruiterNotes && (
                          <div className="mt-3 pt-3 border-t">
                            <div className="flex items-start gap-2">
                              <FileText className="h-3.5 w-3.5 text-primary mt-0.5" />
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                <span className="font-medium">Notes:</span> {candidate.recruiterNotes}
                              </p>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <CandidateDetailsModal
        open={detailsModalOpen}
        onOpenChange={setDetailsModalOpen}
        sessionId={selectedSessionId}
      />
    </>
  );
});