import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, FileText, Calendar, User } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/candidate/dashboard")({
  beforeLoad: ({ context }) => {
    if (context.auth.user?.role !== "candidate") {
      throw redirect({
        to: "/recruiter/dashboard",
      });
    }
  },
  component: CandidateDashboard,
});

function CandidateDashboard() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Candidate Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}! Manage your interviews and profile.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Profile
            </CardTitle>
            <CardDescription>
              Your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Keep your profile updated for better matches.
            </p>
            <Button variant="outline" size="sm">
              Edit Profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Play className="mr-2 h-5 w-5" />
              Interviews
            </CardTitle>
            <CardDescription>
              Your scheduled and completed interviews
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                You have 1 interview scheduled
              </p>
              <Button asChild size="sm">
                <Link to="/candidate/interview/$id" params={{ id: "sample-123" }}>
                  <Play className="mr-2 h-4 w-4" />
                  Start Interview
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Resume
            </CardTitle>
            <CardDescription>
              Upload and manage your resume
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              No resume uploaded yet.
            </p>
            <Button variant="outline" size="sm">
              Upload Resume
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Schedule
            </CardTitle>
            <CardDescription>
              View your interview calendar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              No upcoming interviews.
            </p>
            <Button variant="outline" size="sm">
              View Calendar
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest interview activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Interview completed</span>
                <span className="text-muted-foreground ml-2">2 days ago</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Profile updated</span>
                <span className="text-muted-foreground ml-2">1 week ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
            <CardDescription>
              Your interview performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">3</div>
                <div className="text-xs text-muted-foreground">Completed</div>
              </div>
              <div>
                <div className="text-2xl font-bold">85%</div>
                <div className="text-xs text-muted-foreground">Success Rate</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
