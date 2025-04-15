
import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Stethoscope, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SPECIALIZATIONS } from "@/types";
import { useAuth } from "@/hooks/use-auth";

const Signup = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { signUp, isLoading } = useAuth();
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeTerms: false,
    // Doctor specific fields
    specialization: "General Medicine",
    qualification: "",
    experience: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleCheckboxChange = (checked: boolean) => {
    setFormData({
      ...formData,
      agreeTerms: checked,
    });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      return alert("Passwords do not match");
    }
    
    if (!formData.agreeTerms) {
      return alert("You must agree to the terms of service");
    }
    
    await signUp(
      formData.email, 
      formData.password, 
      {
        firstName: formData.firstName,
        lastName: formData.lastName,
        specialization: formData.specialization,
        qualification: formData.qualification,
        experience: parseInt(formData.experience) || 0
      }, 
      isDoctor ? 'doctor' : 'customer'
    );
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
            {isDoctor ? "Join as a Doctor" : "Create Patient Account"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {isDoctor
              ? "Start managing your practice online"
              : "Book appointments with top doctors"}
          </p>
        </div>

        <Tabs defaultValue={isDoctor ? "doctor" : "customer"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger 
              value="customer" 
              onClick={() => navigate("/signup/customer")}
              className="flex items-center justify-center gap-2"
            >
              <User className="h-4 w-4" />
              Patient
            </TabsTrigger>
            <TabsTrigger 
              value="doctor" 
              onClick={() => navigate("/signup/doctor")}
              className="flex items-center justify-center gap-2"
            >
              <Stethoscope className="h-4 w-4" />
              Doctor
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value={isDoctor ? "doctor" : "customer"}>
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="mt-1"
                    />
                  </div>
                </div>
                
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
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
                
                {isDoctor && (
                  <div className="border-t pt-4 mt-4 space-y-4">
                    <div>
                      <Label htmlFor="specialization">Specialization</Label>
                      <Select 
                        value={formData.specialization}
                        onValueChange={(value) => handleSelectChange('specialization', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select specialization" />
                        </SelectTrigger>
                        <SelectContent>
                          {SPECIALIZATIONS.map((spec) => (
                            <SelectItem key={spec} value={spec}>{spec}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="qualification">Qualification</Label>
                      <Input
                        id="qualification"
                        name="qualification"
                        type="text"
                        required={isDoctor}
                        value={formData.qualification}
                        onChange={handleChange}
                        className="mt-1"
                        placeholder="MD, MBBS, etc."
                      />
                    </div>
                    <div>
                      <Label htmlFor="experience">Years of Experience</Label>
                      <Input
                        id="experience"
                        name="experience"
                        type="number"
                        required={isDoctor}
                        value={formData.experience}
                        onChange={handleChange}
                        className="mt-1"
                        min="0"
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="terms" 
                    checked={formData.agreeTerms}
                    onCheckedChange={handleCheckboxChange}
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm text-gray-500 cursor-pointer"
                  >
                    I agree to the{" "}
                    <Link to="/" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
              </div>

              <div>
                <Button
                  type="submit"
                  disabled={!formData.agreeTerms || isLoading}
                  className={`w-full py-6 ${
                    !formData.agreeTerms ? "opacity-60 cursor-not-allowed" : ""
                  } ${
                    isDoctor
                      ? "bg-secondary hover:bg-secondary/90"
                      : "bg-primary hover:bg-primary/90"
                  }`}
                >
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link
              to={isDoctor ? "/login/doctor" : "/login/customer"}
              className="font-medium text-primary hover:text-primary/80"
            >
              Sign in
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

export default Signup;
