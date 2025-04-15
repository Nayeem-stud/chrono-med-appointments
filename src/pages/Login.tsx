
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Stethoscope, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";

const Login = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { signIn, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await signIn(formData.email, formData.password);
  };

  const isDoctor = type === "doctor";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-md">
        <div className="text-center">
          <Link to="/" className="flex items-center justify-center gap-2">
            <Stethoscope className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold text-gray-900">ChronoMed</span>
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {isDoctor ? "Doctor Login" : "Patient Login"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isDoctor
              ? "Access your doctor dashboard"
              : "Access your patient dashboard"}
          </p>
        </div>

        <Tabs defaultValue={isDoctor ? "doctor" : "customer"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger 
              value="customer" 
              onClick={() => navigate("/login/customer")}
              className="flex items-center justify-center gap-2"
            >
              <User className="h-4 w-4" />
              Patient
            </TabsTrigger>
            <TabsTrigger 
              value="doctor" 
              onClick={() => navigate("/login/doctor")}
              className="flex items-center justify-center gap-2"
            >
              <Stethoscope className="h-4 w-4" />
              Doctor
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={isDoctor ? "doctor" : "customer"}>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <div className="text-sm">
                      <Link to="/" className="text-primary hover:text-primary/80">
                        Forgot your password?
                      </Link>
                    </div>
                  </div>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className={`w-full py-6 ${
                    isDoctor
                      ? "bg-secondary hover:bg-secondary/90"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {isLoading ? "Signing in..." : "Sign in"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Don't have an account?{" "}
            <Link
              to={isDoctor ? "/signup/doctor" : "/signup/customer"}
              className="font-medium text-primary hover:text-primary/80"
            >
              Sign up
            </Link>
          </p>
          <Link
            to="/"
            className="mt-4 inline-block text-sm text-gray-600 hover:text-gray-900"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;
