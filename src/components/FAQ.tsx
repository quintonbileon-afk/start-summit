import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export function FAQ() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      question: "Who is eligible to participate?",
      answer: "Entrepreneurs, startup founders, investors, corporate leaders, policymakers, academic researchers, and anyone passionate about driving innovation in Botswana are welcome."
    },
    {
      question: "Are there tickets required, and what's the cost?",
      answer: "Yes, registration is mandatory. We offer different tiers—including Student, General Delegate, Exhibitor, and Partner/Sponsor. Choose the correct category on our Registration form."
    },
    {
      question: "How can I register as a sponsor or partner?",
      answer: "We offer several partnership tiers (Platinum, Gold, Silver, and Media). Select the 'Sponsor / Partner' category in the registration section to submit your details."
    },
    {
      question: "Can I showcase or exhibit my products/services?",
      answer: "Absolutely! We have dedicated exhibition booths. When registering, select the 'Exhibitor' option and specify your exhibition needs and category."
    },
    {
      question: "What is the primary venue for the event?",
      answer: "The Botswana Startup Summit will be held at the Game City Lifestyle Center in Gaborone, featuring state-of-the-art presentation stages and networking arenas."
    },
    {
      question: "Will certificates or digital passes be issued?",
      answer: "Yes, upon successful registration, your digital summit ticket/badge will be automatically generated with your registration category to present at check-in."
    }
  ];

  const toggleAccordion = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-16 bg-white text-primary relative overflow-hidden border-t border-gray-100">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-12"
        >
          <span className="inline-block px-4 py-1.5 bg-accent/10 text-accent font-bold text-xs uppercase tracking-widest rounded-full mb-4">
            Got Questions?
          </span>
          <h2 className="text-3xl md:text-4xl font-display font-bold mb-4">Frequently Asked Questions</h2>
          <div className="w-16 h-1 bg-yellow mx-auto rounded-full"></div>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-4 lg:gap-6 items-start">
          {faqs.map((faq, idx) => {
            const isOpen = activeIndex === idx;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="bg-gray-50 rounded-xl border border-gray-100 hover:border-accent/30 hover:shadow-sm transition-all overflow-hidden"
              >
                <button
                  id={`faq-btn-${idx}`}
                  onClick={() => toggleAccordion(idx)}
                  className="w-full flex items-center justify-between p-5 text-left transition-colors focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="font-semibold text-base md:text-lg text-primary pr-4">
                    {faq.question}
                  </span>
                  <span className={`shrink-0 p-1.5 bg-white text-gray-400 rounded-full shadow-sm transition-transform duration-300 ${isOpen ? 'rotate-180 text-accent ring-1 ring-accent/20' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
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
                      <div className="px-5 pb-5 text-gray-600 text-sm md:text-base leading-relaxed">
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
