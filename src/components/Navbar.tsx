
import { Link } from "react-router-dom";
import { Stethoscope, User, UserPlus, LogIn } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

const Navbar = () => {
  return (
    <nav className="w-full py-4 px-6 md:px-10 flex items-center justify-between border-b bg-white">
      <Link to="/" className="flex items-center gap-2">
        <Stethoscope className="h-8 w-8 text-medical-purple" />
        <span className="text-xl font-bold text-medical-dark">ChronoMed</span>
      </Link>
      
      <div className="flex gap-4 items-center">
        <div className="hidden md:flex gap-3">
          <Link to="/login/customer">
            <Button variant="ghost" className="flex gap-2 items-center">
              <LogIn className="h-4 w-4" />
              Login
            </Button>
          </Link>
          <Link to="/signup/customer">
            <Button variant="outline" className="flex gap-2 items-center">
              <UserPlus className="h-4 w-4" />
              Sign Up
            </Button>
          </Link>
          <Link to="/login/doctor">
            <Button variant="default" className="bg-medical-blue hover:bg-medical-blue/90 flex gap-2 items-center">
              <User className="h-4 w-4" />
              For Doctors
            </Button>
          </Link>
        </div>
        
        {/* Mobile menu */}
        <div className="md:hidden">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
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
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/login/customer" className="flex items-center gap-2 w-full">
                  <LogIn className="h-4 w-4" />
                  <span>Login</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/signup/customer" className="flex items-center gap-2 w-full">
                  <UserPlus className="h-4 w-4" />
                  <span>Sign Up</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
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
