import { motion } from 'motion/react';

export function Agenda() {
  const schedule = [
    { time: "08:00 AM", title: "Registration & Networking Breakfast", desc: "Collect your badges and connect with early arrivals." },
    { time: "09:00 AM", title: "Opening Keynote", desc: "Building Botswana's Startup Ecosystem from ground up." },
    { time: "10:30 AM", title: "Panel: Funding & Investment", desc: "Navigating the venture capital and grant landscape in Africa." },
    { time: "12:00 PM", title: "Networking Lunch", desc: "Catered lunch and exhibitor showcase." },
    { time: "01:30 PM", title: "Breakout Sessions", desc: "Deep dives into Innovation, Tech, and Policy." },
    { time: "04:00 PM", title: "Startup Pitch Competition", desc: "Top 5 startups pitch to a panel of investors." },
    { time: "05:30 PM", title: "Closing Remarks & Sundowners", desc: "Wrap up and evening networking reception." },
  ];

  return (
    <section id="agenda" className="py-24 bg-white text-primary">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Summit Agenda</h2>
          <div className="w-20 h-2 bg-secondary mx-auto rounded-full"></div>
        </motion.div>

        <div className="relative border-l-4 border-gray-100 ml-4 md:ml-0">
          {schedule.map((item, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="mb-10 ml-8 md:ml-12 relative"
            >
              <div className="absolute w-4 h-4 bg-accent rounded-full -left-[42px] md:-left-[58px] top-1.5 ring-4 ring-white"></div>
              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 hover:shadow-md transition-shadow">
                <span className="inline-block px-3 py-1 bg-primary/5 text-primary font-bold text-sm rounded-lg mb-3">
                  {item.time}
                </span>
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
