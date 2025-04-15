
import { createContext, useContext, useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Session, User } from "@supabase/supabase-js";
import { toast } from "sonner";

type UserType = "doctor" | "customer";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  userType: UserType | null;
  isLoading: boolean;
  isDoctor: boolean;
  isPatient: boolean;
  signUp: (email: string, password: string, userData: any, type: UserType) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Check if doctor
          supabase.rpc('is_doctor')
            .then(({ data, error }) => {
              if (!error && data) {
                setUserType('doctor');
                if (location.pathname === '/login/doctor' || location.pathname === '/signup/doctor') {
                  navigate('/doctor-dashboard');
                }
              } else {
                setUserType('customer');
                if (location.pathname === '/login/customer' || location.pathname === '/signup/customer') {
                  navigate('/patient-dashboard');
                }
              }
            });
        } else {
          setUserType(null);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        // Check if doctor
        supabase.rpc('is_doctor')
          .then(({ data, error }) => {
            if (!error && data) {
              setUserType('doctor');
              if (!['/doctor-dashboard', '/doctor-sessions', '/doctor-appointments'].includes(location.pathname)) {
                navigate('/doctor-dashboard');
              }
            } else {
              setUserType('customer');
              if (!['/patient-dashboard', '/find-doctors', '/patient-appointments'].includes(location.pathname)) {
                navigate('/patient-dashboard');
              }
            }
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, location.pathname]);

  const signUp = async (email: string, password: string, userData: any, type: UserType) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            user_type: type,
            first_name: userData.firstName,
            last_name: userData.lastName,
            specialization: userData.specialization,
            qualification: userData.qualification,
            experience: userData.experience || 0
          }
        }
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Signup successful! Please check your email to verify your account.");
      
      // Navigate to corresponding dashboard based on user type
      if (type === 'doctor') {
        navigate("/doctor-dashboard");
      } else {
        navigate("/patient-dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred during signup");
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        toast.error(error.message);
        return;
      }

      toast.success("Login successful!");

      // Redirection will be handled by the auth state change listener
    } catch (error: any) {
      toast.error(error.message || "An error occurred during login");
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
      navigate("/");
      toast.success("Logged out successfully");
    } catch (error: any) {
      toast.error(error.message || "An error occurred during logout");
    }
  };

  return (
    <AuthContext.Provider value={{
      session,
      user,
      userType,
      isLoading,
      isDoctor: userType === 'doctor',
      isPatient: userType === 'customer',
      signUp,
      signIn,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
