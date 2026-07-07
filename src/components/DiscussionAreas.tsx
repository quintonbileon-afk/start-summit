import { motion } from 'motion/react';
import { Lightbulb, Briefcase, Globe, Rocket, LineChart, Scale } from 'lucide-react';

export function DiscussionAreas() {
  const areas = [
    { 
      icon: <Briefcase className="w-8 h-8" />, 
      title: "Entrepreneurship & Job Creation",
      desc: "Empowering Botswana's youth and fostering a robust culture of self-reliance through world-class incubation and localized skills training."
    },
    { 
      icon: <LineChart className="w-8 h-8" />, 
      title: "Funding & Investment Networks",
      desc: "Unlocking cross-border venture capital, connecting regional angel investment syndicates, and mastering pitch readiness."
    },
    { 
      icon: <Globe className="w-8 h-8" />, 
      title: "Market Access & Scale",
      desc: "Scaling beyond regional borders, leveraging the AfCFTA framework, and establishing international B2B corridors."
    },
    { 
      icon: <Lightbulb className="w-8 h-8" />, 
      title: "Innovation & Deep Tech",
      desc: "Harnessing Artificial Intelligence, fintech, and digital transformation paradigms to redefine Gaborone's business canvas."
    },
    { 
      icon: <Rocket className="w-8 h-8" />, 
      title: "Ecosystem Integration",
      desc: "Bridging the gap between active research institutions, established corporate partners, and grassroots startup founders."
    },
    { 
      icon: <Scale className="w-8 h-8" />, 
      title: "Policy & Regulatory Support",
      desc: "Navigating Botswana's key startup incentives, the national Startup Act framework, and improving ease of doing business."
    },
  ];

  return (
    <section id="areas" className="py-24 bg-primary relative overflow-hidden">
      {/* Background radial soft light blobs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-accent/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-yellow/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Key Discussion Areas</h2>
          <div className="w-20 h-2 bg-accent mx-auto rounded-full mb-6"></div>
          <p className="text-lg text-white/70 max-w-2xl mx-auto">
            Interactive panels, peer-to-peer workshops, and specialized masterclasses tailored to build regional champions.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {areas.map((area, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.7, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
              className="bg-white/5 border border-white/10 p-8 rounded-[2rem] hover:-translate-y-2 hover:border-accent/30 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-500 backdrop-blur-sm group flex flex-col justify-between h-full relative overflow-hidden"
            >
              {/* Animated gradient background on hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              {/* Subtle top light effect */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-accent/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <div className="relative z-10">
                <div className="mb-8 relative inline-flex">
                  <div className="absolute inset-0 bg-accent blur-xl opacity-20 group-hover:opacity-60 transition-opacity duration-500 rounded-full" />
                  <div className="relative w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-accent group-hover:scale-110 group-hover:bg-accent group-hover:text-primary transition-all duration-500 group-hover:-rotate-3 group-hover:shadow-lg group-hover:shadow-accent/25">
                    {area.icon}
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-white leading-snug mb-4 group-hover:text-accent transition-colors duration-300">{area.title}</h3>
                <p className="text-white/70 text-base leading-relaxed">{area.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

