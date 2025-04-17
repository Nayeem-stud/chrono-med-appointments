
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Edit, 
  Trash2 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { DoctorSession, SESSION_TYPES } from "@/types";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

const DoctorSessions = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentSession, setCurrentSession] = useState<DoctorSession | null>(null);
  const [formData, setFormData] = useState({
    date: "",
    start_time: "",
    end_time: "",
    session_type: "General Checkup",
    max_patients: 1,
    location: ""
  });

  // Fetch doctor sessions
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['doctorSessions'],
    queryFn: async () => {
      if (!user?.id) return [];
      
      console.log('Fetching doctor sessions for user:', user.id);
      const { data, error } = await supabase
        .from('doctor_sessions')
        .select('*')
        .eq('doctor_id', user.id)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });
      
      if (error) {
        console.error('Error fetching sessions:', error);
        throw error;
      }
      
      console.log('Doctor sessions data:', data);
      return data as DoctorSession[];
    },
    enabled: !!user?.id
  });

  // Create session mutation
  const createSession = useMutation({
    mutationFn: async (newSession: {
      date: string;
      start_time: string;
      end_time: string;
      session_type: string;
      max_patients: number;
      location: string | null;
    }) => {
      if (!user?.id) throw new Error("User not authenticated");
      
      console.log('Creating session with data:', { doctor_id: user.id, ...newSession });
      
      const { data, error } = await supabase
        .from('doctor_sessions')
        .insert({
          doctor_id: user.id,
          ...newSession,
          is_available: true,
          patients_booked: 0
        })
        .select();
      
      if (error) {
        console.error('Error creating session:', error);
        throw error;
      }
      
      console.log('Session created successfully:', data);
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctorSessions'] });
      toast.success("Session created successfully");
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast.error("Failed to create session: " + error.message);
    }
  });

  // Update session mutation
  const updateSession = useMutation({
    mutationFn: async (updatedSession: Partial<DoctorSession> & { id: string }) => {
      const { id, ...sessionData } = updatedSession;
      const { data, error } = await supabase
        .from('doctor_sessions')
        .update(sessionData)
        .eq('id', id)
        .select();
      
      if (error) throw error;
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctorSessions'] });
      toast.success("Session updated successfully");
      handleCloseDialog();
    },
    onError: (error) => {
      toast.error("Failed to update session: " + error.message);
    }
  });

  // Delete session mutation
  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('doctor_sessions')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctorSessions'] });
      toast.success("Session deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete session: " + error.message);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form data
    if (!formData.date || !formData.start_time || !formData.end_time) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    console.log('Submitting form data:', formData);
    
    // Format the data
    const sessionData = {
      date: formData.date,
      start_time: formData.start_time,
      end_time: formData.end_time,
      session_type: formData.session_type,
      max_patients: parseInt(formData.max_patients.toString()),
      location: formData.location || null
    };
    
    if (isEditMode && currentSession) {
      updateSession.mutate({
        id: currentSession.id,
        ...sessionData
      });
    } else {
      createSession.mutate(sessionData);
    }
  };

  const handleDeleteSession = (id: string) => {
    if (window.confirm("Are you sure you want to delete this session?")) {
      deleteSession.mutate(id);
    }
  };

  const handleEditSession = (session: DoctorSession) => {
    setCurrentSession(session);
    setFormData({
      date: session.date,
      start_time: session.start_time,
      end_time: session.end_time,
      session_type: session.session_type,
      max_patients: session.max_patients,
      location: session.location || ""
    });
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleAddSession = () => {
    setCurrentSession(null);
    setFormData({
      date: "",
      start_time: "",
      end_time: "",
      session_type: "General Checkup",
      max_patients: 1,
      location: ""
    });
    setIsEditMode(false);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setCurrentSession(null);
  };

  const groupSessionsByDate = (sessions: DoctorSession[] = []) => {
    const grouped: Record<string, DoctorSession[]> = {};
    
    sessions.forEach(session => {
      if (!grouped[session.date]) {
        grouped[session.date] = [];
      }
      grouped[session.date].push(session);
    });
    
    return Object.entries(grouped)
      .sort(([dateA], [dateB]) => {
        // Sort by date ascending
        return new Date(dateA).getTime() - new Date(dateB).getTime();
      });
  };

  const groupedSessions = groupSessionsByDate(sessions);

  return (
    <DashboardLayout>
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Sessions</h1>
          <p className="text-gray-600">Manage your availability and appointment sessions</p>
        </div>
        <Button onClick={handleAddSession}>
          <Plus className="h-4 w-4 mr-2" />
          Add Session
        </Button>
      </div>

      {/* New Session Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? "Edit Session" : "Create New Session"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4 pt-4">
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_time">Start Time</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={handleChange}
                  required
                />
              </div>
              <div>
                <Label htmlFor="end_time">End Time</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="session_type">Session Type</Label>
              <Select
                value={formData.session_type}
                onValueChange={(value) => handleSelectChange('session_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select session type" />
                </SelectTrigger>
                <SelectContent>
                  {SESSION_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="max_patients">Maximum Patients</Label>
              <Input
                id="max_patients"
                name="max_patients"
                type="number"
                min="1"
                value={formData.max_patients}
                onChange={handleChange}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Hospital Name, Room Number, or Virtual"
              />
            </div>
            
            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? "Update Session" : "Create Session"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Sessions List */}
      {isLoading ? (
        <div className="text-center py-10">Loading sessions...</div>
      ) : groupedSessions.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">You haven't created any sessions yet.</p>
          <Button onClick={handleAddSession}>
            <Plus className="h-4 w-4 mr-2" />
            Create Your First Session
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupedSessions.map(([date, dateSessions]) => (
            <div key={date} className="space-y-3">
              <h2 className="text-lg font-semibold flex items-center text-gray-700">
                <Calendar className="h-5 w-5 mr-2 text-primary" />
                {format(parseISO(date), 'EEEE, MMMM d, yyyy')}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dateSessions.map(session => (
                  <Card key={session.id} className="overflow-hidden">
                    <CardHeader className="bg-gray-50 pb-3">
                      <CardTitle className="flex items-center text-lg">
                        <Clock className="h-5 w-5 mr-2 text-primary" />
                        {format(parseISO(`${session.date}T${session.start_time}`), 'h:mm a')} - 
                        {format(parseISO(`${session.date}T${session.end_time}`), 'h:mm a')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600 flex items-center">
                          <span className="font-medium mr-2">Type:</span> 
                          {session.session_type}
                        </div>
                        
                        <div className="text-sm text-gray-600 flex items-center">
                          <Users className="h-4 w-4 mr-1 text-gray-400" />
                          <span className="font-medium mr-2">Patients:</span>
                          {session.patients_booked} / {session.max_patients}
                        </div>
                        
                        {session.location && (
                          <div className="text-sm text-gray-600 flex items-center">
                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                            <span>{session.location}</span>
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-600 flex items-center">
                          <span className="font-medium mr-2">Status:</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            session.is_available
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}>
                            {session.is_available ? "Available" : "Fully Booked"}
                          </span>
                        </div>
                        
                        <div className="pt-2 flex space-x-2 justify-end">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleEditSession(session)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleDeleteSession(session.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
};

export default DoctorSessions;
