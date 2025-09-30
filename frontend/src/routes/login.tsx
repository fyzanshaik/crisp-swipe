import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Brain, Loader2 } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { useAuth } from "@/lib/use-auth";
import { z } from "zod";

const loginSearchSchema = z.object({
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  component: Login,
});

function Login() {
  const navigate = useNavigate();
  const auth = useAuth();
  const search = Route.useSearch();
  
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onChange: ({ value }) => {
        if (!value.email || !value.email.includes("@")) {
          return "Please enter a valid email";
        }
        if (!value.password || value.password.length < 1) {
          return "Password is required";
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      await auth.login(value.email, value.password);
      
      if (search.redirect) {
        navigate({ to: search.redirect });
      } else {
        window.location.href = '/dashboard';
      }
    },
  });

  const handleAutoLogin = async (email: string, password: string) => {
    form.setFieldValue('email', email);
    form.setFieldValue('password', password);
    
         try {
           await auth.login(email, password);
           
           if (search.redirect) {
             navigate({ to: search.redirect });
           } else {
             window.location.href = '/dashboard';
           }
         } catch (error) {
           console.error('Auto-login failed:', error);
         }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center justify-center space-x-2 mb-6 hover:opacity-80 transition-opacity">
            <Brain className="h-10 w-10 text-primary" />
            <span className="text-3xl font-bold text-foreground">Crisp</span>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-2">Welcome Back</h1>
          <p className="text-lg text-muted-foreground">Sign in to continue your journey</p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription className="text-base">
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
            >
              <form.Field
                name="email"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Email</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="email"
                      placeholder="Enter your email"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {!field.state.meta.isValid && (
                      <em className="text-red-500 text-sm">
                        {field.state.meta.errors.join(", ")}
                      </em>
                    )}
                  </div>
                )}
              />
              
              <form.Field
                name="password"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Password</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="password"
                      placeholder="Enter your password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                    {!field.state.meta.isValid && (
                      <em className="text-red-500 text-sm">
                        {field.state.meta.errors.join(", ")}
                      </em>
                    )}
                  </div>
                )}
              />
              
              <form.Subscribe
                selector={(state) => [state.canSubmit, state.isSubmitting]}
                children={([canSubmit, isSubmitting]) => (
                  <Button
                    type="submit"
                    className="w-full"
                    disabled={!canSubmit || isSubmitting || auth.isLoading}
                  >
                    {isSubmitting || auth.isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </Button>
                )}
              />
            </form>
            
            <div className="mt-6 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-sm uppercase">
                  <span className="bg-background px-3 text-muted-foreground font-medium">
                    Demo Accounts
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  onClick={() => handleAutoLogin("swipeuser@gmail.com", "11111111")}
                  disabled={auth.isLoading}
                  className="h-auto py-3 flex flex-col items-center gap-1"
                >
                  {auth.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span className="font-semibold">Candidate</span>
                      <span className="text-xs text-muted-foreground">Quick Login</span>
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleAutoLogin("swipeadmin@gmail.com", "11111111")}
                  disabled={auth.isLoading}
                  className="h-auto py-3 flex flex-col items-center gap-1"
                >
                  {auth.isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span className="font-semibold">Recruiter</span>
                      <span className="text-xs text-muted-foreground">Quick Login</span>
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="mt-6 text-center space-y-3">
              <Button asChild variant="ghost" className="w-full">
                <Link to="/">Back to Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}