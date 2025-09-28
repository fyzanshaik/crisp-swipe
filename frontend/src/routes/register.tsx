import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain } from "lucide-react";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/register")({
  component: Register,
});

function Register() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Brain className="h-8 w-8 text-primary" />
            <span className="text-2xl font-bold text-foreground">Crisp</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground">Get Started</h1>
          <p className="text-muted-foreground">Create your account today</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Register</CardTitle>
            <CardDescription>
              Create a new account to start using Crisp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">Registration form will be implemented next</p>
              <Button asChild variant="outline">
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}