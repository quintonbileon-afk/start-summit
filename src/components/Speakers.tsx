import { motion } from 'motion/react';
import { Mic, ArrowRight } from 'lucide-react';

export function Speakers() {
  return (
    <section id="speakers" className="py-24 bg-gray-50 text-primary relative overflow-hidden">
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
      
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-xl -rotate-6 hover:rotate-0 transition-transform duration-300">
            <Mic className="w-8 h-8" />
          </div>
          
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Speakers <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-yellow">TBA</span></h2>
          <div className="w-20 h-2 bg-yellow mx-auto rounded-full mb-8"></div>
          
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            We are currently curating an incredible lineup of visionary founders, industry pioneers, and policymakers who are shaping the future of Botswana's economy.
          </p>
          
          <div className="bg-white p-8 md:p-10 rounded-3xl shadow-lg border border-gray-100 max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-3">Want to share your expertise?</h3>
            <p className="text-gray-500 mb-8">
              We are looking for thought leaders to lead keynotes, fireside chats, and panel discussions.
            </p>
            <a 
              href="mailto:admin@startupsummit.co.bw?subject=Speaker%20Application%20-%20Startup%20Summit%20Botswana"
              className="inline-flex items-center justify-center gap-2 bg-primary hover:bg-primary-light text-white font-bold py-4 px-8 rounded-xl transition-all hover:scale-105 active:scale-95 shadow-md group"
            >
              Apply to Speak
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
