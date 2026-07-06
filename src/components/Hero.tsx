import { motion } from 'motion/react';
import { CalendarDays, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';

export function Hero() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const [typewriterIndex, setTypewriterIndex] = useState(0);

  useEffect(() => {
    const typeInterval = setInterval(() => {
      setTypewriterIndex(prev => prev < 60 ? prev + 1 : prev);
    }, 50);
    return () => clearInterval(typeInterval);
  }, []);

  const renderTypewriter = (text: string, startIdx: number, currentIdx: number) => {
    if (currentIdx <= startIdx) return "";
    return text.substring(0, currentIdx - startIdx);
  };

  useEffect(() => {
    // Target date: August 7, 2026
    const targetDate = new Date('2026-08-07T09:00:00').getTime();

    const updateTimer = () => {
      const now = new Date().getTime();
      const difference = targetDate - now;

      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((difference % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-[90vh] flex items-center justify-center pt-24 pb-12 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 bg-primary z-0 overflow-hidden">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-screen"
          src="/065545709dc6fc0d52fa4a4a90ac6964.mp4"
        >
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/70 to-transparent"></div>
        <div className="absolute top-20 left-10 w-72 h-72 bg-accent/20 rounded-full blur-[100px] mix-blend-screen"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-yellow/10 rounded-full blur-[120px] mix-blend-screen"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 flex flex-col items-center text-center">
        <div className="h-[160px] md:h-[180px] lg:h-[220px] mb-8 w-full flex items-center justify-center">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-4xl md:text-5xl lg:text-7xl font-display font-bold tracking-tight leading-tight w-full"
          >
            <span>{renderTypewriter("Is ", 0, typewriterIndex)}</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-300 italic font-extrabold pr-2 inline-block">
              {renderTypewriter("entrepreneurship", 3, typewriterIndex)}
            </span>
            {typewriterIndex > 19 && <br className="hidden md:block" />}
            <span>{renderTypewriter(" the answer to ", 19, typewriterIndex)}</span>
            {typewriterIndex > 34 && <br className="md:hidden" />}
            <span className="text-yellow relative inline-block">
              {renderTypewriter("Botswana's", 34, typewriterIndex)}
              {typewriterIndex >= 44 && <span className="absolute -bottom-2 left-0 w-full h-1 bg-yellow/50 rounded-full"></span>}
            </span>
            <span>{renderTypewriter(" unemployment", 44, typewriterIndex)}</span>
            {typewriterIndex > 57 ? (
              <span className="animate-blink">?</span>
            ) : (
              <span className="animate-blink opacity-70 ml-1">|</span>
            )}
          </motion.h1>
        </div>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="max-w-2xl text-lg md:text-xl text-white/80 mb-12"
        >
          Transforming Botswana's Economy Through Innovation & Entrepreneurship. Join the ecosystem builders.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row items-center gap-6 mb-12"
        >
          <div className="flex items-center gap-3 text-yellow font-semibold text-lg bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-sm">
            <CalendarDays className="w-6 h-6" />
            AUG 7, 2026
          </div>
          <div className="flex items-center gap-3 text-white font-semibold text-lg bg-white/5 px-6 py-3 rounded-2xl border border-white/10 backdrop-blur-sm">
            <MapPin className="w-6 h-6 text-accent" />
            Game City Lifestyle Center
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex items-center gap-2 sm:gap-4 md:gap-8 mb-12 bg-white/5 border border-white/10 p-4 sm:p-6 rounded-3xl backdrop-blur-md"
        >
          <div className="flex flex-col items-center w-16 sm:w-20">
            <span className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-1">{timeLeft.days}</span>
            <span className="text-accent text-[10px] sm:text-xs font-semibold uppercase tracking-widest">Days</span>
          </div>
          <div className="text-2xl sm:text-3xl text-white/30 font-light pb-4">:</div>
          <div className="flex flex-col items-center w-16 sm:w-20">
            <span className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-1">{timeLeft.hours.toString().padStart(2, '0')}</span>
            <span className="text-accent text-[10px] sm:text-xs font-semibold uppercase tracking-widest">Hours</span>
          </div>
          <div className="text-2xl sm:text-3xl text-white/30 font-light pb-4">:</div>
          <div className="flex flex-col items-center w-16 sm:w-20">
            <span className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-1">{timeLeft.minutes.toString().padStart(2, '0')}</span>
            <span className="text-accent text-[10px] sm:text-xs font-semibold uppercase tracking-widest">Mins</span>
          </div>
          <div className="text-2xl sm:text-3xl text-white/30 font-light pb-4">:</div>
          <div className="flex flex-col items-center w-16 sm:w-20">
            <span className="text-3xl sm:text-4xl md:text-5xl font-display font-bold text-white mb-1">{timeLeft.seconds.toString().padStart(2, '0')}</span>
            <span className="text-accent text-[10px] sm:text-xs font-semibold uppercase tracking-widest">Secs</span>
          </div>
        </motion.div>

        <motion.a 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          href="#register"
          className="bg-accent hover:bg-accent/90 text-white font-bold text-lg md:text-xl py-4 px-10 rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]"
        >
          Register Now
        </motion.a>
      </div>
    </section>
  );
}
