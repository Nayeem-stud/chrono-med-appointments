
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { 
  Calendar,
  Clock,
  MapPin,
  XCircle,
  Filter,
  Stethoscope
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Appointment } from "@/types";
import { toast } from "sonner";

const PatientAppointments = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  // Fetch patient appointments
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['patientAppointments', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          doctor:doctor_id(*),
          session:session_id(*)
        `)
        .order('created_at', { ascending: false });
      
      if (statusFilter) {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data as Appointment[];
    }
  });

  // Cancel appointment mutation
  const cancelAppointment = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['patientAppointments'] });
      toast.success("Appointment cancelled successfully");
    },
    onError: (error) => {
      toast.error("Failed to cancel appointment: " + error.message);
    }
  });

  const handleCancelAppointment = (id: string) => {
    if (window.confirm("Are you sure you want to cancel this appointment?")) {
      cancelAppointment.mutate(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">Scheduled</span>;
      case 'completed':
        return <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">Completed</span>;
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 px-2 py-1 rounded-full text-xs">Cancelled</span>;
      default:
        return <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-xs">{status}</span>;
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
        <p className="text-gray-600">View and manage your scheduled appointments</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Tabs 
          defaultValue={statusFilter || "all"} 
          onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-3 sm:flex">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="scheduled">Upcoming</TabsTrigger>
            <TabsTrigger value="completed">Past</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={statusFilter || ""}
            onValueChange={(value) => setStatusFilter(value || null)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Appointments List */}
      {isLoading ? (
        <div className="text-center py-10">Loading appointments...</div>
      ) : !appointments || appointments.length === 0 ? (
        <div className="text-center py-10">
          <Stethoscope className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
          <p className="text-gray-500">
            {statusFilter
              ? `You don't have any ${statusFilter} appointments.`
              : "You haven't booked any appointments yet."}
          </p>
          <Button 
            className="mt-4"
            onClick={() => window.location.href = '/find-doctors'}
          >
            Book an Appointment
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 pb-3">
                <CardTitle className="flex justify-between items-center text-lg">
                  <span className="truncate">
                    Dr. {appointment.doctor?.full_name}
                  </span>
                  {getStatusBadge(appointment.status)}
                </CardTitle>
                <p className="text-sm text-gray-600">
                  {appointment.doctor?.specialization}
                </p>
              </CardHeader>
              
              <CardContent className="pt-4">
                <div className="space-y-2">
                  <div className="flex items-start">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm font-medium">
                        {appointment.session?.date ? 
                          format(parseISO(appointment.session.date), 'EEEE, MMMM d, yyyy') : 
                          "Date not available"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Clock className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm">
                        {appointment.session?.start_time} - {appointment.session?.end_time}
                      </p>
                      <p className="text-xs text-gray-500">
                        {appointment.session?.session_type}
                      </p>
                    </div>
                  </div>
                  
                  {appointment.session?.location && (
                    <div className="flex items-start">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400 mt-1" />
                      <p className="text-sm">{appointment.session.location}</p>
                    </div>
                  )}
                  
                  {appointment.symptoms && (
                    <div className="text-sm mt-2">
                      <p className="font-medium mb-1">Symptoms:</p>
                      <p className="text-gray-600">{appointment.symptoms}</p>
                    </div>
                  )}
                  
                  {appointment.notes && (
                    <div className="text-sm mt-2">
                      <p className="font-medium mb-1">Doctor's Notes:</p>
                      <p className="text-gray-600">{appointment.notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
              
              {appointment.status === 'scheduled' && (
                <CardFooter className="border-t pt-4">
                  <Button 
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleCancelAppointment(appointment.id)}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Appointment
                  </Button>
                </CardFooter>
              )}
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default PatientAppointments;
