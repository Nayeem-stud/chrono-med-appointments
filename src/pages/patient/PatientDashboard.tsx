
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { 
  Calendar,
  Clock, 
  UserRound, 
  Stethoscope, 
  ArrowRight,
  Search,
  History,
  SparkleIcon
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { appointmentRecommender } from "@/utils/appointmentRecommendations";
import { DoctorSession } from "@/types";

const PatientDashboard = () => {
  const { user } = useAuth();

  // Fetch upcoming appointments
  const { data: upcomingAppointments = [] } = useQuery({
    queryKey: ['patientUpcomingAppointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctor_id(*),
          session:session_id(*)
        `)
        .eq('patient_id', user?.id)
        .eq('status', 'scheduled')
        .order('session.date', { ascending: true })
        .order('session.start_time', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch recent appointments
  const { data: recentAppointments = [] } = useQuery({
    queryKey: ['patientRecentAppointments'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctor_id(*),
          session:session_id(*)
        `)
        .eq('patient_id', user?.id)
        .neq('status', 'scheduled')
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch patient profile
  const { data: patientProfile } = useQuery({
    queryKey: ['patientProfile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('patient_profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch available sessions for recommendations
  const { data: availableSessions = [] } = useQuery({
    queryKey: ['availableSessions'],
    queryFn: async () => {
      // Get tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      
      // Get 14 days from now
      const twoWeeksLater = new Date();
      twoWeeksLater.setDate(twoWeeksLater.getDate() + 14);
      const twoWeeksLaterStr = twoWeeksLater.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('doctor_sessions')
        .select(`
          *,
          doctor:doctor_id(*)
        `)
        .gte('date', tomorrowStr)
        .lte('date', twoWeeksLaterStr)
        .eq('is_available', true)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(50);
      
      if (error) throw error;
      return data as DoctorSession[];
    },
    enabled: !!user // Only run this query when user is available
  });

  // Use ML to get recommended sessions based on user history
  const pastSessionsForML = recentAppointments
    .map((apt: any) => apt.session)
    .filter(Boolean);
  
  const recommendedSessions = availableSessions.length > 0 
    ? appointmentRecommender.recommendSessions(availableSessions, pastSessionsForML)
    : [];

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Patient Dashboard</h1>
        <p className="text-gray-600">
          Welcome back, {patientProfile?.full_name || user?.email?.split('@')[0]}
        </p>
      </div>

      {/* ML-powered Recommendations */}
      {recommendedSessions.length > 0 && (
        <Card className="mb-8 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg flex items-center">
                  <SparkleIcon className="h-5 w-5 text-indigo-500 mr-2" />
                  Recommended Appointments
                </CardTitle>
                <CardDescription>AI-powered suggestions based on your preferences</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {recommendedSessions.map((session: DoctorSession) => (
                <div key={session.id} className="border rounded-lg p-3 bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-indigo-100 rounded-full">
                      <Stethoscope className="h-4 w-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">Dr. {session.doctor?.full_name}</p>
                      <p className="text-xs text-gray-500">{session.doctor?.specialization}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-xs text-gray-700 mb-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    {format(parseISO(session.date), 'EEE, MMM d')}
                  </div>
                  <div className="flex items-center text-xs text-gray-700 mb-3">
                    <Clock className="h-3 w-3 mr-1" />
                    {session.start_time} - {session.end_time}
                  </div>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link to={`/find-doctors?session=${session.id}`}>
                      Book Now
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card className="bg-primary/5 border-primary/20 hover:bg-primary/10 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-lg mb-1">Find a Doctor</h3>
                <p className="text-sm text-gray-600">
                  Search for specialists or general practitioners
                </p>
              </div>
              <Search className="h-8 w-8 text-primary" />
            </div>
            <Button asChild variant="default" className="w-full mt-4">
              <Link to="/find-doctors">Search Doctors</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-secondary/5 border-secondary/20 hover:bg-secondary/10 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-lg mb-1">My Appointments</h3>
                <p className="text-sm text-gray-600">
                  View and manage your scheduled appointments
                </p>
              </div>
              <Calendar className="h-8 w-8 text-secondary" />
            </div>
            <Button asChild variant="secondary" className="w-full mt-4">
              <Link to="/patient-appointments">View Appointments</Link>
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-gray-50 hover:bg-gray-100 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-lg mb-1">My Profile</h3>
                <p className="text-sm text-gray-600">
                  Update your personal and medical information
                </p>
              </div>
              <UserRound className="h-8 w-8 text-gray-500" />
            </div>
            <Button asChild variant="outline" className="w-full mt-4">
              <Link to="/patient-profile">Edit Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Upcoming Appointments</CardTitle>
                <CardDescription>Your scheduled consultations</CardDescription>
              </div>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500 mb-4">You don't have any upcoming appointments</p>
                <Button asChild variant="outline" size="sm">
                  <Link to="/find-doctors">Book an Appointment</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingAppointments.map((appointment: any) => (
                  <div key={appointment.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                    <div className="mr-3">
                      <Stethoscope className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Dr. {appointment.doctor?.full_name}</p>
                      <p className="text-xs text-gray-500">{appointment.doctor?.specialization}</p>
                      <div className="flex items-center text-sm text-gray-700 mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(parseISO(appointment.session?.date), 'EEE, MMM d')}
                        <Clock className="h-3 w-3 ml-2 mr-1" />
                        {appointment.session?.start_time}
                      </div>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/patient-appointments">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button asChild variant="outline" className="w-full">
              <Link to="/patient-appointments">View All Appointments</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Recent Appointments */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Past Appointments</CardTitle>
                <CardDescription>Your consultation history</CardDescription>
              </div>
              <History className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No past appointments found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentAppointments.map((appointment: any) => (
                  <div key={appointment.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                    <div className="mr-3">
                      <Stethoscope className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center">
                        <p className="font-medium">Dr. {appointment.doctor?.full_name}</p>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                          appointment.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {appointment.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">{appointment.doctor?.specialization}</p>
                      <div className="flex items-center text-sm text-gray-700 mt-1">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(parseISO(appointment.session?.date), 'EEE, MMM d')}
                      </div>
                    </div>
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/patient-appointments">
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button asChild variant="outline" className="w-full">
              <Link to="/patient-appointments">View Appointment History</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default PatientDashboard;
