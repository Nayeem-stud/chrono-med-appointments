
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { 
  Calendar,
  Users,
  ListChecks,
  TrendingUp,
  Plus,
  Clock
} from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const DoctorDashboard = () => {
  const { user } = useAuth();
  const [timeFilter, setTimeFilter] = useState<'day' | 'week' | 'month'>('day');

  // Fetch today's appointments for the doctor
  const { data: todayAppointments = [] } = useQuery({
    queryKey: ['doctorTodayAppointments'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patient_id(id, full_name),
          session:session_id(*)
        `)
        .eq('doctor_id', user?.id)
        .eq('session.date', today)
        .order('session.start_time', { ascending: true });
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch upcoming sessions
  const { data: upcomingSessions = [] } = useQuery({
    queryKey: ['doctorUpcomingSessions'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('doctor_sessions')
        .select('*')
        .eq('doctor_id', user?.id)
        .gte('date', today)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(5);
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch appointment stats
  const { data: stats } = useQuery({
    queryKey: ['doctorStats', timeFilter],
    queryFn: async () => {
      let startDate;
      const now = new Date();
      
      if (timeFilter === 'day') {
        startDate = new Date().toISOString().split('T')[0];
      } else if (timeFilter === 'week') {
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        startDate = weekStart.toISOString().split('T')[0];
      } else {
        const monthStart = new Date(now);
        monthStart.setMonth(now.getMonth() - 1);
        startDate = monthStart.toISOString().split('T')[0];
      }
      
      const { data, error } = await supabase
        .from('appointments')
        .select('*, session:session_id(*)')
        .eq('doctor_id', user?.id)
        .gte('session.date', startDate);
      
      if (error) throw error;
      
      // Calculate stats
      const total = data.length;
      const completed = data.filter(app => app.status === 'completed').length;
      const cancelled = data.filter(app => app.status === 'cancelled').length;
      const scheduled = data.filter(app => app.status === 'scheduled').length;
      
      return { total, completed, cancelled, scheduled };
    }
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
        <p className="text-gray-600">Welcome back, Dr. {user?.email?.split('@')[0]}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Total Appointments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total || 0}</div>
          </CardContent>
          <CardFooter className="pt-0">
            <Tabs value={timeFilter} onValueChange={(v) => setTimeFilter(v as any)}>
              <TabsList className="grid grid-cols-3">
                <TabsTrigger value="day">Day</TabsTrigger>
                <TabsTrigger value="week">Week</TabsTrigger>
                <TabsTrigger value="month">Month</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats?.completed || 0}</div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-gray-500">
              {(stats && stats.total) 
                ? `${Math.round((stats.completed / stats.total) * 100)}% of total`
                : 'No appointments yet'}
            </p>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.scheduled || 0}</div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-gray-500">Upcoming appointments</p>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Cancelled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.cancelled || 0}</div>
          </CardContent>
          <CardFooter className="pt-0">
            <p className="text-xs text-gray-500">
              {(stats && stats.total) 
                ? `${Math.round((stats.cancelled / stats.total) * 100)}% of total`
                : 'No cancellations yet'}
            </p>
          </CardFooter>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Appointments */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Today's Appointments</CardTitle>
                <CardDescription>
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </CardDescription>
              </div>
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No appointments scheduled for today</p>
              </div>
            ) : (
              <div className="space-y-4">
                {todayAppointments.map((appointment: any) => (
                  <div key={appointment.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium">{appointment.patient?.full_name}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {appointment.session?.start_time} - {appointment.session?.end_time}
                      </div>
                    </div>
                    <div className={`px-2 py-1 text-xs rounded-full ${
                      appointment.status === 'scheduled' 
                        ? 'bg-blue-100 text-blue-800' 
                        : appointment.status === 'completed'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {appointment.status}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button asChild variant="outline" className="w-full">
              <Link to="/doctor-appointments">View All Appointments</Link>
            </Button>
          </CardFooter>
        </Card>

        {/* Upcoming Sessions */}
        <Card>
          <CardHeader className="pb-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Upcoming Sessions</CardTitle>
                <CardDescription>Your next available slots</CardDescription>
              </div>
              <ListChecks className="h-5 w-5 text-gray-400" />
            </div>
          </CardHeader>
          <CardContent>
            {upcomingSessions.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-gray-500">No upcoming sessions found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingSessions.map((session: any) => (
                  <div key={session.id} className="flex items-center p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex-1">
                      <p className="font-medium">
                        {format(parseISO(session.date), 'EEE, MMM d')}
                      </p>
                      <div className="flex items-center text-sm text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        {session.start_time} - {session.end_time}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center text-xs text-gray-500">
                        <Users className="h-3 w-3 mr-1" />
                        {session.patients_booked}/{session.max_patients}
                      </div>
                      <div className={`px-2 py-1 text-xs rounded-full ${
                        session.is_available 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {session.is_available ? 'Available' : 'Fully Booked'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
          <CardFooter className="border-t pt-4 flex justify-between">
            <Button asChild variant="outline">
              <Link to="/doctor-sessions">View All Sessions</Link>
            </Button>
            <Button asChild>
              <Link to="/doctor-sessions">
                <Plus className="h-4 w-4 mr-2" />
                Add Session
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default DoctorDashboard;
