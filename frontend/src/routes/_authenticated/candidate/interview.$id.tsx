import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuth } from "@/lib/use-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, ArrowLeft, Clock, User, Calendar, Play } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/candidate/interview/$id")({
  beforeLoad: ({ context }) => {
    if (context.auth.user?.role !== "candidate") {
      throw redirect({
        to: "/recruiter/dashboard",
      });
    }
  },
  component: InterviewPage,
});

function InterviewPage() {
  const { user } = useAuth();
  console.log(user);
  const { id } = Route.useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Interview Session</h1>
          <p className="text-muted-foreground">
            Interview ID: {id}
          </p>
        </div>
        <Button asChild variant="outline">
          <Link to="/candidate/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Interview Status
            </CardTitle>
            <CardDescription>
              Current status of your interview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-2">
                <Clock className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <p className="font-semibold text-green-600 dark:text-green-400">
                Ready to Start
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Interviewer
            </CardTitle>
            <CardDescription>
              Your interview will be conducted by AI
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2">
                <Brain className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="font-semibold">AI Interviewer</p>
              <p className="text-sm text-muted-foreground">
                Powered by Crisp AI
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="mr-2 h-5 w-5" />
              Duration
            </CardTitle>
            <CardDescription>
              Estimated interview duration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4">
              <div className="text-2xl font-bold mb-1">30-45 min</div>
              <p className="text-sm text-muted-foreground">
                Technical + Behavioral
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Interview Instructions</CardTitle>
          <CardDescription>
            Please read these instructions before starting your interview
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Before You Start:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Ensure you have a stable internet connection</li>
              <li>Find a quiet environment with good lighting</li>
              <li>Have your camera and microphone ready</li>
              <li>Close any unnecessary applications</li>
            </ul>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-semibold">During the Interview:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>Answer questions clearly and concisely</li>
              <li>Think out loud when solving problems</li>
              <li>Ask for clarification if needed</li>
              <li>Be honest about your experience level</li>
            </ul>
          </div>

          <div className="pt-4">
            <Button size="lg" className="w-full">
              <Play className="mr-2 h-5 w-5" />
              Start Interview
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
