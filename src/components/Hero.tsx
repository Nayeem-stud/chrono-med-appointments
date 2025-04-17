
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const Hero = () => {
  const isMobile = useIsMobile();

  return (
    <div className="bg-gradient-to-b from-medical-light to-white py-16 px-6 md:py-24 md:px-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        <div className="space-y-6 animate-fade-in">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-medical-dark leading-tight">
            Your Health, <span className="text-medical-purple">On Your Schedule</span>
          </h1>
          <p className="text-lg text-gray-700 max-w-lg">
            Book appointments with top healthcare professionals in just a few clicks. No waiting, no hassle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link to="/signup/customer">
              <Button className="bg-medical-blue hover:bg-medical-blue/90 text-white px-8 py-6 text-lg w-full sm:w-auto rounded-lg shadow-lg hover:shadow-xl transition-all duration-300">
                Book an Appointment
              </Button>
            </Link>
            <Link to="/login/doctor">
              <Button variant="outline" className="border-medical-purple text-medical-purple hover:bg-medical-purple/10 px-8 py-6 text-lg w-full sm:w-auto rounded-lg transition-all duration-300">
                For Healthcare Providers
              </Button>
            </Link>
          </div>
        </div>
        <div className="hidden md:flex justify-center items-center pl-8">
          <img
            src="https://images.unsplash.com/photo-1612349317150-e413f6a5b776?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
            alt="Doctor consulting with patient"
            className="rounded-2xl shadow-xl w-full max-w-[500px] object-cover transform hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
        {isMobile && (
          <div className="mt-8">
            <img
              src="https://images.unsplash.com/photo-1612349317150-e413f6a5b776?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=800&q=80"
              alt="Doctor consulting with patient"
              className="rounded-xl shadow-lg w-full object-cover h-64"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default Hero;

