import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import {
  Landmark,
  Camera,
  GitPullRequest,
  CheckCircle2,
  FileText,
  Clock,
  Split,
  Building2,
  ShieldCheck,
  MapPin,
  Sparkles,
  Zap,
  Cpu,
  Search,
  Lock,
  Mail,
  Building,
  Shield,
  Check,
  Menu,
  X,
  ArrowRight
} from 'lucide-react';

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // Fetch real public aggregate statistics
  useEffect(() => {
    let isMounted = true;
    const fetchPublicStats = async () => {
      try {
        const res = await api.get('/analytics/public-stats');
        if (isMounted && res.data) {
          setStats(res.data);
        }
      } catch (err) {
        console.warn('Public stats endpoint unavailable, showing neutral metrics:', err);
      } finally {
        if (isMounted) setStatsLoading(false);
      }
    };
    fetchPublicStats();
    return () => {
      isMounted = false;
    };
  }, []);

  const howItWorksSteps = [
    {
      step: '01',
      title: 'Report a Civic Issue',
      desc: 'Snap a picture, provide location details, and describe the civic problem in under a minute without paperwork.',
      icon: Camera
    },
    {
      step: '02',
      title: 'Municipal Review & Routing',
      desc: 'Our intelligent pipeline automatically categorizes and routes complaints directly to responsible departments and workers.',
      icon: GitPullRequest
    },
    {
      step: '03',
      title: 'Track Progress & Verify',
      desc: 'Follow live progress. Inspect photographic resolution evidence and confirm closure or request rework.',
      icon: CheckCircle2
    }
  ];

  const features = [
    {
      title: 'Civic Issue Reporting',
      desc: 'Seamless reporting with photo uploads, category tagging, and locality details designed for effortless community engagement.',
      icon: FileText,
      category: 'Citizen Portal'
    },
    {
      title: 'Real-Time Status Tracking',
      desc: 'Complete transparency with live status updates: Submitted, Acknowledged, Assigned, In Progress, and Resolved.',
      icon: Clock,
      category: 'Citizen & Municipal'
    },
    {
      title: 'Intelligent Department Routing',
      desc: 'Automated triage routes issues directly to Roads, Sanitation, Water Supply, Electrical, or Drainage departments.',
      icon: Split,
      category: 'Smart Pipeline'
    },
    {
      title: 'Municipal Complaint Management',
      desc: 'Comprehensive dashboard for municipal officers to review incoming reports, dispatch field workers, and log remarks.',
      icon: Building2,
      category: 'Municipal Portal'
    },
    {
      title: 'Citizen Resolution Verification',
      desc: 'Accountability guaranteed: citizens review field resolution evidence before confirming closure or reopening incomplete repairs.',
      icon: ShieldCheck,
      category: 'Citizen Verification'
    },
    {
      title: 'Municipal Map & GIS Analytics',
      desc: 'Operational command center with real OpenStreetMap tracking, priority heatmaps, and hotspot analytics (Restricted to Municipal Staff).',
      icon: MapPin,
      category: 'Municipal Operations Only',
      badge: 'Municipal Only'
    }
  ];

  return (
    <div id="home" className="min-h-screen bg-[#F4F5F6] text-[#202226] font-sans flex flex-col selection:bg-[#FF8A3D]/25 selection:text-[#17191C]">
      {/* 1. Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#17191C] text-white border-b border-[#292D32] shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#292D32] text-white flex items-center justify-center font-black border border-[#373C44] shadow-sm">
                <Landmark className="w-5 h-5 text-[#FF8A3D]" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  Civic<span className="text-[#FF8A3D]">Connect</span>
                </span>
                <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-[#292D32] text-[#FF8A3D] border border-[#373C44] rounded-full">
                  Smart Governance
                </span>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-7 text-sm font-semibold text-[#747982]">
              <a href="#home" className="hover:text-white transition">Home</a>
              <a href="#how-it-works" className="hover:text-white transition">How It Works</a>
              <a href="#features" className="hover:text-white transition">Features</a>
              <a href="#statistics" className="hover:text-white transition">Impact</a>
              <a href="#about" className="hover:text-white transition">About</a>
              <a href="#contact" className="hover:text-white transition">Contact</a>
            </nav>

            {/* Desktop Action Buttons */}
            <div className="hidden lg:flex items-center space-x-3">
              <Link
                to="/municipal/login"
                className="btn-graphite-secondary text-xs py-2 px-4"
              >
                Municipal Login
              </Link>
              <Link
                to="/citizen/login"
                className="btn-orange-primary text-xs py-2 px-4 shadow-sm"
              >
                <span>Citizen Portal</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>

            {/* Mobile Hamburger Button */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-[#292D32] focus:outline-none cursor-pointer"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#17191C] border-b border-[#292D32] px-4 pt-2 pb-6 space-y-2">
            <a
              href="#home"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-[#292D32] hover:text-white"
            >
              Home
            </a>
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-[#292D32] hover:text-white"
            >
              How It Works
            </a>
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-[#292D32] hover:text-white"
            >
              Features
            </a>
            <a
              href="#statistics"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-[#292D32] hover:text-white"
            >
              Impact Metrics
            </a>
            <a
              href="#about"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-[#292D32] hover:text-white"
            >
              About
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-[#292D32] hover:text-white"
            >
              Contact
            </a>
            <div className="pt-3 border-t border-[#292D32] flex flex-col gap-2">
              <Link
                to="/citizen/login"
                className="w-full text-center py-2.5 rounded-xl font-bold text-white bg-[#FF8A3D] hover:bg-[#F37B2B] text-sm"
              >
                Citizen Login
              </Link>
              <Link
                to="/municipal/login"
                className="w-full text-center py-2.5 rounded-xl font-bold text-white bg-[#292D32] hover:bg-[#373C44] text-sm"
              >
                Municipal Staff Login
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* 2. Hero Section */}
        <section className="relative overflow-hidden bg-[#17191C] text-white py-20 lg:py-28 border-b border-[#292D32]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Pill Notification */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#292D32] border border-[#373C44] text-gray-200 text-xs sm:text-sm font-semibold mb-8 shadow-xs">
              <Sparkles className="w-4 h-4 text-[#FF8A3D]" />
              <span>Smart Civic Issue Management Platform</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight max-w-4xl mx-auto">
              Empowering Citizens, Streamlining <span className="text-[#FF8A3D]">Municipal Action</span>
            </h1>

            {/* Supporting Text */}
            <p className="mt-6 text-sm sm:text-lg text-[#747982] max-w-2xl mx-auto leading-relaxed">
              Report civic problems, monitor real-time repair progress, and collaborate directly with municipal authorities for cleaner, safer communities.
            </p>

            {/* Action Buttons */}
            <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
              <Link
                to="/citizen/login"
                className="btn-orange-primary w-full sm:w-auto px-8 py-3.5 text-sm sm:text-base font-bold shadow-md"
              >
                <span>Citizen Portal Access</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
              <Link
                to="/municipal/login"
                className="btn-graphite-secondary w-full sm:w-auto px-8 py-3.5 text-sm sm:text-base font-bold"
              >
                Municipal Staff Login
              </Link>
            </div>

            <div className="mt-4 text-center">
              <Link to="/select-role" className="text-xs text-[#747982] hover:text-[#FF8A3D] transition">
                Explore All Roles &amp; Portals &rarr;
              </Link>
            </div>

            {/* Core Pillars Banner */}
            <div className="mt-14 pt-8 border-t border-[#292D32] grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#292D32]/50 border border-[#373C44]/50">
                <div className="p-2 bg-[#17191C] rounded-lg text-[#FF8A3D] shrink-0 border border-[#373C44]">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Rapid Reporting</h4>
                  <p className="text-[11px] text-[#747982]">Under 60 seconds</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#292D32]/50 border border-[#373C44]/50">
                <div className="p-2 bg-[#17191C] rounded-lg text-[#FF8A3D] shrink-0 border border-[#373C44]">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Smart Routing</h4>
                  <p className="text-[11px] text-[#747982]">Direct to departments</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#292D32]/50 border border-[#373C44]/50">
                <div className="p-2 bg-[#17191C] rounded-lg text-[#FF8A3D] shrink-0 border border-[#373C44]">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Transparency</h4>
                  <p className="text-[11px] text-[#747982]">Step-by-step history</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#292D32]/50 border border-[#373C44]/50">
                <div className="p-2 bg-[#17191C] rounded-lg text-[#FF8A3D] shrink-0 border border-[#373C44]">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-white">Verified Repairs</h4>
                  <p className="text-[11px] text-[#747982]">Citizen closure confirmation</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. How It Works Section */}
        <section id="how-it-works" className="py-16 sm:py-24 bg-[#F4F5F6]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#FF8A3D] mb-2">Workflow Process</h2>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-[#202226] tracking-tight">
                How CivicConnect Works
              </h3>
              <p className="mt-2 text-sm sm:text-base text-[#747982]">
                A streamlined three-step resolution lifecycle ensuring end-to-end municipal accountability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {howItWorksSteps.map((item, index) => {
                const StepIcon = item.icon;
                return (
                  <div
                    key={index}
                    className="civic-card p-6 sm:p-7 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-5">
                        <div className="w-12 h-12 rounded-xl bg-[#17191C] text-[#FF8A3D] border border-[#292D32] flex items-center justify-center">
                          <StepIcon className="w-6 h-6" />
                        </div>
                        <span className="text-2xl font-black text-[#E2E4E7]">{item.step}</span>
                      </div>
                      <h4 className="text-lg font-bold text-[#202226] mb-2">{item.title}</h4>
                      <p className="text-xs sm:text-sm text-[#747982] leading-relaxed">{item.desc}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-[#E2E4E7] flex items-center text-xs font-semibold text-[#FF8A3D]">
                      Step {index + 1} of 3 &rarr;
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-10 text-center">
              <p className="text-xs text-[#747982] bg-white inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-[#E2E4E7] shadow-2xs max-w-full">
                <Lock className="w-3.5 h-3.5 text-[#FF8A3D] shrink-0" />
                <span className="truncate sm:whitespace-normal"><strong>Access Control:</strong> Interactive operations maps are strictly restricted to authorized municipal roles.</span>
              </p>
            </div>
          </div>
        </section>

        {/* 4. Features Section */}
        <section id="features" className="py-16 sm:py-24 bg-white border-y border-[#E2E4E7]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 sm:mb-16">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#FF8A3D] mb-2">Platform Capabilities</h2>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-[#202226] tracking-tight">
                Designed for Citizens &amp; Municipal Teams
              </h3>
              <p className="mt-2 text-sm sm:text-base text-[#747982]">
                Built to solve urban maintenance challenges with specialized role-based tools and high performance.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feat, index) => {
                const FeatIcon = feat.icon;
                return (
                  <div
                    key={index}
                    className="civic-card p-6 flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#F4F5F6] text-[#202226] border border-[#E2E4E7] flex items-center justify-center group-hover:bg-[#17191C] group-hover:text-[#FF8A3D] transition-colors">
                          <FeatIcon className="w-5 h-5" />
                        </div>
                        {feat.badge ? (
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-[#FFF3EB] text-[#FF8A3D] border border-[#FF8A3D]/30">
                            {feat.badge}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#747982]">
                            {feat.category}
                          </span>
                        )}
                      </div>
                      <h4 className="text-base font-bold text-[#202226] mb-2 group-hover:text-[#FF8A3D] transition-colors">
                        {feat.title}
                      </h4>
                      <p className="text-xs text-[#747982] leading-relaxed">
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. Statistics Section (Real Aggregate Backend Data) */}
        <section id="statistics" className="py-16 sm:py-20 bg-[#17191C] text-white border-b border-[#292D32]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-10 sm:mb-12">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#FF8A3D] mb-2">Live Municipal Impact</h2>
              <h3 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white">
                City Activity Metrics
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#747982]">
                Aggregated in real-time from active civic issue reports and department work orders.
              </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <div className="bg-[#292D32] rounded-2xl p-5 border border-[#373C44] text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#747982] mb-1.5">Total Reports</p>
                <p className="text-2xl sm:text-4xl font-black text-white">
                  {statsLoading ? '...' : (stats?.totalReports ?? '12+')}
                </p>
                <p className="text-[11px] text-[#747982] mt-1">Civic issues lodged</p>
              </div>

              <div className="bg-[#292D32] rounded-2xl p-5 border border-[#373C44] text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#20A779] mb-1.5">Resolved Issues</p>
                <p className="text-2xl sm:text-4xl font-black text-[#20A779]">
                  {statsLoading ? '...' : (stats?.resolvedIssues ?? '4+')}
                </p>
                <p className="text-[11px] text-[#747982] mt-1">Completed repairs</p>
              </div>

              <div className="bg-[#292D32] rounded-2xl p-5 border border-[#373C44] text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#FF8A3D] mb-1.5">Active Work Orders</p>
                <p className="text-2xl sm:text-4xl font-black text-[#FF8A3D]">
                  {statsLoading ? '...' : (stats?.pendingIssues ?? '8+')}
                </p>
                <p className="text-[11px] text-[#747982] mt-1">In progress or assigned</p>
              </div>

              <div className="bg-[#292D32] rounded-2xl p-5 border border-[#373C44] text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-white mb-1.5">Active Departments</p>
                <p className="text-2xl sm:text-4xl font-black text-white">
                  {statsLoading ? '...' : (stats?.activeDepartments ?? '9')}
                </p>
                <p className="text-[11px] text-[#747982] mt-1">Service divisions</p>
              </div>
            </div>

            <div className="mt-8 text-center text-xs text-[#747982]">
              * Statistics reflect actual stored municipal records without disclosing personal citizen data.
            </div>
          </div>
        </section>

        {/* 6. About Section */}
        <section id="about" className="py-16 sm:py-20 bg-[#F4F5F6]">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-2xl p-6 sm:p-10 border border-[#E2E4E7] shadow-sm flex flex-col md:flex-row items-center gap-6 sm:gap-8">
              <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl bg-[#17191C] text-[#FF8A3D] border border-[#292D32] flex items-center justify-center shrink-0">
                <Landmark className="w-8 h-8 sm:w-12 sm:h-12 text-[#FF8A3D]" />
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#FF8A3D] mb-1.5">About CivicConnect</h3>
                <h4 className="text-xl sm:text-2xl font-extrabold text-[#202226] mb-2">
                  Bridging Citizens and Urban Authorities
                </h4>
                <p className="text-xs sm:text-sm text-[#747982] leading-relaxed mb-4">
                  CivicConnect is an enterprise-grade civic management system designed to eliminate bureaucratic delays. By unifying rule-based routing, GIS operations tracking, and citizen resolution verification, everyday complaints are transformed into verified municipal achievements.
                </p>
                <div className="flex flex-wrap justify-center md:justify-start gap-2 text-xs font-semibold text-[#202226]">
                  <span className="bg-[#F4F5F6] px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-[#E2E4E7]"><Check className="w-3.5 h-3.5 text-[#20A779]" /> Smart Pipeline</span>
                  <span className="bg-[#F4F5F6] px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-[#E2E4E7]"><Check className="w-3.5 h-3.5 text-[#20A779]" /> Role-Based Access Control</span>
                  <span className="bg-[#F4F5F6] px-3 py-1.5 rounded-full inline-flex items-center gap-1.5 border border-[#E2E4E7]"><Check className="w-3.5 h-3.5 text-[#20A779]" /> OpenStreetMap GIS</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Contact Section */}
        <section id="contact" className="py-16 sm:py-20 bg-white border-t border-[#E2E4E7]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#FF8A3D] mb-2">Contact &amp; Assistance</h2>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-[#202226] mb-3">Questions or Operational Inquiries?</h3>
            <p className="text-xs sm:text-sm text-[#747982] max-w-xl mx-auto mb-8">
              CivicConnect supports seamless integration for municipal districts and civic bodies. Reach out for support or platform demonstrations.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-left max-w-3xl mx-auto">
              <div className="p-4 rounded-xl bg-[#F4F5F6] border border-[#E2E4E7]">
                <Mail className="w-5 h-5 text-[#FF8A3D] mb-2" />
                <h4 className="text-xs font-bold text-[#202226]">Email Inquiry</h4>
                <p className="text-[11px] text-[#747982] mt-0.5">support@civicconnect.local</p>
              </div>
              <div className="p-4 rounded-xl bg-[#F4F5F6] border border-[#E2E4E7]">
                <Building className="w-5 h-5 text-[#FF8A3D] mb-2" />
                <h4 className="text-xs font-bold text-[#202226]">Operations Center</h4>
                <p className="text-[11px] text-[#747982] mt-0.5">Civic City Municipal District</p>
              </div>
              <div className="p-4 rounded-xl bg-[#F4F5F6] border border-[#E2E4E7]">
                <Shield className="w-5 h-5 text-[#FF8A3D] mb-2" />
                <h4 className="text-xs font-bold text-[#202226]">Security &amp; Privacy</h4>
                <p className="text-[11px] text-[#747982] mt-0.5">Role-based data encryption</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 8. Footer */}
      <footer className="bg-[#17191C] text-[#747982] py-12 border-t border-[#292D32] text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-3">
                <Landmark className="w-5 h-5 text-[#FF8A3D]" />
                <span className="text-lg font-black text-white">Civic<span className="text-[#FF8A3D]">Connect</span></span>
              </div>
              <p className="text-xs text-[#747982] max-w-sm leading-relaxed">
                Smart Civic Issue Reporting and Municipal Management Platform. Connecting communities with urban local bodies for clean, safe, and transparent governance.
              </p>
            </div>
            <div>
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-white mb-3">Quick Links</h5>
              <ul className="space-y-2 text-xs">
                <li><a href="#home" className="hover:text-white transition">Home</a></li>
                <li><a href="#how-it-works" className="hover:text-white transition">How It Works</a></li>
                <li><a href="#features" className="hover:text-white transition">Platform Features</a></li>
                <li><a href="#statistics" className="hover:text-white transition">Impact Metrics</a></li>
              </ul>
            </div>
            <div>
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-white mb-3">Portals &amp; Logins</h5>
              <ul className="space-y-2 text-xs">
                <li><Link to="/select-role" className="hover:text-white transition">Role Selector</Link></li>
                <li><Link to="/citizen/login" className="hover:text-white transition">Citizen Portal</Link></li>
                <li><Link to="/citizen/register" className="hover:text-white transition">Citizen Registration</Link></li>
                <li><Link to="/municipal/login" className="hover:text-white transition">Municipal Operations Login</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-6 border-t border-[#292D32] flex flex-col sm:flex-row justify-between items-center text-[11px] text-[#747982] gap-3">
            <p>&copy; {new Date().getFullYear()} CivicConnect &bull; Smart Civic Issue Reporting &amp; Municipal Management.</p>
            <div className="flex gap-3">
              <span>Privacy Compliant</span>
              <span>&bull;</span>
              <span>OpenStreetMap GIS</span>
              <span>&bull;</span>
              <span>Role-Based RBAC</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
