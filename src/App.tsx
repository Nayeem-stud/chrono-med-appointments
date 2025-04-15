
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/use-auth";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import NotFound from "./pages/NotFound";

// Doctor routes
import DoctorDashboard from "./pages/doctor/DoctorDashboard";
import DoctorSessions from "./pages/doctor/DoctorSessions";
import DoctorAppointments from "./pages/doctor/DoctorAppointments";

// Patient routes
import PatientDashboard from "./pages/patient/PatientDashboard";
import FindDoctors from "./pages/patient/FindDoctors";
import PatientAppointments from "./pages/patient/PatientAppointments";

const queryClient = new QueryClient();

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
            
            {/* Doctor Routes */}
            <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
            <Route path="/doctor-sessions" element={<DoctorSessions />} />
            <Route path="/doctor-appointments" element={<DoctorAppointments />} />

            {/* Patient Routes */}
            <Route path="/patient-dashboard" element={<PatientDashboard />} />
            <Route path="/find-doctors" element={<FindDoctors />} />
            <Route path="/patient-appointments" element={<PatientAppointments />} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
