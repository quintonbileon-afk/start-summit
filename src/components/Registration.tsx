import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';
import { RegistrationData } from '../types';
import { db, collection, addDoc, serverTimestamp, handleFirestoreError, OperationType } from '../firebase';

interface RegistrationProps {
  onSuccess: (data: RegistrationData) => void;
}

export function Registration({ onSuccess }: RegistrationProps) {
  const [formData, setFormData] = useState<RegistrationData>({
    fullName: '',
    company: '',
    role: '',
    physicalAddress: '',
    mobileNumber: '',
    email: '',
    registrationType: 'attendant',
    participantCategory: '',
    businessSector: '',
    ticketOption: '',
    specialRequirements: '',
    declarationAccepted: false,
    website: '',
    exhibitorCategory: '',
    productsExhibited: '',
    exhibitionRequirements: [],
    partnershipCategory: '',
    partnershipInterest: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof RegistrationData, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const validate = () => {
    const newErrors: Partial<Record<keyof RegistrationData, string>> = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Contact Person / Full Name is required';
    if (!formData.company.trim()) newErrors.company = 'Organization/Business Name is required';
    if (!formData.role.trim()) newErrors.role = 'Position/Title is required';
    if (!formData.physicalAddress.trim()) newErrors.physicalAddress = 'Physical Address is required';
    if (!formData.mobileNumber.trim()) newErrors.mobileNumber = 'Mobile Number is required';
    if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) newErrors.email = 'Valid Email is required';
    
    if (formData.registrationType === 'attendant') {
      if (!formData.participantCategory) newErrors.participantCategory = 'Participant Category is required';
      if (!formData.businessSector.trim()) newErrors.businessSector = 'Business Sector / Area of Interest is required';
      if (!formData.ticketOption) newErrors.ticketOption = 'Ticket Option is required';
    } else if (formData.registrationType === 'exhibitor') {
      if (!formData.exhibitorCategory) newErrors.exhibitorCategory = 'Exhibitor Category is required';
      if (!formData.businessSector.trim()) newErrors.businessSector = 'Business Sector is required';
      if (!formData.productsExhibited.trim()) newErrors.productsExhibited = 'Products / Services to be Exhibited is required';
    } else if (formData.registrationType === 'partner') {
      if (!formData.partnershipCategory) newErrors.partnershipCategory = 'Partnership Category is required';
      if (!formData.partnershipInterest.trim()) newErrors.partnershipInterest = 'Partnership Interest is required';
    }

    if (!formData.declarationAccepted) newErrors.declarationAccepted = 'You must certify the information and agree to participate';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      setIsSubmitting(true);
      setSubmitError(null);
      try {
        const ticketId = `SSB26-${formData.fullName.replace(/\s+/g, '').substring(0, 5).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const regDataToSave = {
          ...formData,
          ticketId,
          checkedIn: false,
          paymentStatus: (formData.registrationType === 'partner' ? 'free' : 'pending') as 'pending' | 'free' | 'verified',
          paymentReference: '',
          submittedAt: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, 'registrations'), regDataToSave);
        const savedData = {
          ...regDataToSave,
          id: docRef.id
        };

        // Trigger notification email dispatch non-blocking
        fetch('/api/send-registration-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(savedData),
        }).catch(emailError => console.warn('Silent email failure:', emailError));

        onSuccess(savedData);
      } catch (error) {
        console.error('Registration save error:', error);
        setSubmitError('Failed to save registration to the database. Please check your internet connection and try again.');
        handleFirestoreError(error, OperationType.CREATE, 'registrations');
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <section id="register" className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary-light/50 skew-y-3 origin-bottom-left -z-10 transform translate-y-12"></div>
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-display font-bold mb-6">Secure Your Spot</h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Join the movement to transform Botswana's economy. Register now to attend, exhibit, or partner with us.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-3xl p-8 md:p-12 shadow-2xl text-primary"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Registration Type Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-xl mb-8">
              {(['attendant', 'exhibitor', 'partner'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setFormData({ ...formData, registrationType: type })}
                  className={`flex-1 py-3 text-sm font-semibold rounded-lg capitalize transition-all ${
                    formData.registrationType === type 
                      ? 'bg-white shadow-sm text-accent' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.fullName ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all`}
                  placeholder="Jane Doe"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Organization/Business Name</label>
                <input
                  type="text"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.company ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all`}
                  placeholder="Acme Corp"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                />
                {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Position/Title</label>
                <input
                  type="text"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.role ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all bg-white`}
                  placeholder="CEO, Founder, etc."
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                />
                {errors.role && <p className="text-red-500 text-xs mt-1">{errors.role}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Physical Address</label>
                <input
                  type="text"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.physicalAddress ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all`}
                  placeholder="123 Main St, Gaborone"
                  value={formData.physicalAddress}
                  onChange={(e) => setFormData({ ...formData, physicalAddress: e.target.value })}
                />
                {errors.physicalAddress && <p className="text-red-500 text-xs mt-1">{errors.physicalAddress}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mobile Number</label>
                <input
                  type="tel"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.mobileNumber ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all`}
                  placeholder="+267 7000 0000"
                  value={formData.mobileNumber}
                  onChange={(e) => setFormData({ ...formData, mobileNumber: e.target.value })}
                />
                {errors.mobileNumber && <p className="text-red-500 text-xs mt-1">{errors.mobileNumber}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  className={`w-full px-4 py-3 rounded-xl border ${errors.email ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all`}
                  placeholder="jane@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>

              {formData.registrationType === 'attendant' && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Participant Category</label>
                    <select
                      className={`w-full px-4 py-3 rounded-xl border ${errors.participantCategory ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all bg-white`}
                      value={formData.participantCategory}
                      onChange={(e) => setFormData({ ...formData, participantCategory: e.target.value })}
                    >
                      <option value="" disabled>Select category</option>
                      <option value="Startup Founder / Entrepreneur">Startup Founder / Entrepreneur</option>
                      <option value="SME Owner">SME Owner</option>
                      <option value="Investor">Investor</option>
                      <option value="Student">Student</option>
                      <option value="Government">Government</option>
                      <option value="Corporate">Corporate</option>
                      <option value="Development Partner">Development Partner</option>
                      <option value="Exhibitor">Exhibitor</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.participantCategory && <p className="text-red-500 text-xs mt-1">{errors.participantCategory}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Business Sector / Area of Interest</label>
                    <textarea
                      className={`w-full px-4 py-3 rounded-xl border ${errors.businessSector ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all bg-white`}
                      placeholder="Briefly describe your sector or interests"
                      rows={2}
                      value={formData.businessSector}
                      onChange={(e) => setFormData({ ...formData, businessSector: e.target.value })}
                    ></textarea>
                    {errors.businessSector && <p className="text-red-500 text-xs mt-1">{errors.businessSector}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Ticket Options</label>
                    <div className="space-y-3">
                      <label className={`flex items-start p-4 rounded-xl border ${formData.ticketOption === 'standard' ? 'border-accent bg-accent/5' : 'border-gray-200 bg-white'} cursor-pointer transition-all`}>
                        <input 
                          type="radio" 
                          name="ticketOption" 
                          value="standard" 
                          checked={formData.ticketOption === 'standard'}
                          onChange={() => setFormData({ ...formData, ticketOption: 'standard' })}
                          className="mt-1 mr-3 text-accent focus:ring-accent"
                        />
                        <div>
                          <div className="font-bold text-gray-900">STANDARD TICKET – BWP 300</div>
                          <div className="text-sm text-gray-500 mt-1">Includes: Lunch Pack and Full Access to Conference Sessions.</div>
                        </div>
                      </label>
                      
                      <label className={`flex items-start p-4 rounded-xl border ${formData.ticketOption === 'starter' ? 'border-accent bg-accent/5' : 'border-gray-200 bg-white'} cursor-pointer transition-all`}>
                        <input 
                          type="radio" 
                          name="ticketOption" 
                          value="starter" 
                          checked={formData.ticketOption === 'starter'}
                          onChange={() => setFormData({ ...formData, ticketOption: 'starter' })}
                          className="mt-1 mr-3 text-accent focus:ring-accent"
                        />
                        <div>
                          <div className="font-bold text-gray-900">STARTER PACK – BWP 850</div>
                          <div className="text-sm text-gray-500 mt-1">Includes: Lunch Pack, Full Company Registration, Bank Account Opening, and Tax Clearance Certificate.</div>
                        </div>
                      </label>
                    </div>
                    {errors.ticketOption && <p className="text-red-500 text-xs mt-1">{errors.ticketOption}</p>}
                  </div>
                </>
              )}

              {formData.registrationType === 'exhibitor' && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Website (if any)</label>
                    <input
                      type="url"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Exhibitor Category</label>
                    <div className="space-y-3">
                      <label className={`flex items-center p-4 rounded-xl border ${formData.exhibitorCategory === 'SME EXHIBITOR' ? 'border-accent bg-accent/5' : 'border-gray-200 bg-white'} cursor-pointer transition-all`}>
                        <input 
                          type="radio" 
                          name="exhibitorCategory" 
                          value="SME EXHIBITOR" 
                          checked={formData.exhibitorCategory === 'SME EXHIBITOR'}
                          onChange={(e) => setFormData({ ...formData, exhibitorCategory: e.target.value })}
                          className="mr-3 text-accent focus:ring-accent"
                        />
                        <span className="font-bold text-gray-900">SME EXHIBITOR – BWP 1,500</span>
                      </label>
                      <label className={`flex items-center p-4 rounded-xl border ${formData.exhibitorCategory === 'GOVERNMENT AGENCY' ? 'border-accent bg-accent/5' : 'border-gray-200 bg-white'} cursor-pointer transition-all`}>
                        <input 
                          type="radio" 
                          name="exhibitorCategory" 
                          value="GOVERNMENT AGENCY" 
                          checked={formData.exhibitorCategory === 'GOVERNMENT AGENCY'}
                          onChange={(e) => setFormData({ ...formData, exhibitorCategory: e.target.value })}
                          className="mr-3 text-accent focus:ring-accent"
                        />
                        <span className="font-bold text-gray-900">GOVERNMENT AGENCY – BWP 30,000</span>
                      </label>
                      <label className={`flex items-center p-4 rounded-xl border ${formData.exhibitorCategory === 'CORPORATE EXHIBITOR' ? 'border-accent bg-accent/5' : 'border-gray-200 bg-white'} cursor-pointer transition-all`}>
                        <input 
                          type="radio" 
                          name="exhibitorCategory" 
                          value="CORPORATE EXHIBITOR" 
                          checked={formData.exhibitorCategory === 'CORPORATE EXHIBITOR'}
                          onChange={(e) => setFormData({ ...formData, exhibitorCategory: e.target.value })}
                          className="mr-3 text-accent focus:ring-accent"
                        />
                        <span className="font-bold text-gray-900">CORPORATE EXHIBITOR – BWP 30,000</span>
                      </label>
                    </div>
                    {errors.exhibitorCategory && <p className="text-red-500 text-xs mt-1">{errors.exhibitorCategory}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Business Sector</label>
                    <select
                      className={`w-full px-4 py-3 rounded-xl border ${errors.businessSector ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all bg-white`}
                      value={formData.businessSector}
                      onChange={(e) => setFormData({ ...formData, businessSector: e.target.value })}
                    >
                      <option value="" disabled>Select a sector</option>
                      <option value="Technology / ICT">Technology / ICT</option>
                      <option value="Agriculture">Agriculture</option>
                      <option value="Finance">Finance</option>
                      <option value="Manufacturing">Manufacturing</option>
                      <option value="Retail">Retail</option>
                      <option value="Professional Services">Professional Services</option>
                      <option value="Government">Government</option>
                      <option value="Other">Other</option>
                    </select>
                    {errors.businessSector && <p className="text-red-500 text-xs mt-1">{errors.businessSector}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Products / Services to be Exhibited</label>
                    <textarea
                      className={`w-full px-4 py-3 rounded-xl border ${errors.productsExhibited ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all bg-white`}
                      placeholder="Describe what you will exhibit"
                      rows={3}
                      value={formData.productsExhibited}
                      onChange={(e) => setFormData({ ...formData, productsExhibited: e.target.value })}
                    ></textarea>
                    {errors.productsExhibited && <p className="text-red-500 text-xs mt-1">{errors.productsExhibited}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Exhibition Requirements</label>
                    <div className="grid grid-cols-2 gap-4">
                      {['Electricity', 'Internet Connectivity', 'Table', 'Chairs'].map(req => (
                        <label key={req} className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={formData.exhibitionRequirements.includes(req)}
                            onChange={(e) => {
                              const newReqs = e.target.checked 
                                ? [...formData.exhibitionRequirements, req]
                                : formData.exhibitionRequirements.filter(r => r !== req);
                              setFormData({ ...formData, exhibitionRequirements: newReqs });
                            }}
                            className="mr-3 rounded text-accent focus:ring-accent"
                          />
                          <span className="text-gray-700">{req}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {formData.registrationType === 'partner' && (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Website (if any)</label>
                    <input
                      type="url"
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all"
                      placeholder="https://example.com"
                      value={formData.website}
                      onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Partnership Category</label>
                    <div className="space-y-3">
                      <label className={`flex items-center p-4 rounded-xl border ${formData.partnershipCategory === 'Platinum Sponsor' ? 'border-accent bg-accent/5' : 'border-gray-200 bg-white'} cursor-pointer transition-all`}>
                        <input 
                          type="radio" 
                          name="partnershipCategory" 
                          value="Platinum Sponsor" 
                          checked={formData.partnershipCategory === 'Platinum Sponsor'}
                          onChange={(e) => setFormData({ ...formData, partnershipCategory: e.target.value })}
                          className="mr-3 text-accent focus:ring-accent"
                        />
                        <span className="font-bold text-gray-900">Platinum Sponsor</span>
                      </label>
                      <label className={`flex items-center p-4 rounded-xl border ${formData.partnershipCategory === 'Gold Sponsor' ? 'border-accent bg-accent/5' : 'border-gray-200 bg-white'} cursor-pointer transition-all`}>
                        <input 
                          type="radio" 
                          name="partnershipCategory" 
                          value="Gold Sponsor" 
                          checked={formData.partnershipCategory === 'Gold Sponsor'}
                          onChange={(e) => setFormData({ ...formData, partnershipCategory: e.target.value })}
                          className="mr-3 text-accent focus:ring-accent"
                        />
                        <span className="font-bold text-gray-900">Gold Sponsor</span>
                      </label>
                      <label className={`flex items-center p-4 rounded-xl border ${formData.partnershipCategory === 'Silver Sponsor' ? 'border-accent bg-accent/5' : 'border-gray-200 bg-white'} cursor-pointer transition-all`}>
                        <input 
                          type="radio" 
                          name="partnershipCategory" 
                          value="Silver Sponsor" 
                          checked={formData.partnershipCategory === 'Silver Sponsor'}
                          onChange={(e) => setFormData({ ...formData, partnershipCategory: e.target.value })}
                          className="mr-3 text-accent focus:ring-accent"
                        />
                        <span className="font-bold text-gray-900">Silver Sponsor</span>
                      </label>
                      <label className={`flex items-center p-4 rounded-xl border ${formData.partnershipCategory === 'In-Kind / Media Partner' ? 'border-accent bg-accent/5' : 'border-gray-200 bg-white'} cursor-pointer transition-all`}>
                        <input 
                          type="radio" 
                          name="partnershipCategory" 
                          value="In-Kind / Media Partner" 
                          checked={formData.partnershipCategory === 'In-Kind / Media Partner'}
                          onChange={(e) => setFormData({ ...formData, partnershipCategory: e.target.value })}
                          className="mr-3 text-accent focus:ring-accent"
                        />
                        <span className="font-bold text-gray-900">In-Kind / Media Partner</span>
                      </label>
                    </div>
                    {errors.partnershipCategory && <p className="text-red-500 text-xs mt-1">{errors.partnershipCategory}</p>}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Partnership Interest / Contribution Details</label>
                    <textarea
                      className={`w-full px-4 py-3 rounded-xl border ${errors.partnershipInterest ? 'border-red-500' : 'border-gray-200'} focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all bg-white`}
                      placeholder="Briefly describe how you would like to partner with or sponsor the summit."
                      rows={4}
                      value={formData.partnershipInterest}
                      onChange={(e) => setFormData({ ...formData, partnershipInterest: e.target.value })}
                    ></textarea>
                    {errors.partnershipInterest && <p className="text-red-500 text-xs mt-1">{errors.partnershipInterest}</p>}
                  </div>
                </>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Special Requirements (Optional)</label>
                <textarea
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent transition-all bg-white"
                  placeholder="Any dietary requirements, accessibility needs, etc."
                  rows={2}
                  value={formData.specialRequirements}
                  onChange={(e) => setFormData({ ...formData, specialRequirements: e.target.value })}
                ></textarea>
              </div>

              <div className="md:col-span-2 pt-2">
                <label className="flex items-start cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={formData.declarationAccepted}
                    onChange={(e) => setFormData({ ...formData, declarationAccepted: e.target.checked })}
                    className="mt-1 mr-3 rounded text-accent focus:ring-accent"
                  />
                  <div className="text-sm text-gray-600">
                    <span className="font-bold block mb-1">Declaration</span>
                    I certify that the information provided is correct and I agree to participate in Start-UP Summit Botswana 2026.
                  </div>
                </label>
                {errors.declarationAccepted && <p className="text-red-500 text-xs mt-1 ml-7">{errors.declarationAccepted}</p>}
              </div>
            </div>

            {submitError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm font-semibold">
                {submitError}
              </div>
            )}

            <div className="pt-6">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-yellow hover:bg-yellow/90 disabled:opacity-75 disabled:cursor-not-allowed text-primary font-bold text-lg py-4 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-yellow/20 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Saving Registration...
                  </>
                ) : (
                  'Register'
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </section>
  );
}
