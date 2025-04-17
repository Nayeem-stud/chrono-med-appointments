
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { 
  Search, 
  Calendar, 
  Clock, 
  MapPin, 
  UserCheck,
  Filter,
  Stethoscope
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { SPECIALIZATIONS, DoctorSession, DoctorProfile } from "@/types";
import { toast } from "sonner";

interface SessionWithDoctor extends DoctorSession {
  doctor: DoctorProfile;
}

const FindDoctors = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [specialization, setSpecialization] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionWithDoctor | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [symptoms, setSymptoms] = useState("");

  // Fetch available sessions with doctor details
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['availableSessions', specialization, searchTerm],
    queryFn: async () => {
      console.log('Fetching available sessions');
      let query = supabase
        .from('doctor_sessions')
        .select(`
          *,
          doctor:doctor_id(*)
        `)
        .eq('is_available', true)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (specialization) {
        query = query.eq('doctor.specialization', specialization);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching sessions:', error);
        throw error;
      }
      
      console.log('Sessions data:', data);
      
      // Filter by doctor name if search term is provided
      let filteredData = data as SessionWithDoctor[];
      if (searchTerm) {
        const lowerSearchTerm = searchTerm.toLowerCase();
        filteredData = filteredData.filter(session => 
          session.doctor?.full_name.toLowerCase().includes(lowerSearchTerm)
        );
      }
      
      return filteredData;
    }
  });

  // Book appointment mutation
  const bookAppointment = useMutation({
    mutationFn: async ({ sessionId, doctorId, symptoms }: { sessionId: string; doctorId: string; symptoms: string }) => {
      if (!user) throw new Error("You must be logged in to book an appointment");
      
      const { data, error } = await supabase
        .from('appointments')
        .insert([{
          session_id: sessionId,
          doctor_id: doctorId,
          patient_id: user.id,
          symptoms: symptoms || null,
          status: 'scheduled'
        }])
        .select();
      
      if (error) throw error;
      
      // Update the patients_booked count and is_available flag
      await supabase
        .from('doctor_sessions')
        .update({ 
          patients_booked: selectedSession?.patients_booked ? selectedSession.patients_booked + 1 : 1,
          is_available: selectedSession?.max_patients ? (selectedSession.patients_booked + 1 < selectedSession.max_patients) : false
        })
        .eq('id', sessionId);
      
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availableSessions'] });
      queryClient.invalidateQueries({ queryKey: ['patientAppointments'] });
      toast.success("Appointment booked successfully");
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast.error("Failed to book appointment: " + error.message);
    }
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleOpenBooking = (session: SessionWithDoctor) => {
    setSelectedSession(session);
    setSymptoms("");
    setIsDialogOpen(true);
  };

  const handleBookAppointment = () => {
    if (selectedSession) {
      bookAppointment.mutate({
        sessionId: selectedSession.id,
        doctorId: selectedSession.doctor_id,
        symptoms
      });
    }
  };

  // Group sessions by doctor
  const groupSessionsByDoctor = (sessions: SessionWithDoctor[] = []) => {
    const grouped: Record<string, { doctor: DoctorProfile; sessions: DoctorSession[] }> = {};
    
    sessions.forEach(session => {
      if (!grouped[session.doctor_id]) {
        grouped[session.doctor_id] = {
          doctor: session.doctor,
          sessions: []
        };
      }
      grouped[session.doctor_id].sessions.push(session);
    });
    
    return Object.values(grouped);
  };

  const groupedSessions = groupSessionsByDoctor(sessions);

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find Doctors</h1>
        <p className="text-gray-600">Browse available doctors and book appointments</p>
      </div>
      
      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search doctor name..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="pl-10"
          />
        </div>
        
        <div className="md:w-64 flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500 hidden md:block" />
          <Select
            value={specialization || ""}
            onValueChange={(value) => setSpecialization(value === "all" ? null : value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Specializations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specializations</SelectItem>
              {SPECIALIZATIONS.map(spec => (
                <SelectItem key={spec} value={spec}>{spec}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {selectedSession && (
              <div className="space-y-4">
                <div className="border-b pb-4">
                  <h3 className="text-lg font-medium">{selectedSession.doctor.full_name}</h3>
                  <p className="text-sm text-gray-600">{selectedSession.doctor.specialization}</p>
                </div>
                
                <div className="flex items-center text-sm">
                  <Calendar className="h-4 w-4 mr-2 text-primary" />
                  <span>{format(parseISO(selectedSession.date), 'EEEE, MMMM d, yyyy')}</span>
                </div>
                
                <div className="flex items-center text-sm">
                  <Clock className="h-4 w-4 mr-2 text-primary" />
                  <span>
                    {selectedSession.start_time} - {selectedSession.end_time}
                    <span className="ml-2 text-gray-500">({selectedSession.session_type})</span>
                  </span>
                </div>
                
                {selectedSession.location && (
                  <div className="flex items-start text-sm">
                    <MapPin className="h-4 w-4 mr-2 text-primary mt-1" />
                    <span>{selectedSession.location}</span>
                  </div>
                )}
                
                <div className="pt-2">
                  <label htmlFor="symptoms" className="block text-sm font-medium mb-2">
                    Describe your symptoms or reason for visit (optional)
                  </label>
                  <Textarea
                    id="symptoms"
                    placeholder="Please describe any symptoms you're experiencing..."
                    value={symptoms}
                    onChange={(e) => setSymptoms(e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            )}
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleBookAppointment}>
                Confirm Booking
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Doctors and Sessions List */}
      {isLoading ? (
        <div className="text-center py-10">Loading available sessions...</div>
      ) : !groupedSessions || groupedSessions.length === 0 ? (
        <div className="text-center py-10">
          <Stethoscope className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No available sessions found</h3>
          <p className="text-gray-500">
            {searchTerm || specialization
              ? "Try changing your search criteria."
              : "There are no available doctor sessions at the moment."}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groupedSessions.map(({ doctor, sessions }) => (
            <Card key={doctor.id} className="overflow-hidden">
              <CardHeader className="border-b">
                <div className="flex justify-between">
                  <div>
                    <CardTitle className="text-xl">{doctor.full_name}</CardTitle>
                    <p className="text-sm text-primary">{doctor.specialization}</p>
                    <div className="text-sm text-gray-500 mt-1">
                      {doctor.qualification} • {doctor.experience} years experience
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-4">
                {doctor.about && (
                  <p className="text-sm text-gray-600 mb-4">{doctor.about}</p>
                )}
                
                <h3 className="font-medium mb-3">Available Sessions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {sessions.map((session) => (
                    <div key={session.id} className="border rounded-md p-3 hover:bg-gray-50">
                      <div className="flex items-center mb-1">
                        <Calendar className="h-4 w-4 mr-2 text-primary" />
                        <span className="text-sm font-medium">
                          {format(parseISO(session.date), 'EEE, MMM d')}
                        </span>
                      </div>
                      
                      <div className="flex items-center mb-1">
                        <Clock className="h-4 w-4 mr-2 text-primary" />
                        <span className="text-sm">
                          {session.start_time} - {session.end_time}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                          {session.session_type}
                        </span>
                        
                        <Button 
                          size="sm"
                          onClick={() => handleOpenBooking({...session, doctor})}
                        >
                          <UserCheck className="h-4 w-4 mr-1" />
                          Book
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default FindDoctors;
