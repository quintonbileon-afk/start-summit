import { motion } from 'motion/react';
import { Users, Mic, TrendingUp, Utensils, Lightbulb, Trophy, GlassWater } from 'lucide-react';

export function Agenda() {
  const schedule = [
    { time: "08:00 AM", title: "Registration & Networking Breakfast", desc: "Collect your badges and connect with early arrivals.", icon: <Users className="w-5 h-5" /> },
    { time: "09:00 AM", title: "Opening Keynote", desc: "Building Botswana's Startup Ecosystem from ground up.", icon: <Mic className="w-5 h-5" /> },
    { time: "10:30 AM", title: "Panel: Funding & Investment", desc: "Navigating the venture capital and grant landscape in Africa.", icon: <TrendingUp className="w-5 h-5" /> },
    { time: "12:00 PM", title: "Networking Lunch", desc: "Catered lunch and exhibitor showcase.", icon: <Utensils className="w-5 h-5" /> },
    { time: "01:30 PM", title: "Breakout Sessions", desc: "Deep dives into Innovation, Tech, and Policy.", icon: <Lightbulb className="w-5 h-5" /> },
    { time: "04:00 PM", title: "Startup Pitch Competition", desc: "Top 5 startups pitch to a panel of investors.", icon: <Trophy className="w-5 h-5" /> },
    { time: "05:30 PM", title: "Closing Remarks & Sundowners", desc: "Wrap up and evening networking reception.", icon: <GlassWater className="w-5 h-5" /> },
  ];

  return (
    <section id="agenda" className="py-24 bg-white text-primary">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Summit Agenda</h2>
          <div className="w-20 h-2 bg-yellow mx-auto rounded-full"></div>
        </motion.div>

        <div className="relative border-l-4 border-gray-100 ml-4 md:ml-12 pl-6 md:pl-10">
          {schedule.map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="mb-8 relative group"
            >
              {/* Timeline Icon */}
              <div className="absolute w-12 h-12 bg-gray-50 text-gray-400 group-hover:bg-accent group-hover:text-white rounded-full flex items-center justify-center -left-[50px] md:-left-[66px] top-3 ring-4 ring-white shadow-sm group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 z-10">
                {item.icon}
              </div>

              {/* Event Card */}
              <div className="bg-white p-5 md:p-6 rounded-2xl border border-gray-100 shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row md:items-center gap-4 md:gap-6 relative overflow-hidden">
                {/* Subtle gradient hover background */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                <span className="shrink-0 inline-block px-4 py-2 bg-primary/5 group-hover:bg-accent/10 group-hover:text-accent text-primary font-bold text-sm rounded-xl w-max md:w-32 text-center md:text-left transition-colors duration-300">
                  {item.time}
                </span>
                
                <div className="relative z-10">
                  <h3 className="text-xl font-bold text-primary group-hover:text-accent transition-colors duration-300">{item.title}</h3>
                  <p className="text-gray-600 text-sm mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
