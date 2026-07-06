import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown, HelpCircle } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "Who is eligible to participate in the summit?",
      answer: "Entrepreneurs, startup founders, local and international investors, corporate leaders, policymakers, academic researchers, and anyone passionate about solving unemployment and driving innovation in Botswana are welcome to attend."
    },
    {
      question: "Are there tickets required, and how much do they cost?",
      answer: "Yes, registration is mandatory to attend the summit. We offer different tiers—including Student, General Delegate, Exhibitor, and Partner/Sponsor. Choose the correct registration category on our Registration form to secure your customized digital summit ticket."
    },
    {
      question: "How can I register as a sponsor or partner?",
      answer: "We offer several partnership tiers (Platinum, Gold, Silver, and In-Kind/Media). You can select the 'Sponsor / Partner' category in the registration section below to submit your details. Our coordination team will get in touch with you immediately to discuss the contribution details."
    },
    {
      question: "Can I showcase or exhibit my products/services?",
      answer: "Absolutely! We have dedicated exhibition booths for startups and organizations at the Game City Lifestyle Center. When registering, select the 'Exhibitor' option and specify your exhibition needs and category."
    },
    {
      question: "What is the primary venue for the event?",
      answer: "The Botswana Startup Summit will be held at the Game City Lifestyle Center in Gaborone, Botswana. It features state-of-the-art presentation stages and networking arenas."
    },
    {
      question: "Will certificates or digital passes be issued?",
      answer: "Yes, upon successful registration, your digital summit ticket/badge will be automatically generated with your registration category (e.g., Exhibitor, Sponsor, Delegate) and details, which can be presented at the check-in counters."
    }
  ];

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-gray-50 text-primary relative overflow-hidden border-t border-b border-gray-100">
      {/* Decorative subtle background accents */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
      
      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent font-bold text-xs uppercase tracking-widest rounded-full mb-4">
            Got Questions?
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Frequently Asked Questions</h2>
          <div className="w-20 h-2 bg-yellow mx-auto rounded-full"></div>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = activeIndex === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 hover:border-accent/30 hover:shadow-sm transition-all overflow-hidden"
              >
                <button
                  id={`faq-btn-${idx}`}
                  onClick={() => toggleAccordion(idx)}
                  className="w-full flex items-center justify-between p-6 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-accent/20"
                  aria-expanded={isOpen}
                >
                  <div className="flex items-center gap-4 pr-4">
                    <span className="shrink-0 p-2 bg-accent/5 text-accent rounded-lg">
                      <HelpCircle className="w-5 h-5" />
                    </span>
                    <span className="font-bold text-lg md:text-xl text-primary leading-snug">
                      {faq.question}
                    </span>
                  </div>
                  <span className={`shrink-0 p-2 bg-gray-50 text-gray-400 rounded-full transition-transform duration-300 ${isOpen ? 'rotate-180 text-accent bg-accent/5' : ''}`}>
                    <ChevronDown className="w-5 h-5" />
                  </span>
                </button>

                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className="px-6 pb-6 pt-2 ml-14 border-t border-gray-50 text-gray-600 leading-relaxed text-base md:text-lg">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
