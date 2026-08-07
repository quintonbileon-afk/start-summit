import { motion } from 'motion/react';
import { Mic, Sparkles, Award, Building2, Briefcase } from 'lucide-react';

import drFarzamImg from '../assets/images/dr_farzam_kamalabadi.jpg';
import gaoneImg from '../assets/images/gaone_kabo_edzani.jpg';
import tebogoImg from '../assets/images/tebogo1.png';

interface Speaker {
  id: string;
  name: string;
  role: string;
  company?: string;
  badge: 'Keynote Speaker' | 'Speaker';
  isKeynote?: boolean;
  image: string;
  fallbackImage: string;
  bio: string;
}

const SPEAKERS: Speaker[] = [
  {
    id: 'dr-farzam',
    name: 'Dr Farzam Kamalabadi',
    role: 'Presidential Envoy on Global Relations & Economic Development',
    badge: 'Keynote Speaker',
    isKeynote: true,
    image: drFarzamImg,
    fallbackImage: '/images/dr_farzam_kamalabadi.jpg',
    bio: 'Farzam Kamalabadi is a Persian-American global strategist, entrepreneur, and Founder & Chairman of Future Trends Group. Over the past three decades, he has advised governments, business leaders, and institutions across China, the Middle East, Africa, Europe, and the United States on economic development, cross-border investment, energy, finance, and emerging technologies. Widely recognized for his extensive engagement with China and international markets, he has contributed to major trade, investment, and strategic initiatives. Today, his work is focused on advancing Africa\'s economic transformation through innovative development models designed to promote sustainable growth, international cooperation, poverty reduction, and shared global prosperity.'
  },
  {
    id: 'gaone-edzani',
    name: 'Mrs Gaone Catherine Kabo-Edzani',
    role: 'Founder and Managing Director',
    company: 'Perfect Pour',
    badge: 'Speaker',
    isKeynote: false,
    image: gaoneImg,
    fallbackImage: '/images/gaone_kabo_edzani.jpg',
    bio: 'Leading entrepreneurial innovation and business excellence in Botswana\'s private sector, championing local startup development and sustainable enterprise growth.'
  },
  {
    id: 'tebogo-mogaleemang',
    name: 'Tebogo Mogaleemang',
    role: 'Managing Director',
    company: 'Spectrum Analytics',
    badge: 'Speaker',
    isKeynote: false,
    image: tebogoImg,
    fallbackImage: '/tebogo1.png',
    bio: 'Driving data-driven insights and innovation as the Managing Director of Spectrum Analytics, empowering businesses to harness the power of data for strategic growth.'
  }
];

export function Speakers() {
  return (
    <section id="speakers" className="py-24 bg-gray-50 text-primary relative overflow-hidden">
      {/* Subtle background pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none" 
        style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }}
      ></div>
      
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl -rotate-6 hover:rotate-0 transition-transform duration-300">
            <Mic className="w-8 h-8 text-yellow" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-4">
            Distinguished <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow">Speakers</span>
          </h2>
          <div className="w-20 h-1.5 bg-yellow mx-auto rounded-full mb-6"></div>
          
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Meet the visionary leaders, keynotes, and industry pioneers taking the stage at Startup Summit Botswana 2026.
          </p>
        </motion.div>

        {/* Speakers Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10 max-w-7xl mx-auto">
          {SPEAKERS.map((speaker, index) => (
            <motion.div
              key={speaker.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className={`group relative bg-white rounded-3xl overflow-hidden shadow-xl border transition-all duration-300 hover:-translate-y-1.5 hover:shadow-2xl flex flex-col ${
                speaker.isKeynote 
                  ? 'border-yellow/50 ring-1 ring-yellow/30' 
                  : 'border-gray-100'
              }`}
            >
              {/* Speaker Header Image Banner */}
              <div className="relative h-80 sm:h-96 overflow-hidden bg-[#0A1322]">
                {/* Executive Studio Spotlight Background Backdrop */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_35%,_#1e3b8a_0%,_#0f1b2b_65%,_#070d17_100%)]"></div>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,_rgba(59,130,246,0.3)_0%,_transparent_65%)]"></div>

                <img 
                  src={speaker.image} 
                  alt={speaker.name}
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src !== window.location.origin + speaker.fallbackImage) {
                      target.src = speaker.fallbackImage;
                    }
                  }}
                  className="relative z-10 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 z-10 bg-gradient-to-t from-primary via-primary/20 to-transparent"></div>
                
                {/* Badge Overlay */}
                <div className="absolute top-4 left-4 z-10">
                  {speaker.isKeynote ? (
                    <span className="inline-flex items-center gap-1.5 bg-yellow text-primary font-extrabold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg border border-yellow-300">
                      <Sparkles className="w-3.5 h-3.5 fill-primary" />
                      Keynote Speaker
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-accent text-white font-extrabold text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-full shadow-lg border border-accent/30">
                      <Award className="w-3.5 h-3.5" />
                      Speaker
                    </span>
                  )}
                </div>
              </div>

              {/* Speaker Details */}
              <div className="p-8 flex-1 flex flex-col justify-between -mt-8 relative z-20 bg-white rounded-t-3xl">
                <div>
                  <h3 className="text-2xl md:text-3xl font-display font-bold text-primary mb-2 group-hover:text-accent transition-colors">
                    {speaker.name}
                  </h3>

                  <div className="flex items-start gap-2.5 text-gray-700 font-semibold mb-3 leading-snug">
                    <Briefcase className="w-4 h-4 text-accent shrink-0 mt-1" />
                    <span>{speaker.role}</span>
                  </div>

                  {speaker.company && (
                    <div className="inline-flex items-center gap-2 bg-gray-100 text-primary font-bold text-sm px-3 py-1 rounded-lg mb-4">
                      <Building2 className="w-4 h-4 text-accent" />
                      <span>{speaker.company}</span>
                    </div>
                  )}

                  <p className="text-gray-600 text-sm leading-relaxed mt-2 text-justify">
                    {speaker.bio}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
