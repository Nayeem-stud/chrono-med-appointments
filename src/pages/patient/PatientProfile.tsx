
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, User } from "lucide-react";
import { PatientProfile as PatientProfileType } from "@/types";
import { toast } from "sonner";

// Form schema
const profileSchema = z.object({
  fullName: z.string().min(2, { message: "Name must be at least 2 characters" }),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female", "other", ""]),
  contactNumber: z.string().optional(),
  medicalHistory: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const PatientProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(true);

  // Form configuration
  const form = useForm<ProfileFormValues>({
    defaultValues: {
      fullName: "",
      dateOfBirth: "",
      gender: "",
      contactNumber: "",
      medicalHistory: "",
    },
    resolver: zodResolver(profileSchema),
  });

  // Fetch patient profile
  const { data: profile, isError } = useQuery({
    queryKey: ['patientProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      
      console.log('Fetching patient profile for user:', user.id);
      const { data, error } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('No profile found for user:', user.id);
          return null;
        }
        console.error('Error fetching profile:', error);
        throw error;
      }
      
      console.log('Patient profile data:', data);
      return data as PatientProfileType;
    },
    enabled: !!user?.id,
  });

  // Update form values when profile data is loaded
  useEffect(() => {
    if (profile) {
      form.reset({
        fullName: profile.full_name || "",
        dateOfBirth: profile.date_of_birth || "",
        gender: (profile.gender as any) || "",
        contactNumber: profile.contact_number || "",
        medicalHistory: profile.medical_history || "",
      });
      setIsLoading(false);
    } else if (!isLoading && !isError) {
      setIsLoading(false);
    }
  }, [profile, form, isError, isLoading]);

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('patient_profiles')
        .update({
          full_name: values.fullName,
          date_of_birth: values.dateOfBirth || null,
          gender: values.gender || null,
          contact_number: values.contactNumber || null,
          medical_history: values.medicalHistory || null,
        })
        .eq('id', user.id)
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientProfile', user?.id] });
      toast.success("Profile updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update profile: " + error.message);
    }
  });

  const onSubmit = (values: ProfileFormValues) => {
    updateProfile.mutate(values);
  };

  // Show loading state if waiting for data
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading profile data...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600">Manage your profile information</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>
            <User className="h-5 w-5 mr-2 inline-block" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date of Birth</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gender</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a gender" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contactNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Number</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., +15551234567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="medicalHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medical History</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter any relevant medical history..."
                        className="resize-none"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <CardFooter className="pt-4 px-0">
                <Button 
                  type="submit" 
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? "Updating..." : "Update Profile"}
                </Button>
              </CardFooter>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default PatientProfile;
