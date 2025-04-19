
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { 
  Search, 
  Filter, 
  Calendar,
  Clock,
  MapPin,
  Users,
  CheckCircle2
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { SPECIALIZATIONS } from "@/types";
import { toast } from "sonner";
import { appointmentRecommender } from "@/utils/appointmentRecommendations";

const FindDoctors = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [specialization, setSpecialization] = useState<string>("");
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [symptoms, setSymptoms] = useState("");
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Check if we have a recommended session in the URL
  const recommendedSessionId = searchParams.get('session');
  
  // Fetch doctors
  const { data: doctors = [] } = useQuery({
    queryKey: ['doctors', specialization],
    queryFn: async () => {
      let query = supabase
        .from('doctor_profiles')
        .select('*');
      
      if (specialization) {
        query = query.eq('specialization', specialization);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch available sessions
  const { data: sessions = [], isLoading: isLoadingSessions } = useQuery({
    queryKey: ['availableSessions', specialization],
    queryFn: async () => {
      // Get today's date
      const today = new Date().toISOString().split('T')[0];
      
      // Get 30 days from now
      const thirtyDaysLater = new Date();
      thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
      const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0];

      let query = supabase
        .from('doctor_sessions')
        .select(`
          *,
          doctor:doctor_id(*)
        `)
        .gte('date', today)
        .lte('date', thirtyDaysLaterStr)
        .eq('is_available', true)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (specialization) {
        query = query.eq('doctor.specialization', specialization);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch patient's past appointments for ML recommendations
  const { data: patientHistory = [] } = useQuery({
    queryKey: ['patientAppointmentHistory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          session:session_id(*)
        `)
        .eq('patient_id', user?.id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data.map((apt: any) => apt.session).filter(Boolean);
    },
    enabled: !!user
  });

  // Load recommended session if specified in URL
  useEffect(() => {
    if (recommendedSessionId && sessions.length > 0) {
      const session = sessions.find((s: any) => s.id === recommendedSessionId);
      if (session) {
        setSelectedSession(session);
        setIsBookingDialogOpen(true);
      }
    }
  }, [recommendedSessionId, sessions]);

  // Filter sessions based on search term
  const filteredSessions = sessions.filter((session: any) => {
    const doctorName = session.doctor?.full_name.toLowerCase() || '';
    const doctorSpecialization = session.doctor?.specialization.toLowerCase() || '';
    const searchLower = searchTerm.toLowerCase();
    
    return doctorName.includes(searchLower) || 
           doctorSpecialization.includes(searchLower) ||
           session.session_type.toLowerCase().includes(searchLower);
  });
  
  // Use our ML model to sort sessions by relevance
  const sortedSessions = [...filteredSessions].sort((a, b) => {
    const scoreA = appointmentRecommender.scoreSession(a, patientHistory);
    const scoreB = appointmentRecommender.scoreSession(b, patientHistory);
    return scoreB - scoreA;
  });

  const handleBookAppointment = async () => {
    if (!selectedSession) return;
    
    setIsProcessing(true);
    
    try {
      // Insert appointment
      const { data, error } = await supabase
        .from('appointments')
        .insert({
          patient_id: user?.id,
          doctor_id: selectedSession.doctor_id,
          session_id: selectedSession.id,
          symptoms: symptoms || null
        })
        .select();
      
      if (error) throw error;
      
      toast.success("Appointment booked successfully!");
      setIsBookingDialogOpen(false);
      setSymptoms("");
      
      // Remove the session parameter from URL after booking
      if (recommendedSessionId) {
        const newParams = new URLSearchParams(searchParams);
        newParams.delete('session');
        setSearchParams(newParams);
      }
    } catch (error: any) {
      toast.error("Failed to book appointment: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Find Doctors</h1>
        <p className="text-gray-600">Search for available doctors and book appointments</p>
      </div>
      
      {/* Search and Filter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by doctor name or specialization"
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <Select value={specialization} onValueChange={setSpecialization}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by specialization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Specializations</SelectItem>
              {SPECIALIZATIONS.map((spec) => (
                <SelectItem key={spec} value={spec}>{spec}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Session Booking Dialog */}
      <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Complete the details below to book your appointment
            </DialogDescription>
          </DialogHeader>
          
          {selectedSession && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-1">Doctor</p>
                  <p className="text-sm">{selectedSession.doctor?.full_name}</p>
                  <p className="text-xs text-gray-500">{selectedSession.doctor?.specialization}</p>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Session Type</p>
                  <p className="text-sm">{selectedSession.session_type}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-start">
                  <Calendar className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1">Date</p>
                    <p className="text-sm">{format(parseISO(selectedSession.date), 'EEEE, MMMM d, yyyy')}</p>
                  </div>
                </div>
                <div className="flex items-start">
                  <Clock className="h-4 w-4 mr-2 text-gray-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-1">Time</p>
                    <p className="text-sm">{selectedSession.start_time} - {selectedSession.end_time}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-1">Symptoms (Optional)</p>
                <Textarea
                  placeholder="Describe your symptoms or reason for visit..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsBookingDialogOpen(false)}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleBookAppointment}
              disabled={isProcessing}
            >
              {isProcessing ? "Booking..." : "Confirm Booking"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Available Sessions */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-4">Available Appointments</h2>
        
        {isLoadingSessions ? (
          <div className="text-center py-10">Loading available sessions...</div>
        ) : sortedSessions.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-gray-500">No available sessions found. Try changing your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sortedSessions.map((session: any) => (
              <Card key={session.id} className="overflow-hidden hover:shadow-md transition-shadow">
                <CardHeader className="bg-gray-50 pb-3">
                  <CardTitle className="text-lg">
                    Dr. {session.doctor?.full_name}
                    <p className="text-sm text-gray-500 font-normal">{session.doctor?.specialization}</p>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      <p className="text-sm">
                        {format(parseISO(session.date), 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-gray-400" />
                      <p className="text-sm">
                        {session.start_time} - {session.end_time}
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      <Users className="h-4 w-4 mr-2 text-gray-400" />
                      <p className="text-sm">
                        {session.patients_booked} / {session.max_patients} booked
                      </p>
                    </div>
                    
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      <p className="text-sm">
                        {session.session_type}
                      </p>
                    </div>
                    
                    <Button 
                      className="w-full mt-2"
                      onClick={() => {
                        setSelectedSession(session);
                        setIsBookingDialogOpen(true);
                      }}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Book Appointment
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Doctor Listing */}
      <div>
        <h2 className="text-xl font-bold mb-4">Our Doctors</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {doctors
            .filter(doctor => {
              if (!searchTerm) return true;
              const doctorName = doctor.full_name.toLowerCase();
              const doctorSpecialization = doctor.specialization.toLowerCase();
              const searchLower = searchTerm.toLowerCase();
              return doctorName.includes(searchLower) || doctorSpecialization.includes(searchLower);
            })
            .map(doctor => (
              <Card key={doctor.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="h-16 w-16 rounded-full bg-gray-200 flex items-center justify-center">
                      {doctor.profile_image ? (
                        <img 
                          src={doctor.profile_image} 
                          alt={doctor.full_name}
                          className="h-16 w-16 rounded-full object-cover" 
                        />
                      ) : (
                        <span className="text-2xl text-gray-400">
                          {doctor.full_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">Dr. {doctor.full_name}</h3>
                      <p className="text-sm text-gray-500">{doctor.specialization}</p>
                      <p className="text-sm text-gray-500">{doctor.experience} years experience</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {doctor.about || `Dr. ${doctor.full_name} is a ${doctor.specialization} specialist with ${doctor.experience} years of experience.`}
                  </p>
                  
                  <div className="space-y-2">
                    {sessions
                      .filter((session: any) => session.doctor_id === doctor.id)
                      .slice(0, 3)
                      .map((session: any) => (
                        <div key={session.id} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                            <span className="text-xs">
                              {format(parseISO(session.date), 'MMM d')} | {session.start_time}
                            </span>
                          </div>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => {
                              setSelectedSession(session);
                              setIsBookingDialogOpen(true);
                            }}
                          >
                            Book
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default FindDoctors;
