
import { Clock, Calendar, Shield, Star } from "lucide-react";
import { Card, CardContent } from "./ui/card";

const features = [
  {
    icon: <Clock className="h-10 w-10 text-medical-blue" />,
    title: "Save Time",
    description: "Book appointments 24/7, no phone calls needed. Manage your healthcare on your schedule."
  },
  {
    icon: <Calendar className="h-10 w-10 text-medical-purple" />,
    title: "Easy Scheduling",
    description: "View real-time availability of doctors and select the time that works best for you."
  },
  {
    icon: <Shield className="h-10 w-10 text-medical-blue" />,
    title: "Secure & Private",
    description: "Your personal and medical information is encrypted and protected with the highest standards."
  },
  {
    icon: <Star className="h-10 w-10 text-medical-purple" />,
    title: "Top Specialists",
    description: "Connect with verified healthcare professionals across all medical specialties."
  }
];

const Features = () => {
  return (
    <section className="py-16 px-6 md:px-10 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-medical-dark mb-4">
            Why Choose ChronoMed?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Our platform makes healthcare accessible and convenient for everyone.
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="bg-medical-light border-none rounded-xl hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 h-full"
            >
              <CardContent className="p-6">
                <div className="mb-4 flex justify-center sm:justify-start">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3 text-medical-dark">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
