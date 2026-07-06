import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Navigation as NavIcon, Car, Bus, Plane } from 'lucide-react';

export function Venue() {
  const [activeTab, setActiveTab] = useState<'driving' | 'transit' | 'airport'>('driving');

  const googleMapUrl = `https://maps.google.com/maps?q=Game%20City%20Mall,%20Gaborone,%20Botswana&t=&z=16&ie=UTF8&iwloc=&output=embed`;

  const transitDetails = {
    driving: {
      icon: <Car className="w-5 h-5" />,
      title: "Driving & Parking",
      desc: "Located at the high-traffic intersection of Lobatse Road and Kudumatse Drive. Game City features over 1,000 free, secure parking bays directly surrounding the main lifestyle entrance."
    },
    transit: {
      icon: <Bus className="w-5 h-5" />,
      title: "Public Combi Routes",
      desc: "Major Gaborone combi routes (including Route 3 and Western Bypass routes) terminate directly at the Game City Bus Terminal, a safe, well-lit 2-minute walk to the entrance."
    },
    airport: {
      icon: <Plane className="w-5 h-5" />,
      title: "From Sir Seretse Khama Airport",
      desc: "A straightforward 25-minute (18km) drive down Airport Road onto the Western Bypass directly to Game City. Ridesharing apps and pre-booked airport shortcuts are readily available."
    }
  };

  return (
    <section id="venue" className="py-24 bg-primary relative overflow-hidden">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Info and Transit Tabs */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">The Venue</h2>
              <div className="w-20 h-2 bg-accent mb-8 rounded-full"></div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
              className="bg-primary-light/50 border border-white/10 p-8 rounded-3xl mb-8 backdrop-blur-sm"
            >
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-white/5 rounded-xl text-yellow">
                  <MapPin className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold mb-2">Game City Lifestyle Center</h3>
                  <p className="text-white/70 text-lg">Gaborone, Botswana</p>
                </div>
              </div>
              <p className="text-white/60 mb-8 leading-relaxed">
                Join us at Botswana's premier lifestyle and business hub. The venue offers state-of-the-art conference facilities, premium catering options, ample parking, and comfortable lounge areas.
              </p>
              
              <a 
                href="https://maps.app.goo.gl/SSguvWZ8KwCyRxMC6" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-2 text-accent font-bold hover:text-white transition-colors group mb-8"
              >
                <NavIcon className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                Get Directions on Google Maps
              </a>

              {/* Interactive Transit Info Tabs */}
              <div className="border-t border-white/10 pt-6">
                <p className="text-xs uppercase font-semibold tracking-wider text-white/40 mb-4">How to Get There</p>
                <div className="flex gap-2 mb-4 bg-primary/40 p-1.5 rounded-xl border border-white/5">
                  {(Object.keys(transitDetails) as Array<keyof typeof transitDetails>).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        activeTab === tab 
                          ? 'bg-accent text-primary shadow-lg shadow-accent/10' 
                          : 'text-white/60 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {transitDetails[tab].icon}
                      <span className="hidden sm:inline capitalize">{tab}</span>
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="bg-primary/20 p-4 rounded-2xl border border-white/5"
                  >
                    <h4 className="font-bold text-white mb-1.5 flex items-center gap-2 text-base">
                      {transitDetails[activeTab].icon}
                      {transitDetails[activeTab].title}
                    </h4>
                    <p className="text-white/60 text-sm leading-relaxed">
                      {transitDetails[activeTab].desc}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </div>

          {/* Right Column: Fully Interactive Map Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative h-[450px] lg:h-[550px] rounded-3xl overflow-hidden border border-white/10 shadow-2xl flex flex-col bg-primary-light"
          >
            {/* Map Iframe Wrapper */}
            <div className="relative flex-1 w-full h-full bg-slate-900 overflow-hidden">
              <iframe
                title="Event Venue Map"
                src={googleMapUrl}
                className="w-full h-full border-0 grayscale-[15%] contrast-[110%]"
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

