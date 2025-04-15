
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

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
    <section className="py-16 px-6 md:px-10 bg-medical-light">
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
            <div key={index} className="bg-white p-6 rounded-xl shadow-sm">
              <div className="flex flex-col h-full">
                <blockquote className="flex-grow">
                  <p className="text-gray-600 italic mb-6">"{testimonial.quote}"</p>
                </blockquote>
                <div className="flex items-center mt-4">
                  <Avatar className="h-10 w-10 mr-3">
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
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
