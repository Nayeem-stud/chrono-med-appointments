
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Stethoscope, User, Mail, Award, UserRound, CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SPECIALIZATIONS } from "@/types";

// Form schema
const profileSchema = z.object({
  full_name: z.string().min(2, { message: "Name must be at least 2 characters" }),
  specialization: z.string().min(1, { message: "Specialization is required" }),
  qualification: z.string().min(1, { message: "Qualification is required" }),
  experience: z.number().min(0, { message: "Experience must be a positive number" }),
  about: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const DoctorProfile = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Create form instance
  const form = useForm<ProfileFormValues>({
    defaultValues: {
      full_name: '',
      specialization: '',
      qualification: '',
      experience: 0,
      about: '',
    },
    resolver: zodResolver(profileSchema)
  });

  // Fetch doctor profile
  const { data: profile } = useQuery({
    queryKey: ['doctorProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      
      const { data, error } = await supabase
        .from('doctor_profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Update form values when profile data is loaded
  useEffect(() => {
    if (profile) {
      form.reset({
        full_name: profile.full_name || '',
        specialization: profile.specialization || '',
        qualification: profile.qualification || '',
        experience: profile.experience || 0,
        about: profile.about || '',
      });
      setIsLoading(false);
    }
  }, [profile, form]);

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async (values: ProfileFormValues) => {
      if (!user?.id) {
        throw new Error("User not authenticated");
      }
      
      const { data, error } = await supabase
        .from('doctor_profiles')
        .update({
          full_name: values.full_name,
          specialization: values.specialization,
          qualification: values.qualification,
          experience: values.experience,
          about: values.about,
        })
        .eq('id', user.id)
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctorProfile', user?.id] });
      toast.success("Profile updated successfully");
      setIsEditing(false);
    },
    onError: (error) => {
      toast.error("Failed to update profile: " + error.message);
    }
  });

  const onSubmit = (values: ProfileFormValues) => {
    updateProfile.mutate(values);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!isEditing) {
    return (
      <DashboardLayout>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-gray-600">View and manage your professional information</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-primary/10 w-24 h-24 rounded-full flex items-center justify-center">
                    <UserRound className="h-12 w-12 text-primary" />
                  </div>
                </div>
                <CardTitle>{profile?.full_name}</CardTitle>
                <CardDescription>{profile?.specialization}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center space-y-2 mb-4">
                  <p className="text-sm text-gray-500">{user?.email}</p>
                  <div className="flex items-center text-sm text-gray-500">
                    <CalendarClock className="h-4 w-4 mr-1" />
                    <span>{profile?.experience} years of experience</span>
                  </div>
                </div>
                <Button onClick={() => setIsEditing(true)} className="w-full">
                  Edit Profile
                </Button>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Professional Information</CardTitle>
                <CardDescription>Your qualifications and expertise</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Specialization</p>
                    <p className="text-gray-900">{profile?.specialization}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Qualification</p>
                    <p className="text-gray-900">{profile?.qualification}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-gray-500">Experience</p>
                    <p className="text-gray-900">{profile?.experience} years</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-gray-500 mb-2">About</p>
                  <p className="text-gray-900 whitespace-pre-line">
                    {profile?.about || 'No bio provided.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Profile</h1>
        <p className="text-gray-600">Update your professional information</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>Update your professional details</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="full_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialization</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select specialization" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {SPECIALIZATIONS.map((specialization) => (
                            <SelectItem key={specialization} value={specialization}>
                              {specialization}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="qualification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualification</FormLabel>
                      <FormControl>
                        <Input placeholder="E.g., MD, MBBS, MS" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience (years)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="0" 
                          placeholder="Years of experience"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} 
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="about"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>About</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Write a brief description about yourself, your approach, and expertise"
                        className="min-h-[150px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      This information will be visible to patients.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={updateProfile.isPending}
                >
                  {updateProfile.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
};

export default DoctorProfile;
