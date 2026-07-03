import { motion } from 'motion/react';
import { MapPin, Navigation as NavIcon } from 'lucide-react';
import mapImage from '../assets/images/map_screenshot_1783058843958.jpg';

export function Venue() {
  return (
    <section id="venue" className="py-24 bg-primary relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">The Venue</h2>
            <div className="w-20 h-2 bg-accent mb-8 rounded-full"></div>
            
            <div className="bg-primary-light/50 border border-white/10 p-8 rounded-3xl mb-8">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-white/5 rounded-xl text-secondary">
                  <MapPin className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Game City Lifestyle Center</h3>
                  <p className="text-white/70 text-lg">Gaborone, Botswana</p>
                </div>
              </div>
              <p className="text-white/60 mb-8 leading-relaxed">
                Join us at Botswana's premier lifestyle and business hub. The venue offers state-of-the-art conference facilities, ample parking, and easy access from all major routes in Gaborone.
              </p>
              
              <a 
                href="https://maps.app.goo.gl/SSguvWZ8KwCyRxMC6" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 text-accent font-bold hover:text-white transition-colors"
              >
                <NavIcon className="w-5 h-5" />
                Get Directions
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative h-[400px] lg:h-[500px] rounded-3xl overflow-hidden border border-white/10 group"
          >
            <a 
              href="https://maps.app.goo.gl/SSguvWZ8KwCyRxMC6" 
              target="_blank" 
              rel="noopener noreferrer"
              className="absolute inset-0 block"
            >
              <img 
                src={mapImage} 
                alt="Map to Game City Shopping Mall" 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-primary/20 group-hover:bg-transparent transition-colors duration-500"></div>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
