import React from 'react';
import { Shield, Target, Compass, Zap, Award, Flame, CheckCircle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const AboutUs: React.FC = () => {
  const pillars = [
    {
      icon: <Award className="w-8 h-8 text-[#ff6a00]" />,
      title: 'Precision Biomechanics',
      desc: 'All machines are calibrated for natural joint articulation and targeted muscular tension, mitigating injury risk while maximizing hyper-adaptation.',
    },
    {
      icon: <Target className="w-8 h-8 text-[#ff6a00]" />,
      title: 'Purpose-Driven Training',
      desc: 'No frivolous fitness fads. Every session, template, and barbell setup is backed by exercise physiology and periodization science.',
    },
    {
      icon: <Zap className="w-8 h-8 text-[#ff6a00]" />,
      title: 'High-Performance Culture',
      desc: 'Surround yourself with disciplined lifters, collegiate athletes, and professionals who take pride in relentless consistency.',
    },
    {
      icon: <Shield className="w-8 h-8 text-[#ff6a00]" />,
      title: 'Active Recovery Tech',
      desc: 'Infrared saunas, cold plunge ice tubs, and pneumatic compression systems to ensure rapid neuromuscular regeneration.',
    },
  ];

  const equipmentList = [
    '8 Eleiko Competition Olympic Lifting Platforms & Calibrated Discs',
    'Custom Rogue Monster Lite Squat Racks with Safety Straps',
    'Prime Fitness Variable Resistance Bicep, Tricep & Chest Machines',
    'Watson Dumbbells up to 150 lbs in 5 lb increments',
    '40-meter Prowler Sprint Astroturf with Dog Sleds & Battle Ropes',
    'Concept2 Rowers, SkiErgs, and Assault AirBikes for Conditioning',
    'Medical-Grade InBody 570 Bioelectrical Impedance Body Analyzer',
    'Full Contrast Recovery Suite: Finnish Cedar Sauna & 45°F Cold Plunge',
  ];

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white">
      {/* Header Banner */}
      <section className="relative py-20 bg-[#121214] border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ff6a00] mb-3">
            <Flame className="w-4 h-4 fill-[#ff6a00]" />
            About FLEXI Athletic Club
          </div>
          <h1 className="font-heading text-5xl sm:text-6xl lg:text-7xl font-black uppercase tracking-tight text-white">
            Built On Discipline. <br />
            <span className="text-[#ff6a00]">Forged In Iron.</span>
          </h1>
          <p className="max-w-2xl mx-auto text-neutral-400 text-base sm:text-lg mt-4 leading-relaxed">
            We exist to provide a no-excuse sanctuary for those committed to conquering physical limits and crafting an elite physique.
          </p>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            
            <div className="p-8 rounded-2xl bg-neutral-900 border border-neutral-800">
              <div className="w-12 h-12 rounded-xl bg-[#ff6a00]/10 border border-[#ff6a00]/30 flex items-center justify-center text-[#ff6a00] mb-6">
                <Target className="w-6 h-6" />
              </div>
              <h2 className="font-heading text-3xl font-black uppercase text-white mb-3">
                Our Mission
              </h2>
              <p className="text-neutral-300 leading-relaxed text-sm">
                To elevate fitness standards by merging premium strength engineering, science-grounded coaching, and an inspiring athletic environment. We empower every individual who walks through our doors to shatter mental boundaries and achieve peak physiological condition.
              </p>
            </div>

            <div className="p-8 rounded-2xl bg-neutral-900 border border-neutral-800">
              <div className="w-12 h-12 rounded-xl bg-[#ff6a00]/10 border border-[#ff6a00]/30 flex items-center justify-center text-[#ff6a00] mb-6">
                <Compass className="w-6 h-6" />
              </div>
              <h2 className="font-heading text-3xl font-black uppercase text-white mb-3">
                Our Vision
              </h2>
              <p className="text-neutral-300 leading-relaxed text-sm">
                To become the premier commercial athletic and strength sanctuary globally, renowned for athletic excellence, uncompromising integrity, and a culture where every milestone is earned with sweat and dedication.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Facilities & Equipment Showcase */}
      <section className="py-20 bg-[#121214] border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#ff6a00] mb-2">
                Unmatched Standards
              </div>
              <h2 className="font-heading text-4xl sm:text-5xl font-black uppercase text-white mb-6">
                Facilities & Equipment
              </h2>
              <p className="text-neutral-300 text-sm leading-relaxed mb-8">
                We spare zero expense when outfitting our training floors. We believe your progress should never be limited by substandard bars, crowded platforms, or poorly maintained machines.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {equipmentList.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-neutral-200">
                    <CheckCircle className="w-4 h-4 text-[#ff6a00] shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <img
                src="https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=600&q=80"
                alt="Gym equipment"
                className="rounded-xl object-cover h-64 w-full border border-neutral-800 shadow-md"
              />
              <img
                src="https://images.unsplash.com/photo-1584466977773-e625c37cdd50?auto=format&fit=crop&w=600&q=80"
                alt="Olympic lifting"
                className="rounded-xl object-cover h-64 w-full border border-neutral-800 shadow-md translate-y-6"
              />
            </div>

          </div>
        </div>
      </section>

      {/* Why Choose Us Pillars */}
      <section className="py-20 bg-[#0b0b0c] border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="font-heading text-4xl sm:text-5xl font-black uppercase text-white">
              Why Choose FLEXI?
            </h2>
            <p className="text-neutral-400 text-sm mt-3">
              Four fundamental pillars that separate us from typical commercial franchises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {pillars.map((pillar, i) => (
              <div key={i} className="p-6 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-[#ff6a00]/40 transition-colors">
                <div className="mb-4">{pillar.icon}</div>
                <h3 className="font-heading text-xl font-bold uppercase text-white mb-2">{pillar.title}</h3>
                <p className="text-neutral-400 text-xs leading-relaxed">{pillar.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link
              to="/plans"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white font-extrabold uppercase text-sm tracking-wider shadow-lg shadow-[#ff6a00]/25 transition-all"
            >
              <span>Explore Our Memberships</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
