
import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Calendar, 
  Clock, 
  Home, 
  LogOut, 
  Menu, 
  Settings, 
  Stethoscope, 
  User, 
  Users,
  X
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { user, signOut, isDoctor, isPatient, isLoading } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Only redirect if we're sure the user isn't logged in (not during loading)
    if (!isLoading && !user) {
      // Allow redirecting from doctor & patient specific pages, but avoid redirecting
      // from profile pages which might still be loading profile data
      const isProfilePage = location.pathname.includes('profile');
      
      if (!isProfilePage) {
        console.log("No user detected, redirecting from:", location.pathname);
        const redirectUrl = isDoctor ? "/login/doctor" : "/login/customer";
        navigate(redirectUrl);
      }
    }
  }, [user, isLoading, navigate, isDoctor, location.pathname]);

  // Show a loading state instead of returning null, which might cause flash redirect
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // Return layout even if user isn't fully loaded - this prevents
  // redirects on profile pages where we're still fetching data
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Please log in to access this page</p>
        <Button 
          variant="link" 
          onClick={() => navigate("/login/customer")}
          className="ml-2"
        >
          Go to Login
        </Button>
      </div>
    );
  }

  const doctorNavItems = [
    { name: "Dashboard", path: "/doctor-dashboard", icon: <Home className="h-5 w-5" /> },
    { name: "My Sessions", path: "/doctor-sessions", icon: <Clock className="h-5 w-5" /> },
    { name: "Appointments", path: "/doctor-appointments", icon: <Calendar className="h-5 w-5" /> },
    { name: "Profile", path: "/doctor-profile", icon: <User className="h-5 w-5" /> },
  ];

  const patientNavItems = [
    { name: "Dashboard", path: "/patient-dashboard", icon: <Home className="h-5 w-5" /> },
    { name: "Book Appointment", path: "/find-doctors", icon: <Stethoscope className="h-5 w-5" /> },
    { name: "My Appointments", path: "/patient-appointments", icon: <Calendar className="h-5 w-5" /> },
    { name: "Profile", path: "/patient-profile", icon: <User className="h-5 w-5" /> },
  ];

  const navItems = isDoctor ? doctorNavItems : patientNavItems;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="bg-white shadow">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">ChronoMed</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-4">
            <div className="text-sm text-gray-700">
              Welcome, <span className="font-semibold">{user.email}</span>
            </div>
            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
          
          <button 
            className="md:hidden text-gray-700" 
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </header>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 md:hidden">
          <div className="bg-white h-full w-64 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <Link to="/" className="flex items-center gap-2">
                <Stethoscope className="h-6 w-6 text-primary" />
                <span className="text-xl font-bold">ChronoMed</span>
              </Link>
              <button onClick={() => setIsMobileMenuOpen(false)}>
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="border-b pb-4 mb-4">
              <div className="text-sm text-gray-700 mb-2">
                Welcome, <span className="font-semibold">{user.email}</span>
              </div>
              <Button variant="outline" size="sm" onClick={signOut} className="w-full">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
            
            <nav className="flex-1">
              <ul className="space-y-2">
                {navItems.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center px-4 py-2 rounded-md ${
                        location.pathname === item.path
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.icon}
                      <span className="ml-3">{item.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 bg-white border-r">
          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center px-4 py-2 rounded-md ${
                      location.pathname === item.path
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-gray-100"
                    }`}
                  >
                    {item.icon}
                    <span className="ml-3">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
