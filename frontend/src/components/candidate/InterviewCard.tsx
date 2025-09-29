import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, Calendar, ExternalLink } from "lucide-react";

interface Interview {
  id: string;
  title: string;
  description: string | null;
  jobRole: string;
  deadline: string | null;
  isPublic: boolean | null;
  createdAt: string | null;
}

interface InterviewCardProps {
  interview: Interview;
  onClick: () => void;
}

export const InterviewCard = memo(function InterviewCard({
  interview,
  onClick,
}: InterviewCardProps) {
  const deadline = interview.deadline ? new Date(interview.deadline) : null;
  const isDeadlinePassed = deadline && deadline < new Date();

  return (
    <Card
      className="hover:shadow-sm transition-all cursor-pointer border-l-2 border-l-primary hover:border-l-primary/80"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{interview.title}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <Target className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{interview.jobRole}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-3">
            {interview.isPublic ? (
              <Badge variant="outline" className="text-xs px-1.5 py-0">
                Public
              </Badge>
            ) : (
              <Badge variant="secondary" className="text-xs px-1.5 py-0">
                Assigned
              </Badge>
            )}
            <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
          </div>
        </div>

        {interview.description && (
          <p className="text-xs text-muted-foreground line-clamp-1 mb-2">
            {interview.description}
          </p>
        )}

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {deadline && (
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {isDeadlinePassed ? (
                <span className="text-destructive">Expired</span>
              ) : (
                deadline.toLocaleDateString()
              )}
            </div>
          )}
          <span>Click for details →</span>
        </div>
      </CardContent>
    </Card>
  );
});
