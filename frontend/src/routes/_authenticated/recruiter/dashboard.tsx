import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, BarChart3, Settings, Plus, Eye } from "lucide-react";

export const Route = createFileRoute("/_authenticated/recruiter/dashboard")({
  beforeLoad: ({ context }) => {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Recruiter Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back, {user?.name}! Manage your interviews and candidates.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Candidates
            </CardTitle>
            <CardDescription>
              Manage your candidate pool
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                12 candidates in your pool
              </p>
              <Button size="sm" disabled>
                <Eye className="mr-2 h-4 w-4" />
                View Candidates
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Active Interviews
            </CardTitle>
            <CardDescription>
              Monitor ongoing interview sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                3 interviews in progress
              </p>
              <Button size="sm" disabled>
                <Eye className="mr-2 h-4 w-4" />
                View Active
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Plus className="mr-2 h-5 w-5" />
              Create Interview
            </CardTitle>
            <CardDescription>
              Schedule a new interview session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Set up a new interview with a candidate.
            </p>
            <Button size="sm" disabled>
              <Plus className="mr-2 h-4 w-4" />
              Create Interview
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Analytics
            </CardTitle>
            <CardDescription>
              View interview performance metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Total Interviews</span>
                <span className="text-muted-foreground ml-2">47</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Success Rate</span>
                <span className="text-muted-foreground ml-2">78%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="mr-2 h-5 w-5" />
              Settings
            </CardTitle>
            <CardDescription>
              Configure your recruiter account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Manage your account preferences.
            </p>
            <Button variant="outline" size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Account Settings
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              Your latest recruiter activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-sm">
                <span className="font-medium">Interview completed</span>
                <span className="text-muted-foreground ml-2">1 hour ago</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">New candidate added</span>
                <span className="text-muted-foreground ml-2">3 hours ago</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">Interview scheduled</span>
                <span className="text-muted-foreground ml-2">Yesterday</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
