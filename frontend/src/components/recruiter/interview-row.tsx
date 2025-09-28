import { memo } from "react";
import { Button } from "@/components/ui/button";
import { TableCell, TableRow } from "@/components/ui/table";
import { Clock, Copy, Edit, Eye, Trash2, X } from "lucide-react";
import type { Interview } from "./types";

interface InterviewRowProps {
  interview: Interview;
  onAction: (action: string, interview: Interview) => void;
}

export const InterviewRow = memo<InterviewRowProps>(({ interview, onAction }) => {
  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'published':
        return (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
            Active
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
            Draft
          </span>
        );
      case 'closed':
        return (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
            Closed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500">
            Unknown
          </span>
        );
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <TableRow className="hover:bg-muted/50">
      <TableCell>
        <div>
          <div className="font-medium">{interview.title}</div>
          {interview.description && (
            <div className="text-sm text-muted-foreground line-clamp-1">
              {interview.description}
            </div>
          )}
        </div>
      </TableCell>
      <TableCell>
        <span className="inline-flex items-center rounded-md border border-gray-200 bg-white px-2.5 py-0.5 text-xs font-mono font-medium text-gray-900">
          {interview.jobRole}
        </span>
      </TableCell>
      <TableCell>{getStatusBadge(interview.status)}</TableCell>
      <TableCell>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="h-3 w-3 mr-1" />
          {formatDate(interview.createdAt)}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center text-sm">
          {interview.isPublic ? (
            <span className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-800">
              Public
            </span>
          ) : (
            <span className="inline-flex items-center rounded-md bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">
              Private
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAction('view', interview)}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          {interview.status !== 'closed' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction('edit', interview)}
              className="h-8 w-8 p-0"
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAction('clone', interview)}
            className="h-8 w-8 p-0"
          >
            <Copy className="h-4 w-4" />
          </Button>
          {interview.status === 'draft' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction('delete', interview)}
              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          {interview.status === 'published' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction('close', interview)}
              className="h-8 w-8 p-0 text-orange-500 hover:text-orange-600"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
});

InterviewRow.displayName = "InterviewRow";
