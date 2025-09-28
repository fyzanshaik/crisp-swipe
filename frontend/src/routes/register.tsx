import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Brain, ChevronDown } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useForm } from "@tanstack/react-form";
import { api } from "@/lib/api";

export const Route = createFileRoute("/register")({
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  
  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "" as "candidate" | "recruiter" | "",
    },
    validators: {
      onChange: ({ value }) => {
        if (!value.name || value.name.length < 2) {
          return "Name must be at least 2 characters";
        }
        if (!value.email || !value.email.includes("@")) {
          return "Please enter a valid email";
        }
        if (!value.password || value.password.length < 8) {
          return "Password must be at least 8 characters";
        }
        if (!value.role) {
          return "Please select a role";
        }
        return undefined;
      },
    },
    onSubmit: async ({ value }) => {
      if (!value.role || (value.role !== 'candidate' && value.role !== 'recruiter')) {
        throw new Error('Please select a valid role');
      }
      
      const res = await api.auth.register.$post({ 
        json: {
          name: value.name,
          email: value.email,
          password: value.password,
          phone: value.phone || undefined,
          role: value.role as "candidate" | "recruiter"
        }
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error('error' in error ? error.error : 'Registration failed');
      }
      navigate({ to: "/login" });
    },
  });

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
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
              }}
            >
              <form.Field
                name="name"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Name</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="text"
                      placeholder="Enter your name"
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
              
              <form.Field
                name="phone"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Phone Number (Optional)</Label>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="tel"
                      placeholder="Enter your phone number"
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
                name="role"
                children={(field) => (
                  <div className="space-y-2">
                    <Label htmlFor={field.name}>Role</Label>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                          type="button"
                        >
                          {field.state.value ? 
                            (field.state.value === "candidate" ? "Candidate" : "Recruiter") : 
                            "Select a role"
                          }
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-full">
                        <DropdownMenuItem
                          onClick={() => field.handleChange("candidate")}
                        >
                          Candidate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => field.handleChange("recruiter")}
                        >
                          Recruiter
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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
                    disabled={!canSubmit || isSubmitting}
                  >
                    {isSubmitting ? "Registering..." : "Register"}
                  </Button>
                )}
              />
            </form>
            
            <div className="mt-4 text-center">
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