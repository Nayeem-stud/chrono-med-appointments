
import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Stethoscope, User, UserPlus, LogIn } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <nav 
      className={`fixed top-0 w-full py-4 px-6 md:px-10 flex items-center justify-between z-50 transition-all duration-300 ${
        isScrolled ? "bg-white/95 backdrop-blur-sm shadow-sm" : "bg-transparent"
      }`}
    >
      <Link to="/" className="flex items-center gap-2">
        <Stethoscope className="h-8 w-8 text-medical-purple" />
        <span className="text-xl font-bold text-medical-dark">ChronoMed</span>
      </Link>
      
      <div className="flex gap-4 items-center">
        <div className="hidden md:flex gap-3">
          <Link to="/login/customer">
            <Button variant="ghost" className="flex gap-2 items-center hover:bg-medical-light/70">
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          </Link>
          <Link to="/signup/customer">
            <Button variant="outline" className="flex gap-2 items-center border-medical-purple/30 text-medical-purple hover:bg-medical-purple/10 hover:border-medical-purple">
              <UserPlus className="h-4 w-4" />
              Sign Up
            </Button>
          </Link>
          <Link to="/login/doctor">
            <Button variant="default" className="bg-medical-blue hover:bg-medical-blue/90 flex gap-2 items-center rounded-lg shadow-sm hover:shadow-md transition-all duration-300">
              <User className="h-4 w-4" />
              For Doctors
            </Button>
          </Link>
        </div>
        
        {/* Mobile menu */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="border-none hover:bg-medical-light/70">
                <span className="sr-only">Open menu</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="4" x2="20" y1="12" y2="12" />
                  <line x1="4" x2="20" y1="6" y2="6" />
                  <line x1="4" x2="20" y1="18" y2="18" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
              <DropdownMenuItem asChild className="py-2 rounded-lg">
                <Link to="/login/customer" className="flex items-center gap-2 w-full">
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="py-2 rounded-lg">
                <Link to="/signup/customer" className="flex items-center gap-2 w-full">
                  <UserPlus className="h-4 w-4" />
                  <span>Sign Up</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="py-2 rounded-lg">
                <Link to="/login/doctor" className="flex items-center gap-2 w-full">
                  <User className="h-4 w-4" />
                  <span>For Doctors</span>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
