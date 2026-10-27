import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api/client';
import { useToast } from '../context/ToastContext';

export const ContactUs: React.FC = () => {
  const { success, error: toastError } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
    if (errorMessage) setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    // Basic frontend validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setErrorMessage('Please fill in your name, email, and message.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/enquiries', formData);
      if (res.data?.success) {
        setSuccessMessage(res.data.message || 'Your inquiry has been stored in MongoDB. Our team will contact you shortly!');
        success('Inquiry submitted successfully!');
        setFormData({
          name: '',
          email: '',
          phone: '',
          subject: '',
          message: '',
        });
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to submit inquiry. Please try again.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ff6a00] mb-3">
            <Mail className="w-4 h-4 fill-[#ff6a00]" />
            Direct Communication
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl font-black uppercase tracking-tight text-white">
            Connect With Our Team
          </h1>
          <p className="text-neutral-400 mt-4 text-base leading-relaxed">
            Have questions about memberships, personal coaching, or scheduling a facility tour? Send us a message and our advisors will respond within 24 hours.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          
          {/* Contact Details & Info */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-8 rounded-2xl bg-[#121214] border border-neutral-800 space-y-6">
              <h3 className="font-heading text-2xl font-black uppercase text-white">
                FLEXI Athletic Club
              </h3>
              <p className="text-neutral-400 text-xs leading-relaxed">
                Located conveniently in the Metro Athletics District with private valet parking and direct transit connectivity.
              </p>

              <div className="space-y-4 pt-4 border-t border-neutral-800/80 text-xs">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[#ff6a00] shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-white font-bold uppercase tracking-wider font-heading">Address</div>
                    <div className="text-neutral-400 mt-0.5">442 Iron Avenue, Metro Athletics District, CA 90210</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[#ff6a00] shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-white font-bold uppercase tracking-wider font-heading">Phone Numbers</div>
                    <div className="text-neutral-400 mt-0.5">+1 (800) 555-FLEX (3539)</div>
                    <div className="text-neutral-400">+1 (555) 019-2834 (Front Desk)</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[#ff6a00] shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-white font-bold uppercase tracking-wider font-heading">Email Inquiries</div>
                    <div className="text-neutral-400 mt-0.5">membership@flexigym.com</div>
                    <div className="text-neutral-400">admin@flexigym.com</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-[#ff6a00] shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-white font-bold uppercase tracking-wider font-heading">Facility Hours</div>
                    <div className="text-neutral-400 mt-0.5">Mon - Fri: 5:00 AM - 11:00 PM</div>
                    <div className="text-neutral-400">Sat - Sun: 6:00 AM - 10:00 PM</div>
                    <div className="text-[#ff6a00] text-[11px] font-semibold mt-1">24/7 VIP keycard access for Pro & Elite tiers</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-2xl bg-[#121214] border border-neutral-800 shadow-2xl">
              <h2 className="font-heading text-3xl font-black uppercase text-white mb-2">
                Send An Enquiry
              </h2>
              <p className="text-neutral-400 text-xs mb-8">
                Your message is validated and persisted directly into the MongoDB `enquiries` collection.
              </p>

              {successMessage && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-400 mt-0.5" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="e.g. Michael Stone"
                      className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:border-[#ff6a00] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g. michael@example.com"
                      className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:border-[#ff6a00] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="e.g. +1 (555) 012-3456"
                      className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:border-[#ff6a00] transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      placeholder="e.g. Personal Training Consultation"
                      className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:border-[#ff6a00] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                    Message Details *
                  </label>
                  <textarea
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Tell us about your fitness background and what goals you want to accomplish..."
                    className="w-full px-4 py-3 rounded-xl bg-neutral-900 border border-neutral-800 text-white text-sm focus:outline-none focus:border-[#ff6a00] transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-4 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white font-black uppercase text-sm tracking-wider shadow-lg shadow-[#ff6a00]/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  <span>{submitting ? 'Submitting...' : 'Send Message To FLEXI'}</span>
                </button>
              </form>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
