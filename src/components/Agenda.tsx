import { useState, ReactNode } from 'react';
import { motion } from 'motion/react';
import { 
  Users, Mic, Music, Award, Calendar, MapPin, Clock, Trophy, 
  Layers, Check, Sparkles, Briefcase, Play, Ticket, AlertCircle
} from 'lucide-react';

interface AgendaItem {
  time: string;
  title: string;
  duration: string;
  icon: ReactNode;
  highlighted?: boolean;
  highlightText?: string;
  desc?: string;
}

interface AgendaPhase {
  title: string;
  timeRange: string;
  items: AgendaItem[];
}

export function Agenda() {
  const [viewMode, setViewMode] = useState<'landscape' | 'timeline'>('landscape');

  const summitDetails = {
    theme: "Building Botswana's Startup Ecosystem for Sustainable Economic Transformation",
    date: "Friday, 7 August 2026",
    venue: "Game City Lifestyle Centre, Gaborone",
    mission: "Identify the structural barriers facing Botswana startups and produce practical recommendations to Government and stakeholders under the Botswana Economic Transformation Programme (BETP)."
  };

  const phases: AgendaPhase[] = [
    {
      title: "Morning Kickoff & Keynotes",
      timeRange: "08:00 – 10:40",
      items: [
        { 
          time: "08:00 – 09:00", 
          title: "Registration, Networking & Exhibition", 
          duration: "60 min", 
          icon: <Users className="w-4 h-4 text-accent" />,
          desc: "Collect delegate badges, explore the startups showcase, and connect over morning refreshments."
        },
        { 
          time: "09:00 – 09:15", 
          title: "Welcome Remarks", 
          duration: "15 min", 
          icon: <Mic className="w-4 h-4 text-accent" />,
          desc: "Opening address by the summit organizers to frame the day's initiatives."
        },
        { 
          time: "09:15 – 09:20", 
          title: "Entertainment Interlude", 
          duration: "5 min", 
          icon: <Music className="w-4 h-4 text-accent" /> 
        },
        { 
          time: "09:20 – 09:35", 
          title: "Minister's Keynote Address (BETP)", 
          duration: "15 min", 
          icon: <Award className="w-4 h-4 text-yellow" />,
          highlighted: true,
          highlightText: "Minister's Keynote",
          desc: "Keynote regarding national policies under the Botswana Economic Transformation Programme."
        },
        { 
          time: "09:35 – 09:40", 
          title: "Entertainment", 
          duration: "5 min", 
          icon: <Music className="w-4 h-4 text-accent" /> 
        },
        { 
          time: "09:40 – 09:55", 
          title: "Keynote Address 2", 
          duration: "15 min", 
          icon: <Mic className="w-4 h-4 text-accent" />,
          desc: "Expert industry insights on regional technology ecosystem scaling."
        },
        { 
          time: "09:55 – 10:10", 
          title: "Motivational Speaker – Property Investor", 
          duration: "15 min", 
          icon: <Sparkles className="w-4 h-4 text-accent" />,
          desc: "Lessons on investment strategies, risk management, and capital generation."
        },
        { 
          time: "10:10 – 10:25", 
          title: "Strategic Partner Address", 
          duration: "15 min", 
          icon: <Briefcase className="w-4 h-4 text-accent" /> 
        },
        { 
          time: "10:25 – 10:40", 
          title: "Strategic Partner Address", 
          duration: "15 min", 
          icon: <Briefcase className="w-4 h-4 text-accent" /> 
        }
      ]
    },
    {
      title: "Midday Panels & Markets",
      timeRange: "10:40 – 13:00",
      items: [
        { 
          time: "10:40 – 11:10", 
          title: "Exhibition Tour & Networking", 
          duration: "30 min", 
          icon: <Users className="w-4 h-4 text-accent" />,
          desc: "Interact directly with startup founders and view groundbreaking product demos."
        },
        { 
          time: "11:10 – 11:55", 
          title: "Panel: Why Do So Many Botswana Startups Fail, and What Must Change?", 
          duration: "45 min", 
          icon: <Users className="w-4 h-4 text-yellow" />,
          highlighted: true,
          highlightText: "Panel Discussion",
          desc: "A hard-hitting panel addressing regulatory, financial, and structural constraints facing founders."
        },
        { 
          time: "11:55 – 13:00", 
          title: "Topic 1: Market Access & Business Growth", 
          duration: "65 min", 
          icon: <Layers className="w-4 h-4 text-yellow" />,
          highlighted: true,
          highlightText: "Market Access",
          desc: "Actionable frameworks for regional trade, international market penetration, and corporate partnerships."
        }
      ]
    },
    {
      title: "Afternoon Finance & Stories",
      timeRange: "13:00 – 15:45",
      items: [
        { 
          time: "13:00 – 14:00", 
          title: "Lunch & Networking", 
          duration: "60 min", 
          icon: <Clock className="w-4 h-4 text-accent" />,
          desc: "Catered luncheon with allocated tables for founders and active venture funds."
        },
        { 
          time: "14:00 – 14:45", 
          title: "Topic 2: Access to Finance", 
          duration: "45 min", 
          icon: <Briefcase className="w-4 h-4 text-yellow" />,
          highlighted: true,
          highlightText: "Access to Finance",
          desc: "Demystifying capital-raising, angel syndicates, venture capital parameters, and local credit lines."
        },
        { 
          time: "14:45 – 15:30", 
          title: "Botswana Startup Success Stories", 
          duration: "45 min", 
          icon: <Play className="w-4 h-4 text-yellow" />,
          highlighted: true,
          highlightText: "Startup Stories",
          desc: "Inspirational case studies of homegrown success models scaling outside Botswana."
        },
        { 
          time: "15:30 – 15:45", 
          title: "Tea Break", 
          duration: "15 min", 
          icon: <Clock className="w-4 h-4 text-accent" /> 
        }
      ]
    },
    {
      title: "Pitching, Awards & Closing",
      timeRange: "15:45 – 18:00",
      items: [
        { 
          time: "15:45 – 16:45", 
          title: "National Startup Pitch Competition", 
          duration: "60 min", 
          icon: <Trophy className="w-4 h-4 text-yellow" />,
          highlighted: true,
          highlightText: "Pitch Competition",
          desc: "Selected innovative startups pitch live in front of a feedback-driven investor panel."
        },
        { 
          time: "16:45 – 17:15", 
          title: "Prize Giving", 
          duration: "30 min", 
          icon: <Trophy className="w-4 h-4 text-accent" /> 
        },
        { 
          time: "17:15 – 17:30", 
          title: "Botswana Startup Declaration 2026", 
          duration: "15 min", 
          icon: <Check className="w-4 h-4 text-accent" />,
          desc: "Unveiling the official policy recommendation declaration formulated by stakeholders."
        },
        { 
          time: "17:30 – 17:45", 
          title: "Closing Remarks", 
          duration: "15 min", 
          icon: <Mic className="w-4 h-4 text-accent" /> 
        },
        { 
          time: "17:45 – 18:00", 
          title: "Networking & Official Close", 
          duration: "15 min", 
          icon: <Users className="w-4 h-4 text-accent" /> 
        }
      ]
    }
  ];

  // Flattened version of the items for simple linear timeline
  const allItems = phases.reduce<AgendaItem[]>((acc, phase) => [...acc, ...phase.items], []);

  return (
    <section id="agenda" className="py-24 bg-white dark:bg-primary text-primary dark:text-white transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        
        {/* Title and Summit Metadata */}
        <div className="text-center mb-16 relative">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-accent dark:text-accent font-bold uppercase tracking-widest text-xs px-4 py-1.5 rounded-full bg-accent/5 dark:bg-accent/10 border border-accent/15 inline-block mb-4">
              Official Summit Agenda
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-extrabold mb-6 tracking-tight">
              START-UP SUMMIT BOTSWANA 2026
            </h2>
            <div className="w-24 h-1.5 bg-yellow mx-auto rounded-full mb-8"></div>
          </motion.div>

          {/* Summit Metadata Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="bg-primary/5 dark:bg-primary-light/40 border border-primary/10 dark:border-white/10 rounded-3xl p-6 md:p-8 max-w-4xl mx-auto backdrop-blur-sm text-left shadow-lg relative overflow-hidden"
          >
            <div className="absolute right-0 top-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none" />
            
            <div className="grid md:grid-cols-12 gap-6 items-center">
              <div className="md:col-span-8 space-y-4">
                <div>
                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-white/40">Theme</h4>
                  <p className="text-lg md:text-xl font-bold font-display text-primary dark:text-white mt-1 leading-snug">
                    "{summitDetails.theme}"
                  </p>
                </div>
              </div>

              <div className="md:col-span-4 border-t md:border-t-0 md:border-l border-primary/10 dark:border-white/10 pt-4 md:pt-0 md:pl-6 space-y-3.5">
                <div className="flex items-center gap-3 text-sm font-semibold text-primary/80 dark:text-white/80">
                  <Calendar className="w-4.5 h-4.5 text-accent shrink-0" />
                  <span>{summitDetails.date}</span>
                </div>
                <div className="flex items-start gap-3 text-sm font-semibold text-primary/80 dark:text-white/80">
                  <MapPin className="w-4.5 h-4.5 text-accent shrink-0 mt-0.5" />
                  <span>{summitDetails.venue}</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-primary/5 dark:bg-primary-light/50 border border-primary/10 dark:border-white/15 p-1.5 rounded-2xl flex gap-1.5 shadow-inner">
            <button
              onClick={() => setViewMode('landscape')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === 'landscape'
                  ? 'bg-accent text-white shadow-md'
                  : 'text-primary/60 dark:text-white/60 hover:text-primary dark:hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Landscape Grid
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                viewMode === 'timeline'
                  ? 'bg-accent text-white shadow-md'
                  : 'text-primary/60 dark:text-white/60 hover:text-primary dark:hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              Chronological List
            </button>
          </div>
        </div>

        {/* Landscape Grid View */}
        {viewMode === 'landscape' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
            {phases.map((phase, pIdx) => (
              <motion.div
                key={pIdx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: pIdx * 0.1 }}
                className="flex flex-col h-full bg-primary/5 dark:bg-primary-light/30 border border-primary/10 dark:border-white/5 rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent to-accent/40" />
                <div className="mb-4">
                  <h3 className="font-display font-extrabold text-base text-primary dark:text-white leading-tight">
                    {phase.title}
                  </h3>
                  <div className="flex items-center gap-1.5 text-xs text-accent dark:text-accent font-semibold mt-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{phase.timeRange}</span>
                  </div>
                </div>

                <div className="space-y-3.5 flex-1">
                  {phase.items.map((item, iIdx) => (
                    <div 
                      key={iIdx}
                      className={`p-3.5 rounded-2xl border transition-all duration-300 relative group flex flex-col justify-between min-h-[96px] ${
                        item.highlighted 
                          ? 'bg-yellow/10 dark:bg-yellow/10 border-yellow/45 shadow-md shadow-yellow/5 scale-[1.02]' 
                          : 'bg-white dark:bg-primary-light/40 border-gray-100 dark:border-white/5 hover:border-accent/30'
                      }`}
                    >
                      {item.highlighted && (
                        <div className="absolute -top-2.5 right-3 bg-yellow text-primary font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                          {item.highlightText}
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-1.5">
                          <span className="text-[10px] font-bold font-mono text-gray-400 dark:text-white/40">
                            {item.time} ({item.duration})
                          </span>
                          <span className="shrink-0">{item.icon}</span>
                        </div>
                        <h4 className={`text-xs font-bold leading-snug transition-colors group-hover:text-accent ${
                          item.highlighted ? 'text-yellow' : 'text-primary dark:text-white'
                        }`}>
                          {item.title}
                        </h4>
                      </div>

                      {item.desc && (
                        <p className="text-[10px] text-gray-500 dark:text-white/55 mt-2 leading-relaxed border-t border-primary/5 dark:border-white/5 pt-1.5">
                          {item.desc}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Chronological list layout */
          <div className="max-w-4xl mx-auto relative border-l-4 border-gray-100 dark:border-white/10 ml-4 md:ml-12 pl-6 md:pl-10 space-y-8">
            {allItems.map((item, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                className="relative group"
              >
                {/* Timeline Icon */}
                <div className={`absolute w-12 h-12 rounded-full flex items-center justify-center -left-[50px] md:-left-[66px] top-3 ring-4 ring-white dark:ring-primary shadow-sm group-hover:shadow-lg group-hover:scale-110 transition-all duration-300 z-10 ${
                  item.highlighted 
                    ? 'bg-yellow text-primary' 
                    : 'bg-gray-50 dark:bg-primary-light text-gray-400 dark:text-white/60 group-hover:bg-accent group-hover:text-white'
                }`}>
                  {item.icon}
                </div>

                {/* Event Card */}
                <div className={`p-5 md:p-6 rounded-2xl border backdrop-blur-sm shadow-sm group-hover:shadow-xl group-hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row md:items-start gap-4 md:gap-6 relative overflow-hidden ${
                  item.highlighted 
                    ? 'bg-yellow/5 dark:bg-yellow/10 border-yellow/30' 
                    : 'bg-white dark:bg-primary-light/30 border-gray-100 dark:border-white/5 hover:border-accent/25'
                }`}>
                  {/* Subtle gradient hover background */}
                  <div className="absolute inset-0 bg-gradient-to-r from-accent/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                  
                  <div className="shrink-0 flex flex-col gap-1 w-max md:w-32">
                    <span className={`inline-block px-3 py-1.5 text-center font-bold text-xs rounded-xl transition-colors duration-300 ${
                      item.highlighted 
                        ? 'bg-yellow text-primary font-extrabold' 
                        : 'bg-primary/5 dark:bg-white/10 group-hover:bg-accent/10 group-hover:text-accent text-primary dark:text-white'
                    }`}>
                      {item.time}
                    </span>
                    <span className="text-[10px] font-mono text-gray-400 dark:text-white/40 text-center md:text-left">
                      Duration: {item.duration}
                    </span>
                  </div>
                  
                  <div className="relative z-10 flex-1">
                    {item.highlighted && (
                      <span className="inline-block bg-yellow/20 text-yellow text-[9px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-1.5">
                        {item.highlightText}
                      </span>
                    )}
                    <h3 className={`text-xl font-bold transition-colors duration-300 ${
                      item.highlighted ? 'text-yellow' : 'text-primary dark:text-white group-hover:text-accent'
                    }`}>
                      {item.title}
                    </h3>
                    <p className="text-gray-500 dark:text-white/65 text-sm mt-1 leading-relaxed">
                      {item.desc || "Networking and collaborative peer breakout sessions session."}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Panel Mission & Footer Highlight */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mt-16 bg-accent/5 dark:bg-accent/10 border border-accent/20 rounded-3xl p-6 md:p-8 max-w-4xl mx-auto flex gap-4 md:gap-6 items-start"
        >
          <div className="p-3 bg-accent/10 dark:bg-accent/20 text-accent rounded-2xl shrink-0 mt-0.5">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-display font-bold text-base text-primary dark:text-white mb-2">Panel Mission Statement</h4>
            <p className="text-sm text-gray-600 dark:text-white/75 leading-relaxed font-medium">
              {summitDetails.mission}
            </p>
          </div>
        </motion.div>

      </div>
    </section>
  );
}

