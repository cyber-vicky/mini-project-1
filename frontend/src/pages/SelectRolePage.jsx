import React from 'react';
import { Link } from 'react-router-dom';
import { Users, Building2, Shield, HardHat, ShieldCheck, Landmark, ArrowLeft, ArrowRight } from 'lucide-react';

const SelectRolePage = () => {
  const roles = [
    {
      id: 'citizen',
      title: 'Citizen',
      badge: 'Public Portal',
      icon: Users,
      description: 'Report local civic issues, track resolution timelines in real-time, and verify completed repairs with photographic evidence.',
      actionText: 'Citizen Login',
      actionPath: '/citizen/login',
      isPrimary: true,
      secondaryAction: {
        text: 'New citizen? Register here',
        path: '/citizen/register'
      }
    },
    {
      id: 'admin',
      title: 'Administrator',
      badge: 'Executive Oversight',
      icon: Building2,
      description: 'City-wide municipal governance, cross-department triage, GIS operations map, hotspot analytics, and staff department management.',
      actionText: 'Admin Login',
      actionPath: '/municipal/login',
      isPrimary: false,
      secondaryAction: null
    },
    {
      id: 'officer',
      title: 'Municipal Officer',
      badge: 'Departmental Scope',
      icon: Shield,
      description: 'Review departmental complaints (Roads, Sanitation, Water, Electrical), assign field workers, and log official inspection remarks.',
      actionText: 'Officer Login',
      actionPath: '/municipal/login',
      isPrimary: false,
      secondaryAction: null
    },
    {
      id: 'worker',
      title: 'Field Worker',
      badge: 'Field Operations',
      icon: HardHat,
      description: 'View directly assigned field tasks, check repair site locations, start on-site work, and upload completion proof photos.',
      actionText: 'Worker Login',
      actionPath: '/municipal/login',
      isPrimary: false,
      secondaryAction: null
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F5F6] flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-6xl w-full mx-auto">
        {/* Back Link */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#747982] hover:text-[#202226] transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-[#E2E4E7] text-[#202226] text-xs font-bold uppercase tracking-wider mb-3 shadow-2xs">
            <div className="w-2 h-2 rounded-full bg-[#FF8A3D]"></div>
            <span>CivicConnect Secure Portal Access</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-[#202226] tracking-tight">
            Select Your Account Role
          </h1>
          <p className="mt-2 text-sm sm:text-base text-[#747982] max-w-2xl mx-auto">
            Choose your designated portal to access citizen services or authorized municipal operations.
          </p>
        </div>

        {/* 4 Role Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {roles.map(role => {
            const RoleIcon = role.icon;
            return (
              <div
                key={role.id}
                className="civic-card p-6 flex flex-col justify-between transition-all duration-200 group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-[#17191C] flex items-center justify-center border border-[#292D32] shadow-xs">
                      <RoleIcon className="w-5 h-5 text-[#FF8A3D]" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F4F5F6] text-[#747982] border border-[#E2E4E7]">
                      {role.badge}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-[#202226] mb-2 tracking-tight group-hover:text-[#FF8A3D] transition-colors">
                    {role.title}
                  </h2>
                  <p className="text-xs text-[#747982] leading-relaxed mb-6">
                    {role.description}
                  </p>
                </div>

                <div className="pt-4 border-t border-[#E2E4E7] space-y-2.5">
                  <Link
                    to={role.actionPath}
                    className={`w-full py-2.5 text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      role.isPrimary ? 'btn-orange-primary' : 'btn-graphite-secondary'
                    }`}
                  >
                    <span>{role.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  {role.secondaryAction ? (
                    <Link
                      to={role.secondaryAction.path}
                      className="block text-center text-xs font-semibold text-[#FF8A3D] hover:text-[#F37B2B] transition py-1"
                    >
                      {role.secondaryAction.text}
                    </Link>
                  ) : (
                    <div className="h-6"></div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="mt-12 text-center text-xs text-[#747982] border-t border-[#E2E4E7] pt-6 max-w-6xl w-full mx-auto">
        <div className="flex items-center justify-center gap-2 mb-1">
          <Landmark className="w-3.5 h-3.5 text-[#FF8A3D]" />
          <span className="font-bold text-[#202226]">CivicConnect</span>
          <span>&bull;</span>
          <span>Smart Civic Issue Management Platform</span>
        </div>
        <p className="text-[11px] text-[#747982]">
          Secured with role-based access control (RBAC) and encrypted municipal workflows.
        </p>
      </div>
    </div>
  );
};

export default SelectRolePage;
