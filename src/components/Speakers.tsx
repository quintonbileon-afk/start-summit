import { motion } from 'motion/react';

export function Speakers() {
  // Placeholders for speakers
  const speakers = Array.from({ length: 4 }).map((_, i) => ({
    name: `Speaker ${i + 1}`,
    role: "Industry Leader",
    company: "Tech Corp"
  }));

  return (
    <section id="speakers" className="py-24 bg-gray-50 text-primary">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Featured Speakers</h2>
          <div className="w-20 h-2 bg-secondary mx-auto rounded-full mb-6"></div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Learn from industry pioneers, policymakers, and successful founders who are shaping the future of Botswana's economy.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {speakers.map((speaker, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="group relative rounded-2xl overflow-hidden aspect-[3/4] bg-primary"
            >
              {/* Image Placeholder */}
              <div className="absolute inset-0 bg-primary-light mix-blend-multiply opacity-50 group-hover:opacity-20 transition-opacity duration-500"></div>
              <div className="absolute inset-0 flex items-center justify-center text-white/10">
                <span className="text-6xl font-bold font-display">{idx + 1}</span>
              </div>
              
              <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/50 to-transparent"></div>
              
              <div className="absolute bottom-0 left-0 w-full p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                <div className="w-8 h-1 bg-accent mb-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <h3 className="text-xl font-bold text-white mb-1">{speaker.name}</h3>
                <p className="text-accent font-medium text-sm mb-1">{speaker.role}</p>
                <p className="text-white/70 text-xs">{speaker.company}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
