import { memo } from "react";
import { Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, Calendar, Clock, CheckCircle2, PlayCircle, XCircle } from "lucide-react";

interface InterviewSession {
  id: string;
  interviewId?: string;
  status: "not_started" | "in_progress" | "completed" | "abandoned" | null;
  startedAt: string | null;
  completedAt: string | null;
  interview?: {
    id: string;
    title: string;
    jobRole: string;
  };
}

interface SessionCardProps {
  session: InterviewSession;
  onViewResults: (sessionId: string) => void;
}

export const SessionCard = memo(function SessionCard({
  session,
  onViewResults,
}: SessionCardProps) {
  const getStatusConfig = (status: string | null) => {
    switch (status) {
      case "completed":
        return {
          icon: CheckCircle2,
          variant: "default" as const,
          className: "bg-green-500/10 text-green-600 border-green-500/50",
          label: "Completed",
        };
      case "in_progress":
        return {
          icon: PlayCircle,
          variant: "default" as const,
          className: "bg-blue-500/10 text-blue-600 border-blue-500/50",
          label: "In Progress",
        };
      case "abandoned":
        return {
          icon: XCircle,
          variant: "destructive" as const,
          className: "bg-red-500/10 text-red-600 border-red-500/50",
          label: "Abandoned",
        };
      default:
        return {
          icon: Clock,
          variant: "secondary" as const,
          className: "",
          label: status || "Unknown",
        };
    }
  };

  const statusConfig = getStatusConfig(session.status);
  const StatusIcon = statusConfig.icon;

  return (
    <Card className="border-2 hover:border-primary/50 transition-all">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base mb-2 line-clamp-1">
              {session.interview?.title}
            </h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Target className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{session.interview?.jobRole}</span>
            </div>
          </div>
          <Badge variant={statusConfig.variant} className={`border ${statusConfig.className} flex items-center gap-1.5 px-3 py-1`}>
            <StatusIcon className="h-3.5 w-3.5" />
            {statusConfig.label}
          </Badge>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {session.completedAt
                ? new Date(session.completedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : session.startedAt
                  ? new Date(session.startedAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })
                  : "Not started"}
            </span>
          </div>

          <div className="flex gap-2">
            {session.status === "completed" && (
              <Button
                variant="default"
                size="sm"
                onClick={() => onViewResults(session.id)}
              >
                View Results
              </Button>
            )}

            {session.status === "in_progress" && (
              <Link
                to="/candidate/interview-taking/$id"
                params={{ id: session.interviewId }}
              >
                <Button size="sm">
                  Resume Interview
                </Button>
              </Link>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});