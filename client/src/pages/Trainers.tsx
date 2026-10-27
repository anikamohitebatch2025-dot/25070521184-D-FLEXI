import React, { useState, useEffect } from 'react';
import { Award, Mail, Phone, Calendar, ArrowRight, ShieldCheck, Dumbbell, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { Card3D } from '../components/Card3D';

export const Trainers: React.FC = () => {
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchTrainers = async () => {
      try {
        const res = await api.get('/trainers');
        if (res.data?.success) {
          setTrainers(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load trainers:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrainers();
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ff6a00] mb-3">
            <Award className="w-4 h-4 fill-[#ff6a00]" />
            Faculty of Strength • Interactive 3D Cards
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl font-black uppercase tracking-tight text-white">
            Certified Master Coaches
          </h1>
          <p className="text-neutral-400 mt-4 text-base leading-relaxed">
            Our coaches aren't influencers; they are credentialed biomechanists, strength athletes, and physical preparation experts committed to your technical mastery.
          </p>
        </div>

        {/* Loading skeleton */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="h-96 rounded-2xl bg-neutral-900 animate-pulse border border-neutral-800" />
            ))}
          </div>
        )}

        {/* Trainers Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {trainers.map((trainer) => (
              <Card3D key={trainer._id} maxTilt={9} glowColor="rgba(255, 106, 0, 0.35)">
                <div
                  className="group rounded-2xl overflow-hidden bg-[#121214] border border-neutral-800 hover:border-[#ff6a00]/60 transition-all duration-300 flex flex-col justify-between h-full"
                >
                  <div>
                    <div className="aspect-[4/5] overflow-hidden relative">
                      <img
                        src={trainer.photoUrl}
                        alt={trainer.name}
                        className="w-full h-full object-cover object-top group-hover:scale-108 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#121214] via-transparent to-transparent" />
                      <div className="absolute top-3 right-3 px-3 py-1 rounded-full bg-black/80 backdrop-blur-md border border-neutral-700 text-[10px] uppercase font-bold text-[#ff6a00]">
                        {trainer.experience}
                      </div>
                    </div>

                    <div className="p-6">
                      <h3 className="font-heading text-2xl font-black uppercase text-white">
                        {trainer.name}
                      </h3>
                      <div className="text-xs font-semibold text-[#ff6a00] mt-1">
                        {trainer.specialization}
                      </div>
                      <p className="text-neutral-400 text-xs mt-3 leading-relaxed">
                        {trainer.bio}
                      </p>

                      {(trainer.email || trainer.phone) && (
                        <div className="mt-4 pt-4 border-t border-neutral-800 space-y-1.5 text-[11px] text-neutral-400">
                          {trainer.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-neutral-500" />
                              <span>{trainer.email}</span>
                            </div>
                          )}
                          {trainer.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-neutral-500" />
                              <span>{trainer.phone}</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-6 pt-0 space-y-2">
                    <Link
                      to="/book"
                      className="w-full py-2.5 rounded-lg bg-[#ff6a00] hover:bg-[#e65c00] text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-colors shadow-md shadow-[#ff6a00]/25"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Book With {trainer.name.split(' ')[0]}</span>
                    </Link>
                    <Link
                      to="/workouts"
                      className="w-full py-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-white text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <Calendar className="w-3 h-3 text-[#ff6a00]" />
                      <span>Class Timetable</span>
                    </Link>
                  </div>
                </div>
              </Card3D>
            ))}
          </div>
        )}

      </div>
    </div>
  );
};
