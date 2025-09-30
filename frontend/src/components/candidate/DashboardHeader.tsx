import { memo } from "react";

interface DashboardHeaderProps {
  userName: string;
  availableCount: number;
  sessionsCount: number;
  resumesCount: number;
}

export const DashboardHeader = memo(function DashboardHeader({
  userName,
  availableCount,
  sessionsCount,
  resumesCount,
}: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold">Welcome back, {userName}!</h1>
        <p className="text-sm text-muted-foreground">
          Manage interviews and track progress
        </p>
      </div>
      <div className="flex gap-2 text-xs text-muted-foreground">
        <span>{availableCount} available</span>
        <span>•</span>
        <span>{sessionsCount} sessions</span>
        <span>•</span>
        <span>{resumesCount} resumes</span>
      </div>
    </div>
  );
});