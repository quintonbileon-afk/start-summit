import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, CheckCircle2, Loader2 } from 'lucide-react';

interface SpeakerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SpeakerModal({ isOpen, onClose }: SpeakerModalProps) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    role: '',
    company: '',
    topic: '',
    bio: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/speaker-apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit application');
      }

      setIsSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary/80 backdrop-blur-sm overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden my-8"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-white/70 hover:text-white transition-colors z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="bg-primary p-8 text-center text-white relative">
              <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                <Mic className="w-8 h-8 text-yellow" />
              </div>
              <h3 className="font-display font-bold text-3xl mb-2">Apply to Speak</h3>
              <p className="text-white/80">Share your expertise with Botswana's startup ecosystem.</p>
            </div>

            <div className="p-8">
              {isSuccess ? (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle2 className="w-10 h-10" />
                  </motion.div>
                  <h4 className="text-2xl font-bold text-primary mb-2">Application Received!</h4>
                  <p className="text-gray-600 mb-8">
                    Thank you for your interest in speaking at the Startup Summit. Our team will review your application and get back to you soon.
                  </p>
                  <button
                    onClick={onClose}
                    className="bg-primary hover:bg-primary-light text-white font-bold py-3 px-8 rounded-xl transition-all"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium">
                      {error}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-primary mb-1">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        required
                        value={formData.fullName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                        placeholder="Jane Doe"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-primary mb-1">Email Address *</label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                        placeholder="jane@example.com"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-primary mb-1">Role / Title *</label>
                      <input
                        type="text"
                        name="role"
                        required
                        value={formData.role}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                        placeholder="CEO"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-primary mb-1">Company / Organization *</label>
                      <input
                        type="text"
                        name="company"
                        required
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                        placeholder="Tech Corp"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-primary mb-1">Proposed Topic / Talk Title *</label>
                    <input
                      type="text"
                      name="topic"
                      required
                      value={formData.topic}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                      placeholder="The Future of AI in African Startups"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-primary mb-1">Short Bio *</label>
                    <textarea
                      name="bio"
                      required
                      rows={4}
                      value={formData.bio}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent resize-none"
                      placeholder="Briefly describe your background and expertise..."
                    ></textarea>
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-yellow hover:bg-yellow/90 text-primary font-bold py-4 px-8 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        'Submit Application'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
