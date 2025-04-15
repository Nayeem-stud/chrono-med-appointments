
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <div className="bg-gradient-to-b from-medical-light to-white py-16 px-6 md:py-24 md:px-10">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
        <div className="space-y-6">
          <h1 className="text-4xl md:text-5xl font-bold text-medical-dark leading-tight">
            Your Health, <span className="text-medical-purple">On Your Schedule</span>
          </h1>
          <p className="text-lg text-gray-700">
            Book appointments with top healthcare professionals in just a few clicks. No waiting, no hassle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-2">
            <Link to="/signup/customer">
              <Button className="bg-medical-blue hover:bg-medical-blue/90 text-white px-8 py-6 text-lg w-full sm:w-auto">
                Book an Appointment
              </Button>
            </Link>
            <Link to="/login/doctor">
              <Button variant="outline" className="border-medical-purple text-medical-purple hover:bg-medical-purple/10 px-8 py-6 text-lg w-full sm:w-auto">
                For Healthcare Providers
              </Button>
            </Link>
          </div>
        </div>
        <div className="hidden md:block">
          <img
            src="https://images.unsplash.com/photo-1651008376811-b90baee60c1f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"
            alt="Doctor with patient"
            className="rounded-xl shadow-lg w-full object-cover"
          />
        </div>
      </div>
    </div>
  );
};

export default Hero;
