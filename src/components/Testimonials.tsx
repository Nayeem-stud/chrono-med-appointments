
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Card, CardContent } from "./ui/card";
import { Quote } from "lucide-react";

const testimonials = [
  {
    quote: "ChronoMed has made it so easy to book appointments with my specialist. I used to wait weeks, now I can see availability instantly.",
    name: "Sarah Johnson",
    role: "Patient",
    avatar: "SJ"
  },
  {
    quote: "As a physician, this platform has streamlined my practice and reduced no-shows significantly. The interface is intuitive and time-saving.",
    name: "Dr. Michael Chen",
    role: "Cardiologist",
    avatar: "MC"
  },
  {
    quote: "I love being able to book appointments for my entire family in one place. The reminders are helpful and the process is seamless.",
    name: "Robert Garcia",
    role: "Parent of three",
    avatar: "RG"
  }
];

const Testimonials = () => {
  return (
    <section className="py-16 px-6 md:px-10 bg-gradient-to-b from-white to-medical-light">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-medical-dark mb-4">
            What Our Users Say
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Join thousands of satisfied patients and healthcare providers.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card 
              key={index} 
              className="bg-white border-none rounded-xl shadow-sm hover:shadow-md transition-all duration-300 h-full"
            >
              <CardContent className="p-6 flex flex-col h-full">
                <div className="text-medical-purple opacity-40 mb-2">
                  <Quote size={32} />
                </div>
                <blockquote className="flex-grow">
                  <p className="text-gray-600 mb-6">{testimonial.quote}</p>
                </blockquote>
                <div className="flex items-center mt-4 pt-4 border-t border-gray-100">
                  <Avatar className="h-10 w-10 mr-3 border-2 border-medical-light">
                    <AvatarImage src="" alt={testimonial.name} />
                    <AvatarFallback className="bg-medical-blue text-white">
                      {testimonial.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold text-medical-dark">{testimonial.name}</p>
                    <p className="text-sm text-gray-500">{testimonial.role}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
