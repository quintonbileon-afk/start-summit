import { motion } from 'motion/react';
import { Target, TrendingUp, Users } from 'lucide-react';

export function About() {
  const pillars = [
    {
      icon: <Users className="w-8 h-8 text-accent" />,
      title: "Ecosystem Collaboration",
      desc: "Bringing together entrepreneurs, investors, corporates, and policymakers."
    },
    {
      icon: <TrendingUp className="w-8 h-8 text-yellow" />,
      title: "Economic Diversification",
      desc: "Repositioning the economy towards private sector-led growth."
    },
    {
      icon: <Target className="w-8 h-8 text-accent" />,
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
                className="flex gap-6 p-6 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-lg transition-shadow"
              >
                <div className="shrink-0 p-4 bg-white rounded-xl shadow-sm h-fit">
                  {pillar.icon}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">{pillar.title}</h3>
                  <p className="text-gray-600">{pillar.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
