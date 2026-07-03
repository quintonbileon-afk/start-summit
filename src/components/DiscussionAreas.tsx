import { motion } from 'motion/react';
import { Lightbulb, Briefcase, Globe, Rocket, LineChart, Scale } from 'lucide-react';

export function DiscussionAreas() {
  const areas = [
    { icon: <Briefcase className="w-10 h-10" />, title: "Entrepreneurship as a Solution to Unemployment" },
    { icon: <LineChart className="w-10 h-10" />, title: "Startup Funding and Investment" },
    { icon: <Globe className="w-10 h-10" />, title: "Market Access and Business Growth" },
    { icon: <Lightbulb className="w-10 h-10" />, title: "Innovation and Technology" },
    { icon: <Rocket className="w-10 h-10" />, title: "Startup Ecosystem Development" },
    { icon: <Scale className="w-10 h-10" />, title: "Policy and Regulatory Environment" },
  ];

  return (
    <section id="areas" className="py-24 bg-primary relative">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Key Discussion Areas</h2>
          <div className="w-20 h-2 bg-accent mx-auto rounded-full mb-6"></div>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Focused panels and workshops designed to tackle the most pressing challenges and uncover the biggest opportunities.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {areas.map((area, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-primary-light/50 border border-white/10 p-8 rounded-2xl hover:bg-primary-light transition-colors group"
            >
              <div className="w-20 h-20 bg-accent/10 rounded-2xl flex items-center justify-center text-accent mb-6 group-hover:scale-110 group-hover:-translate-y-2 group-hover:bg-accent group-hover:text-white transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]">
                <div className="group-hover:animate-bounce">
                  {area.icon}
                </div>
              </div>
              <h3 className="text-xl font-bold text-white leading-snug">{area.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
