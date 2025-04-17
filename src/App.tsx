
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Doctor routes
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorSessions from "./pages/doctor/DoctorSessions";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";
import DoctorProfile from "./pages/doctor/DoctorProfile";

// Patient routes
import PatientDashboard from "./pages/patient/PatientDashboard";
import FindDoctors from "./pages/patient/FindDoctors";
import PatientAppointments from "./pages/patient/PatientAppointments";
import PatientProfile from "./pages/patient/PatientProfile";

const queryClient = new QueryClient();

// Protected route components
const DoctorRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isDoctor, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user || !isDoctor) {
    return <Navigate to="/login/doctor" replace />;
  }
  
  return children;
};

const PatientRoute = ({ children }: { children: JSX.Element }) => {
  const { user, isPatient, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user || !isPatient) {
    return <Navigate to="/login/customer" replace />;
  }
  
  return children;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login/:type" element={<Login />} />
            <Route path="/signup/:type" element={<Signup />} />
            
            {/* Doctor Routes - Protected */}
            <Route 
              path="/doctor-dashboard" 
              element={
                <DoctorRoute>
                  <DoctorDashboard />
                </DoctorRoute>
              } 
            />
            <Route 
              path="/doctor-sessions" 
              element={
                <DoctorRoute>
                  <DoctorSessions />
                </DoctorRoute>
              } 
            />
            <Route 
              path="/doctor-appointments" 
              element={
                <DoctorRoute>
                  <DoctorAppointments />
                </DoctorRoute>
              } 
            />
            <Route 
              path="/doctor-profile" 
              element={
                <DoctorRoute>
                  <DoctorProfile />
                </DoctorRoute>
              } 
            />

            {/* Patient Routes - Protected */}
            <Route 
              path="/patient-dashboard" 
              element={
                <PatientRoute>
                  <PatientDashboard />
                </PatientRoute>
              } 
            />
            <Route 
              path="/find-doctors" 
              element={
                <PatientRoute>
                  <FindDoctors />
                </PatientRoute>
              } 
            />
            <Route 
              path="/patient-appointments" 
              element={
                <PatientRoute>
                  <PatientAppointments />
                </PatientRoute>
              } 
            />
            <Route 
              path="/patient-profile" 
              element={
                <PatientRoute>
                  <PatientProfile />
                </PatientRoute>
              } 
            />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
