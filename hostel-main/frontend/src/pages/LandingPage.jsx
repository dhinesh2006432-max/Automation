import React from 'react';
import { Link } from 'react-router-dom';
import { Building, ShieldCheck, Users, Award, ChevronRight, Phone, Mail, MapPin, Sparkles, CheckCircle2, Bot } from 'lucide-react';
import AIAssistantWidget from '../components/AIAssistantWidget';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-900 text-white selection:bg-teal-500 selection:text-white">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500 text-slate-950 font-black flex items-center justify-center text-xl shadow-lg shadow-teal-500/30">
              H
            </div>
            <div>
              <span className="font-black text-lg tracking-tight text-white block">EXCELLENCE HOSTEL</span>
              <span className="text-xs text-teal-400 font-semibold tracking-wider">COLLEGE MANAGEMENT SYSTEM</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/login?role=STUDENT"
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all"
            >
              Student Login
            </Link>
            <Link
              to="/login?role=WARDEN"
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-teal-500 text-slate-950 hover:bg-teal-400 shadow-lg shadow-teal-500/20 transition-all flex items-center gap-1.5"
            >
              Warden Portal <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-teal-500/10 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-teal-400 text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Next-Generation Campus Living
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight mb-6">
            Smart, Seamless & Secure <br />
            <span className="bg-gradient-to-r from-teal-400 via-emerald-300 to-teal-200 bg-clip-text text-transparent">
              Hostel Allocation System
            </span>
          </h1>

          <p className="text-slate-400 text-base sm:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            Experience fully automated room allocation, instant outpass QR generation, digital complaint resolution, mess feedback, and real-time attendance management.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/login?role=STUDENT"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-teal-500 text-slate-950 font-bold text-sm hover:bg-teal-400 shadow-xl shadow-teal-500/25 transition-all flex items-center justify-center gap-2"
            >
              Student Portal Access <ChevronRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login?role=WARDEN"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-slate-800 text-white border border-slate-700 font-bold text-sm hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
            >
              Warden Administration <ShieldCheck className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Facilities Grid */}
      <section className="py-20 bg-slate-950/60 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-3">Hostel Facilities & Highlights</h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">Modern infrastructure designed for comfort, academic focus, and student safety.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-5">
                <Building className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Smart Room Allocation</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Automated room allocation matching block, floor, AC preference, and capacity rules with instant PDF allocation certificates.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-5">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">QR Code Outpasses</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Digital leave requests with warden approval, parent email notification, and verifiable security QR codes.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-5">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">24/7 Support & Complaints</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Priority maintenance queue for emergency electrical, plumbing, or Wi-Fi issues with image upload & warden response.
              </p>
            </div>

            <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 hover:border-teal-500/40 transition-all">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/10 text-teal-400 flex items-center justify-center mb-5">
                <Bot className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">SmartHostel AI Chatbot</h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                Conversational assistant for 2026 handbook policies, curfews, mess timings, and session-scoped room & fee status.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer / Contact */}
      <footer className="py-12 border-t border-slate-800 bg-slate-950 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-teal-400" /> Excellence College Campus, University Road
          </div>

          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-teal-400" /> +1 (800) 555-HOSTEL</span>
            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-teal-400" /> hostel@excellence.edu</span>
          </div>

          <p>© 2026 Excellence College Hostel Management System. All rights reserved.</p>
        </div>
      </footer>

      {/* Floating AI Assistant Chatbot */}
      <AIAssistantWidget />
    </div>
  );
}
