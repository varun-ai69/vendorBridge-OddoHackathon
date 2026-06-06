"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { ROLES } from "@/lib/constants";

// ----------------------------------------------------------------------
// Custom Premium SVG Illustrations
// ----------------------------------------------------------------------

const AdminIcon = () => (
  <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
    <path d="M32 4L8 14V32C8 46 18 56 32 60C46 56 56 46 56 32V14L32 4Z" fill="url(#admin-base)" stroke="url(#admin-stroke)" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M32 16L18 24V40C18 48 24 53 32 55C40 53 46 48 46 40V24L32 16Z" fill="url(#admin-inner)" className="mix-blend-overlay opacity-80" />
    <circle cx="32" cy="30" r="4" fill="white" />
    <circle cx="32" cy="30" r="10" stroke="url(#admin-glow)" strokeWidth="2" strokeDasharray="2 4"/>
    <path d="M26 40H38" stroke="white" strokeWidth="2" strokeLinecap="round"/>
    <path d="M29 46H35" stroke="white" strokeWidth="2" strokeLinecap="round" opacity="0.6"/>
    <defs>
      <linearGradient id="admin-base" x1="8" y1="4" x2="56" y2="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4F46E5" />
        <stop offset="1" stopColor="#7C3AED" />
      </linearGradient>
      <linearGradient id="admin-inner" x1="18" y1="16" x2="46" y2="55" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.4" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="admin-stroke" x1="32" y1="4" x2="32" y2="60" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.8" />
        <stop offset="1" stopColor="white" stopOpacity="0.1" />
      </linearGradient>
      <radialGradient id="admin-glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(32 30) rotate(90) scale(10)">
        <stop stopColor="white" />
        <stop offset="1" stopColor="white" stopOpacity="0" />
      </radialGradient>
    </defs>
  </svg>
);

const ProcurementIcon = () => (
  <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
    <rect x="14" y="8" width="36" height="48" rx="4" fill="url(#proc-base)" stroke="url(#proc-stroke)" strokeWidth="1.5"/>
    <rect x="22" y="20" width="20" height="4" rx="2" fill="white" fillOpacity="0.9"/>
    <rect x="22" y="28" width="14" height="4" rx="2" fill="white" fillOpacity="0.6"/>
    <circle cx="44" cy="42" r="14" fill="url(#proc-accent)" stroke="white" strokeWidth="2"/>
    <path d="M40 42L43 45L49 39" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    <defs>
      <linearGradient id="proc-base" x1="14" y1="8" x2="50" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0EA5E9" />
        <stop offset="1" stopColor="#2563EB" />
      </linearGradient>
      <linearGradient id="proc-stroke" x1="32" y1="8" x2="32" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.7" />
        <stop offset="1" stopColor="white" stopOpacity="0.1" />
      </linearGradient>
      <linearGradient id="proc-accent" x1="30" y1="28" x2="58" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10B981" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
    </defs>
  </svg>
);

const ManagerIcon = () => (
  <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
    <circle cx="32" cy="32" r="26" fill="url(#mgr-base)" stroke="url(#mgr-stroke)" strokeWidth="1.5"/>
    <path d="M32 14V28L42 36" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="32" cy="32" r="8" fill="white" fillOpacity="0.2"/>
    <circle cx="32" cy="14" r="3" fill="white"/>
    <circle cx="42" cy="36" r="3" fill="white"/>
    <circle cx="18" cy="32" r="3" fill="white" fillOpacity="0.5"/>
    <path d="M22 32L28 32" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" strokeOpacity="0.5"/>
    <defs>
      <linearGradient id="mgr-base" x1="6" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B" />
        <stop offset="1" stopColor="#EA580C" />
      </linearGradient>
      <linearGradient id="mgr-stroke" x1="32" y1="6" x2="32" y2="58" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.8" />
        <stop offset="1" stopColor="white" stopOpacity="0.1" />
      </linearGradient>
    </defs>
  </svg>
);

const VendorIcon = () => (
  <svg width="32" height="32" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-md">
    <path d="M10 24L32 12L54 24V48C54 50.2091 52.2091 52 50 52H14C11.7909 52 10 50.2091 10 48V24Z" fill="url(#vend-base)" stroke="url(#vend-stroke)" strokeWidth="1.5" strokeLinejoin="round"/>
    <path d="M10 24L32 36L54 24" stroke="white" strokeWidth="1.5" strokeLinejoin="round" strokeOpacity="0.6"/>
    <path d="M32 36V52" stroke="white" strokeWidth="1.5" strokeOpacity="0.6"/>
    <path d="M24 16L40 25" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.3"/>
    <rect x="24" y="32" width="16" height="20" rx="2" fill="white" fillOpacity="0.9"/>
    <circle cx="32" cy="42" r="3" fill="#EC4899"/>
    <defs>
      <linearGradient id="vend-base" x1="10" y1="12" x2="54" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#EC4899" />
        <stop offset="1" stopColor="#BE185D" />
      </linearGradient>
      <linearGradient id="vend-stroke" x1="32" y1="12" x2="32" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="white" stopOpacity="0.8" />
        <stop offset="1" stopColor="white" stopOpacity="0.1" />
      </linearGradient>
    </defs>
  </svg>
);


// ----------------------------------------------------------------------
// Data
// ----------------------------------------------------------------------

const PREMIUM_ROLES = [
  { 
    value: ROLES.ADMIN, 
    label: "Administrator", 
    Icon: AdminIcon
  },
  { 
    value: ROLES.PROCUREMENT, 
    label: "Procurement", 
    Icon: ProcurementIcon
  },
  { 
    value: ROLES.MANAGER, 
    label: "Manager", 
    Icon: ManagerIcon
  },
  { 
    value: ROLES.VENDOR, 
    label: "Vendor", 
    Icon: VendorIcon
  },
];

// ----------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------

export default function RoleSelector({ value, onChange }) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {PREMIUM_ROLES.map((role) => {
        const Icon = role.Icon;
        const selected = value === role.value;

        return (
          <motion.button
            key={role.value}
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChange(role.value)}
            className={clsx(
              "relative flex items-center gap-3 p-3 text-left transition-all duration-300",
              "rounded-xl border overflow-hidden",
              selected
                ? "border-amber-500 bg-amber-500/10 shadow-sm shadow-amber-500/20"
                : "border-(--border) hover:border-amber-500/30 hover:bg-slate-50 dark:hover:bg-slate-800/50 bg-white dark:bg-[#1c1a1a]"
            )}
          >
            <div className="flex-shrink-0">
              <Icon />
            </div>

            <h3 className={clsx(
              "text-sm font-semibold tracking-tight",
              selected ? "text-amber-600 dark:text-amber-500" : "text-slate-800 dark:text-slate-200"
            )}>
              {role.label}
            </h3>
            
            {/* Selected Floating Badge */}
            {selected && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute top-2 right-2"
              >
                <div className="flex h-3 w-3 items-center justify-center rounded-full bg-amber-500 shadow-sm">
                </div>
              </motion.div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
