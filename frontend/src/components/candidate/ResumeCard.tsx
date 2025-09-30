import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, CheckCircle, AlertCircle, MessageSquare } from "lucide-react";

interface Resume {
  id: string;
  fileName: string;
  fileType: "pdf" | "docx";
  extractedName: string;
  extractedEmail: string;
  extractedPhone: string;
  uploadedAt: string | null;
  verifiedAt: string | null;
  verificationMethod: "ai_only" | "ai_plus_manual" | "manual_only";
  missingFields?: string[] | null;
}

interface ResumeCardProps {
  resume: Resume;
  onComplete: () => void;
}

export const ResumeCard = memo(function ResumeCard({
  resume,
  onComplete,
}: ResumeCardProps) {
  const isVerified =
    !!resume.verifiedAt &&
    (!resume.missingFields || resume.missingFields.length === 0);

  return (
    <Card className="hover:shadow-sm transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-sm truncate">{resume.fileName}</h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <FileText className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">
                {resume.extractedName || "Name not extracted"}
              </span>
            </div>
          </div>
          {isVerified ? (
            <Badge
              variant="default"
              className="bg-green-100 text-green-800 text-xs px-1.5 py-0"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          ) : (
            <Badge variant="destructive" className="text-xs px-1.5 py-0">
              <AlertCircle className="h-3 w-3 mr-1" />
              Incomplete
            </Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 mb-2 text-xs text-muted-foreground">
          <div className="truncate">
            <span className="font-medium">Email:</span>{" "}
            {resume.extractedEmail || "Missing"}
          </div>
          <div className="truncate">
            <span className="font-medium">Phone:</span>{" "}
            {resume.extractedPhone || "Missing"}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {resume.uploadedAt
              ? new Date(resume.uploadedAt).toLocaleDateString()
              : "Unknown date"}
          </div>

          {!isVerified &&
            resume.missingFields &&
            resume.missingFields.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs"
                onClick={onComplete}
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Complete
              </Button>
            )}
        </div>
      </CardContent>
    </Card>
  );
});