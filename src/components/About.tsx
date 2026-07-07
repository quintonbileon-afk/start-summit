import { motion } from 'motion/react';
import { Target, TrendingUp, Users } from 'lucide-react';

export function About() {
  const pillars = [
    {
      icon: <Users className="w-8 h-8 text-accent group-hover:text-accent transition-colors" />,
      title: "Ecosystem Collaboration",
      desc: "Bringing together entrepreneurs, investors, corporates, and policymakers."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-yellow group-hover:text-accent transition-colors" />,
      title: "Economic Diversification",
      desc: "Repositioning the economy towards private sector-led growth."
    },
    {
      icon: <Target className="w-8 h-8 text-accent group-hover:text-accent transition-colors" />,
      title: "Practical Solutions",
      desc: "Addressing real constraints and cultivating a vibrant startup ecosystem."
    }
  ];

  return (
    <section id="about" className="py-24 bg-white text-primary">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-justify"
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6 leading-tight">
              Building Botswana's <br />
              <span className="text-accent">Startup Ecosystem</span> <br />
              from Ground Up.
            </h2>
            <div className="w-20 h-2 bg-yellow mb-8 rounded-full"></div>
            <p className="text-lg text-gray-600 mb-6 leading-relaxed">
              Botswana is undergoing a critical economic transition characterized by rising youth unemployment, slow private sector growth and an urgent need for economic diversification.
            </p>
            <p className="text-lg text-gray-600 leading-relaxed font-medium">
              The summit will bring together entrepreneurs, startups, investors, corporates, policymakers, financial institutions, academia and development partners to address the real constraints facing entrepreneurship in Botswana.
            </p>
          </motion.div>

          <div className="grid gap-6">
            {pillars.map((pillar, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex gap-6 p-6 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
              >
                {/* Subtle gradient hover background */}
                <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                
                <div className="relative z-10 shrink-0 w-16 h-16 flex items-center justify-center bg-gray-50 rounded-xl shadow-sm border border-gray-100 group-hover:scale-110 group-hover:bg-accent/10 group-hover:border-accent/20 transition-all duration-300">
                  {pillar.icon}
                </div>
                <div className="relative z-10">
                  <h3 className="text-xl font-bold mb-2 text-primary group-hover:text-accent transition-colors duration-300">{pillar.title}</h3>
                  <p className="text-gray-600 leading-relaxed">{pillar.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
