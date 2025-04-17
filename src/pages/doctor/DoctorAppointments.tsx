
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { 
  Calendar,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  Filter,
  Stethoscope
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Appointment } from "@/types";
import { toast } from "sonner";

const DoctorAppointments = () => {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");

  // Fetch doctor appointments
  const { data: appointments, isLoading } = useQuery({
    queryKey: ['doctorAppointments', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patient_id(id, full_name),
          session:session_id(*, doctor:doctor_id(*))
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

  // Update appointment status mutation
  const updateAppointment = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const updateData: { status: string; notes?: string } = { status };
      if (notes !== undefined) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctorAppointments'] });
      toast.success("Appointment updated successfully");
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to update appointment: " + error.message);
    }
  });

  const handleUpdateStatus = (id: string, status: string) => {
    updateAppointment.mutate({ id, status });
  };

  const handleOpenNotes = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setNotes(appointment.notes || "");
    setIsDialogOpen(true);
  };

  const handleSaveNotes = () => {
    if (selectedAppointment) {
      updateAppointment.mutate({ 
        id: selectedAppointment.id, 
        status: selectedAppointment.status,
        notes 
      });
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
        <p className="text-gray-600">Manage your patient appointments</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <Tabs 
          defaultValue={statusFilter || "all"} 
          onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
          className="w-full sm:w-auto"
        >
          <TabsList className="grid grid-cols-3 sm:flex">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select
            value={statusFilter || "all"}
            onValueChange={(value) => setStatusFilter(value === "all" ? null : value)}
          >
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notes Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Appointment Notes</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {selectedAppointment && (
              <div className="text-sm text-gray-600">
                <p><span className="font-medium">Patient:</span> {selectedAppointment.patient?.full_name}</p>
                <p><span className="font-medium">Date:</span> {format(parseISO(selectedAppointment.session?.date || ""), 'MMMM d, yyyy')}</p>
                <p><span className="font-medium">Time:</span> {selectedAppointment.session?.start_time} - {selectedAppointment.session?.end_time}</p>
                {selectedAppointment.symptoms && (
                  <p><span className="font-medium">Symptoms:</span> {selectedAppointment.symptoms}</p>
                )}
              </div>
            )}
            
            <Textarea
              placeholder="Add your notes about this appointment..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
            />
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveNotes}>
                Save Notes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
              : "You don't have any appointments yet."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {appointments.map((appointment) => (
            <Card key={appointment.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 pb-3">
                <CardTitle className="flex justify-between items-center text-lg">
                  <span className="truncate">
                    {appointment.patient?.full_name || "Patient"}
                  </span>
                  {getStatusBadge(appointment.status)}
                </CardTitle>
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
                  
                  {appointment.symptoms && (
                    <div className="text-sm">
                      <p className="font-medium mb-1">Symptoms:</p>
                      <p className="text-gray-600">{appointment.symptoms}</p>
                    </div>
                  )}
                  
                  {appointment.notes && (
                    <div className="text-sm">
                      <p className="font-medium mb-1">Notes:</p>
                      <p className="text-gray-600 truncate">{appointment.notes}</p>
                      <Button 
                        variant="link" 
                        size="sm" 
                        className="p-0 h-auto text-xs"
                        onClick={() => handleOpenNotes(appointment)}
                      >
                        View full notes
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="border-t pt-4 flex justify-between">
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => handleOpenNotes(appointment)}
                >
                  {appointment.notes ? "Edit Notes" : "Add Notes"}
                </Button>
                
                <div className="flex space-x-2">
                  {appointment.status === 'scheduled' && (
                    <>
                      <Button 
                        size="sm"
                        variant="default"
                        onClick={() => handleUpdateStatus(appointment.id, 'completed')}
                      >
                        <CheckCircle2 className="h-4 w-4 mr-1" />
                        Complete
                      </Button>
                      <Button 
                        size="sm"
                        variant="destructive"
                        onClick={() => handleUpdateStatus(appointment.id, 'cancelled')}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DoctorAppointments;
