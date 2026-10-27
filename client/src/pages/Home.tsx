import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ArrowRight, CheckCircle2, ShieldCheck, Dumbbell, Flame, Trophy, 
  Users, Activity, Star, Calendar, ChevronRight, Sparkles, Clock, Check 
} from 'lucide-react';
import { motion } from 'motion/react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Card3D } from '../components/Card3D';
import { MovingBanner } from '../components/MovingBanner';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [plans, setPlans] = useState<any[]>([]);
  const [trainers, setTrainers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansRes, trainersRes] = await Promise.all([
          api.get('/plans'),
          api.get('/trainers'),
        ]);
        if (plansRes.data?.success) setPlans(plansRes.data.data);
        if (trainersRes.data?.success) setTrainers(trainersRes.data.data.slice(0, 4));
      } catch (err) {
        console.error('Error fetching home data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      navigate('/login?redirect=/plans');
      return;
    }
    setSubscribingId(planId);
    try {
      const res = await api.post('/memberships', { planId });
      if (res.data?.success) {
        success(res.data.message || 'Membership activated!');
        navigate('/dashboard');
      }
    } catch (err: any) {
      toastError(err.response?.data?.message || 'Could not subscribe to plan.');
    } finally {
      setSubscribingId(null);
    }
  };

  const facilities = [
    {
      title: 'Heavy Iron & Olympic Platforms',
      desc: 'Competition-grade Eleiko bumper plates, Texas Power Bars, and 8 dedicated lifting platforms.',
      img: 'https://images.unsplash.com/photo-1540497077202-7c8a3999166f?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Functional Turf & Sled Track',
      desc: '40-meter indoor astroturf for sprint mechanics, sled pushes, kettlebells, and plyometrics.',
      img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
    },
    {
      title: 'Contrast Recovery & Cryo Suite',
      desc: 'Infrared cedarwood saunas, 48°F cold plunges, and compression boot lounge for rapid recovery.',
      img: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=800&q=80',
    },
  ];

  const testimonials = [
    {
      name: 'Alexander Reed',
      role: 'Member for 18 months',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
      text: 'FLEXI is in a completely different tier from conventional commercial gyms. The equipment is pristine, the trainers understand biomechanics, and the energy in the free-weight zone pushes you to hit new PRs every session.',
      rating: 5,
    },
    {
      name: 'Samantha Wright',
      role: 'Member for 2 years',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      text: 'Joining the Quarterly Pro plan changed everything for me. Having regular coach check-ins and sauna sessions helped me drop 24 lbs while building serious functional strength.',
      rating: 5,
    },
    {
      name: 'David Thorne',
      role: 'Member for 10 months',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80',
      text: 'The 24/7 keycard access and spotless facilities make early morning lifts effortless. Highly recommended for anyone taking their fitness seriously.',
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0b0b0c] text-white overflow-hidden">
      
      {/* 1. HERO SECTION WITH ENTRANCE ANIMATION & ZOOM EFFECT */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden border-b border-neutral-800">
        
        {/* Background Image with Cinematic Slow Zoom Effect */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-[12000ms] ease-out scale-100 hover:scale-110"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=2000&q=85')`,
            animation: 'pulse 14s ease-in-out infinite alternate',
          }}
        >
          {/* Dark gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0b0c] via-[#0b0b0c]/85 to-[#0b0b0c]/60" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-transparent via-[#0b0b0c]/70 to-[#0b0b0c]" />
        </div>

        {/* Hero Content with Staggered Motion Animations */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
          
          {/* Pulsing Highlight Beacon Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-neutral-900/90 border border-[#ff6a00]/50 text-[#ff6a00] text-xs uppercase tracking-widest font-bold mb-6 backdrop-blur-md shadow-lg shadow-[#ff6a00]/20"
          >
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff6a00] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#ff6a00]"></span>
            </span>
            <Flame className="w-4 h-4 fill-[#ff6a00]" />
            <span>Elite Strength & Conditioning Facility • Bookings Open</span>
          </motion.div>

          {/* Master Headline with kinetic staggered lines */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="font-heading text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight leading-[0.95] uppercase text-white mb-6"
          >
            TRANSFORM YOUR BODY. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-neutral-100 to-[#ff6a00]">
              TRANSFORM YOUR LIFE.
            </span>
          </motion.h1>

          {/* Supporting Text */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4, ease: 'easeOut' }}
            className="max-w-2xl mx-auto text-base sm:text-xl text-neutral-300 font-normal leading-relaxed mb-10"
          >
            Engineered for high-performing individuals, competitive athletes, and fitness enthusiasts. Experience world-class strength equipment, bespoke training regimes, and an uncompromising atmosphere.
          </motion.p>

          {/* Action Buttons with Pulsing Highlights */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link
              to="/register"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white text-base font-extrabold uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-300 shadow-xl shadow-[#ff6a00]/40 hover:shadow-[#ff6a00]/60 hover:-translate-y-0.5 animate-pulse-glow"
            >
              <span>Join Now</span>
              <ArrowRight className="w-5 h-5" />
            </Link>

            <Link
              to="/book"
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-[#ff6a00] hover:text-white border-2 border-[#ff6a00]/60 hover:border-[#ff6a00] text-base font-black uppercase tracking-wider flex items-center justify-center gap-3 transition-all duration-300 backdrop-blur-md shadow-lg shadow-[#ff6a00]/10"
            >
              <Calendar className="w-5 h-5" />
              <span>Book Appointment</span>
            </Link>

            <Link
              to="/plans"
              className="w-full sm:w-auto px-6 py-4 rounded-xl bg-neutral-900/60 hover:bg-neutral-800/80 text-neutral-300 hover:text-white border border-neutral-700 text-base font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-300"
            >
              <span>Memberships</span>
              <ChevronRight className="w-4 h-4 text-[#ff6a00]" />
            </Link>
          </motion.div>

          {/* Quick Metrics Bar with Staggered Entrance */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-16 pt-8 border-t border-neutral-800/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
          >
            <div>
              <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#ff6a00]">25,000+</div>
              <div className="text-xs uppercase tracking-wider text-neutral-400 font-medium mt-1">Sq. Ft. Training Floor</div>
            </div>
            <div>
              <div className="font-heading text-3xl sm:text-4xl font-extrabold text-white">40+</div>
              <div className="text-xs uppercase tracking-wider text-neutral-400 font-medium mt-1">Weekly Group Classes</div>
            </div>
            <div>
              <div className="font-heading text-3xl sm:text-4xl font-extrabold text-[#ff6a00]">100%</div>
              <div className="text-xs uppercase tracking-wider text-neutral-400 font-medium mt-1">Certified Master Coaches</div>
            </div>
            <div>
              <div className="font-heading text-3xl sm:text-4xl font-extrabold text-white">24/7</div>
              <div className="text-xs uppercase tracking-wider text-neutral-400 font-medium mt-1">Keycard Member Access</div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* MOVING TEXT BANNER */}
      <MovingBanner />

      {/* 2. ABOUT US SUMMARY SECTION */}
      <section className="py-20 bg-[#121214] border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            
            {/* Visual Grid with 3D Tilt */}
            <Card3D glowColor="rgba(255, 106, 0, 0.2)">
              <div className="aspect-[4/3] rounded-2xl overflow-hidden border border-neutral-800 shadow-2xl relative">
                <img
                  src="https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=1200&q=80"
                  alt="Athletes training at FLEXI"
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-6 left-6 right-6 p-4 rounded-xl bg-neutral-900/90 backdrop-blur-md border border-neutral-700/60">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#ff6a00] flex items-center justify-center text-white shrink-0 shadow-lg shadow-[#ff6a00]/30">
                      <Trophy className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white uppercase tracking-wider font-heading">Voted #1 Commercial Gym</div>
                      <div className="text-xs text-neutral-400">Excellence in functional conditioning & strength culture</div>
                    </div>
                  </div>
                </div>
              </div>
            </Card3D>

            {/* About Text */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ff6a00]">
                <Activity className="w-4 h-4" />
                About FLEXI Athletic Club
              </div>
              <h2 className="font-heading text-4xl sm:text-5xl font-black uppercase tracking-tight text-white leading-tight">
                Built For Purpose. <br />
                <span className="text-[#ff6a00]">Driven By Results.</span>
              </h2>
              <p className="text-neutral-300 leading-relaxed text-base">
                Founded with a singular vision to abolish generic, low-effort fitness centers, FLEXI delivers an uncompromising athletic environment. We combine state-of-the-art powerlifting racks, specialized cable resistance systems, and contrast hydrotherapy to provide an elite training experience.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#ff6a00] shrink-0 mt-0.5" />
                  <span className="text-sm text-neutral-200">World-class calibrated Eleiko and Prime Fitness machinery</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#ff6a00] shrink-0 mt-0.5" />
                  <span className="text-sm text-neutral-200">Science-based progressive programming customized for all experience levels</span>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[#ff6a00] shrink-0 mt-0.5" />
                  <span className="text-sm text-neutral-200">Spotless luxury locker rooms with private steam rooms & saunas</span>
                </div>
              </div>

              <div className="pt-4 flex items-center gap-4">
                <Link
                  to="/about"
                  className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#ff6a00] hover:text-white transition-colors"
                >
                  <span>Learn more about our philosophy</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. FEATURED MEMBERSHIP PLANS WITH 3D-STYLE HOVER EFFECTS */}
      <section className="py-24 bg-[#0b0b0c] border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#ff6a00] mb-3">
              <Sparkles className="w-4 h-4" />
              Interactive 3D Cards • Transparent Pricing
            </div>
            <h2 className="font-heading text-4xl sm:text-6xl font-black uppercase tracking-tight text-white">
              Choose Your Blueprint
            </h2>
            <p className="text-neutral-400 mt-4 text-base">
              Hover over cards for 3D specular depth. All plans are dynamically loaded and managed in MongoDB.
            </p>
          </div>

          {/* Plans Grid with 3D Tilt Hover Effects */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {plans.map((plan, idx) => {
              const isPopular = plan.name.toLowerCase().includes('quarterly') || idx === 1;
              return (
                <Card3D
                  key={plan._id}
                  glowColor={isPopular ? 'rgba(255, 106, 0, 0.45)' : 'rgba(255, 255, 255, 0.1)'}
                  maxTilt={10}
                >
                  <div
                    className={`relative rounded-2xl flex flex-col justify-between p-8 transition-all h-full ${
                      isPopular
                        ? 'bg-neutral-900 border-2 border-[#ff6a00] shadow-2xl'
                        : 'bg-[#121214] border border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    {isPopular && (
                      <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#ff6a00] text-black font-extrabold text-[11px] uppercase tracking-widest shadow-md">
                        Most Popular
                      </div>
                    )}

                    <div>
                      <div className="text-xs uppercase tracking-widest text-[#ff6a00] font-bold">
                        {plan.duration} Days Duration
                      </div>
                      <h3 className="font-heading text-3xl font-black uppercase text-white mt-1">
                        {plan.name}
                      </h3>
                      <p className="text-xs text-neutral-400 mt-2 min-h-[36px]">
                        {plan.description}
                      </p>

                      <div className="my-6 pb-6 border-b border-neutral-800">
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-neutral-400">$</span>
                          <span className="font-heading text-5xl font-black text-white">{plan.price}</span>
                          <span className="text-neutral-400 text-sm">/ {plan.duration} days</span>
                        </div>
                        <div className="text-xs text-neutral-400 mt-1">
                          Equivalent to ${(plan.price / (plan.duration / 30)).toFixed(0)}/month
                        </div>
                      </div>

                      <div className="space-y-3 mb-8">
                        <div className="text-xs uppercase tracking-wider text-neutral-400 font-semibold mb-2">
                          Included Features:
                        </div>
                        {plan.benefits?.map((benefit: string, bIdx: number) => (
                          <div key={bIdx} className="flex items-start gap-2.5 text-xs text-neutral-200">
                            <CheckCircle2 className="w-4 h-4 text-[#ff6a00] shrink-0 mt-0.5" />
                            <span>{benefit}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <button
                        onClick={() => handleSubscribe(plan._id)}
                        disabled={subscribingId === plan._id}
                        className={`w-full py-3.5 rounded-xl text-sm font-extrabold uppercase tracking-wider transition-all duration-200 ${
                          isPopular
                            ? 'bg-[#ff6a00] hover:bg-[#e65c00] text-white shadow-lg shadow-[#ff6a00]/30'
                            : 'bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700'
                        }`}
                      >
                        {subscribingId === plan._id ? 'Processing...' : 'Join Now'}
                      </button>
                    </div>
                  </div>
                </Card3D>
              );
            })}
          </div>

        </div>
      </section>

      {/* APPOINTMENT BOOKING CALLOUT BANNER */}
      <section className="py-16 bg-gradient-to-r from-neutral-950 via-[#18181b] to-neutral-950 border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 sm:p-12 rounded-3xl bg-neutral-900/90 border border-[#ff6a00]/40 shadow-2xl relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-8">
            
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6a00]/15 text-[#ff6a00] text-xs font-bold uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" />
                Live Slot Booking Available
              </div>
              <h3 className="font-heading text-3xl sm:text-5xl font-black uppercase text-white">
                Book 1-on-1 Coaching or Recovery
              </h3>
              <p className="text-neutral-400 text-sm leading-relaxed">
                Choose your date, preferred master coach, and available time slot in real-time. Confirmed bookings are immediately scheduled in the club database.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
              <Link
                to="/book"
                className="px-8 py-4 rounded-xl bg-[#ff6a00] hover:bg-[#e65c00] text-white font-black uppercase text-sm tracking-wider shadow-lg shadow-[#ff6a00]/30 transition-all text-center flex items-center justify-center gap-2 animate-pulse-glow"
              >
                <Calendar className="w-4 h-4" />
                <span>Book Appointment Now</span>
              </Link>
            </div>

          </div>
        </div>
      </section>

      {/* 4. TRAINING FACILITIES SHOWCASE */}
      <section className="py-20 bg-[#121214] border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#ff6a00] mb-2">
                Environment
              </div>
              <h2 className="font-heading text-4xl sm:text-5xl font-black uppercase text-white">
                World-Class Facilities
              </h2>
            </div>
            <p className="text-neutral-400 text-sm max-w-md mt-4 md:mt-0">
              Every square inch is engineered to remove friction, enhance focus, and accelerate physiological adaptation.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {facilities.map((f, i) => (
              <Card3D key={i} maxTilt={6}>
                <div className="group rounded-2xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-[#ff6a00]/50 transition-all duration-300 h-full flex flex-col justify-between">
                  <div className="aspect-[16/10] overflow-hidden relative">
                    <img
                      src={f.img}
                      alt={f.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
                  </div>
                  <div className="p-6">
                    <h3 className="font-heading text-2xl font-bold uppercase text-white group-hover:text-[#ff6a00] transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-neutral-400 text-xs mt-2 leading-relaxed">
                      {f.desc}
                    </p>
                  </div>
                </div>
              </Card3D>
            ))}
          </div>

        </div>
      </section>

      {/* 5. FEATURED TRAINERS WITH 3D-STYLE HOVER EFFECTS */}
      <section className="py-24 bg-[#0b0b0c] border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-[#ff6a00] mb-2">
                Expert Coaching • Interactive 3D Depth
              </div>
              <h2 className="font-heading text-4xl sm:text-5xl font-black uppercase text-white">
                Meet The Master Coaches
              </h2>
            </div>
            <Link
              to="/trainers"
              className="inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-[#ff6a00] hover:text-white transition-colors mt-4 md:mt-0"
            >
              <span>View all trainers</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {trainers.map((trainer) => (
              <Card3D key={trainer._id} maxTilt={9} glowColor="rgba(255, 106, 0, 0.35)">
                <div
                  className="group rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-[#ff6a00]/60 transition-all duration-300 flex flex-col h-full justify-between"
                >
                  <div className="aspect-[3/4] overflow-hidden relative">
                    <img
                      src={trainer.photoUrl}
                      alt={trainer.name}
                      className="w-full h-full object-cover object-top group-hover:scale-108 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-900 via-transparent to-transparent" />
                    <div className="absolute top-3 right-3 px-2.5 py-1 rounded bg-black/80 backdrop-blur-md border border-neutral-700 text-[10px] uppercase font-bold text-[#ff6a00]">
                      {trainer.experience}
                    </div>
                  </div>

                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-heading text-2xl font-black uppercase text-white">
                        {trainer.name}
                      </h3>
                      <div className="text-xs font-semibold text-[#ff6a00] mt-0.5">
                        {trainer.specialization}
                      </div>
                      <p className="text-neutral-400 text-xs mt-3 line-clamp-3 leading-relaxed">
                        {trainer.bio}
                      </p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-neutral-800 flex items-center justify-between">
                      <Link
                        to="/book"
                        className="text-xs font-bold uppercase tracking-wider text-[#ff6a00] hover:text-white flex items-center gap-1"
                      >
                        <span>Book Session</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </Card3D>
            ))}
          </div>

        </div>
      </section>

      {/* REVERSE MOVING TEXT BANNER */}
      <MovingBanner reverse={true} />

      {/* 6. TESTIMONIALS */}
      <section className="py-20 bg-[#121214] border-b border-neutral-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <div className="text-xs font-bold uppercase tracking-widest text-[#ff6a00] mb-2">
              Member Proof
            </div>
            <h2 className="font-heading text-4xl sm:text-5xl font-black uppercase text-white">
              Real Athlete Stories
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <Card3D key={idx} maxTilt={5}>
                <div className="p-8 rounded-2xl bg-neutral-900 border border-neutral-800 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center gap-1 text-[#ff6a00] mb-4">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-[#ff6a00]" />
                      ))}
                    </div>
                    <p className="text-neutral-300 text-sm italic leading-relaxed">
                      "{t.text}"
                    </p>
                  </div>

                  <div className="flex items-center gap-3 mt-6 pt-6 border-t border-neutral-800">
                    <img
                      src={t.avatar}
                      alt={t.name}
                      className="w-10 h-10 rounded-full object-cover border border-neutral-700"
                    />
                    <div>
                      <div className="text-sm font-bold text-white uppercase font-heading">{t.name}</div>
                      <div className="text-xs text-neutral-400">{t.role}</div>
                    </div>
                  </div>
                </div>
              </Card3D>
            ))}
          </div>

        </div>
      </section>

      {/* 7. CONTACT INFO CALLOUT */}
      <section className="py-16 bg-[#ff6a00] text-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div>
            <h3 className="font-heading text-3xl sm:text-4xl font-black uppercase tracking-tight">
              Ready To Start Your Fitness Evolution?
            </h3>
            <p className="text-neutral-900 font-medium text-sm mt-1">
              Visit our facility for a complimentary day pass or book an appointment with our master coaches.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/book"
              className="px-6 py-3.5 rounded-xl bg-black hover:bg-neutral-900 text-white text-sm font-black uppercase tracking-wider transition-colors shadow-xl"
            >
              Book Session
            </Link>
            <Link
              to="/contact"
              className="px-6 py-3.5 rounded-xl bg-neutral-900 hover:bg-black text-[#ff6a00] text-sm font-black uppercase tracking-wider transition-colors shadow-xl"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
};
