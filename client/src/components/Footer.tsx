import React from 'react';
import { Link } from 'react-router-dom';
import { Dumbbell, MapPin, Phone, Mail, Clock, Instagram, Facebook, Youtube, Twitter } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-[#0b0b0c] border-t border-neutral-800 text-neutral-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#ff6a00] to-[#e05500] flex items-center justify-center text-white shadow-lg shadow-[#ff6a00]/25">
                <Dumbbell className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="font-heading text-2xl font-black tracking-wider text-white">
                FLEXI <span className="text-[#ff6a00]">.</span>
              </span>
            </Link>
            <p className="text-neutral-400 max-w-sm leading-relaxed">
              Transform your body, discipline your mind, and elevate your standard of living with cutting-edge strength equipment, certified coaches, and an elite community.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-[#ff6a00] hover:border-[#ff6a00] transition-colors">
                <Instagram className="w-4 h-4" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-[#ff6a00] hover:border-[#ff6a00] transition-colors">
                <Facebook className="w-4 h-4" />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-[#ff6a00] hover:border-[#ff6a00] transition-colors">
                <Youtube className="w-4 h-4" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="w-9 h-9 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-[#ff6a00] hover:border-[#ff6a00] transition-colors">
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-heading text-lg font-bold text-white tracking-wider">Explore</h4>
            <ul className="space-y-2.5">
              <li><Link to="/about" className="hover:text-[#ff6a00] transition-colors">About Us</Link></li>
              <li><Link to="/plans" className="hover:text-[#ff6a00] transition-colors">Membership Plans</Link></li>
              <li><Link to="/trainers" className="hover:text-[#ff6a00] transition-colors">Certified Trainers</Link></li>
              <li><Link to="/workouts" className="hover:text-[#ff6a00] transition-colors">Workout Schedules</Link></li>
              <li><Link to="/diet" className="hover:text-[#ff6a00] transition-colors">Diet & Nutrition</Link></li>
              <li><Link to="/contact" className="hover:text-[#ff6a00] transition-colors">Contact & Location</Link></li>
            </ul>
          </div>

          {/* Operating Hours */}
          <div className="space-y-4">
            <h4 className="font-heading text-lg font-bold text-white tracking-wider">Club Hours</h4>
            <div className="space-y-2 text-xs leading-relaxed">
              <div className="flex items-start gap-2">
                <Clock className="w-4 h-4 text-[#ff6a00] shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-medium">Monday - Friday</div>
                  <div className="text-neutral-400">05:00 AM - 11:00 PM</div>
                </div>
              </div>
              <div className="flex items-start gap-2 pt-1">
                <Clock className="w-4 h-4 text-[#ff6a00] shrink-0 mt-0.5" />
                <div>
                  <div className="text-white font-medium">Saturday - Sunday</div>
                  <div className="text-neutral-400">06:00 AM - 10:00 PM</div>
                </div>
              </div>
              <div className="pt-2 text-[11px] text-[#ff6a00] font-semibold">
                * VIP Members: 24/7 Keycard Access
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-4">
            <h4 className="font-heading text-lg font-bold text-white tracking-wider">Headquarters</h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#ff6a00] shrink-0 mt-0.5" />
                <span>442 Iron Avenue, Metro Athletics District, CA 90210</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#ff6a00] shrink-0" />
                <span>+1 (800) 555-FLEX (3539)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#ff6a00] shrink-0" />
                <span>support@flexigym.com</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-neutral-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div>
            &copy; {new Date().getFullYear()} FLEXI Athletic Club & Management System. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <span className="text-emerald-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              MongoDB & Express Connected
            </span>
            <span>•</span>
            <Link to="/login" className="hover:text-neutral-300">Staff Portal</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};
