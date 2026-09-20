import React from 'react';

/**
 * High-fidelity SVG Illustrations matching the exact visual style
 * of the user's emergency flow screenshots.
 */

// 1. Glowing Emergency Siren Beacon (Image 3)
export const EmergencySirenIllustration: React.FC<{ className?: string }> = ({ className = 'w-24 h-24' }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Soft pink glow circle behind siren */}
    <circle cx="60" cy="56" r="48" fill="#FEE2E2" fillOpacity="0.6" />
    
    {/* Radiating Light Beams / Rays */}
    {/* Left Beams */}
    <line x1="22" y1="46" x2="12" y2="42" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="26" y1="32" x2="18" y2="24" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="38" y1="20" x2="34" y2="10" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
    
    {/* Top Beams */}
    <line x1="60" y1="16" x2="60" y2="6" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
    
    {/* Right Beams */}
    <line x1="82" y1="20" x2="86" y2="10" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="94" y1="32" x2="102" y2="24" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />
    <line x1="98" y1="46" x2="108" y2="42" stroke="#EF4444" strokeWidth="3.5" strokeLinecap="round" />

    {/* Siren Base Stand */}
    <path
      d="M34 82C34 79.7909 35.7909 78 38 78H82C84.2091 78 86 79.7909 86 82V88C86 91.3137 83.3137 94 80 94H40C36.6863 94 34 91.3137 34 88V82Z"
      fill="#2A3342"
    />
    <rect x="42" y="80" width="36" height="3" rx="1.5" fill="#4B5563" />

    {/* Red Dome Body */}
    <path
      d="M40 78V52C40 40.9543 48.9543 32 60 32C71.0457 32 80 40.9543 80 52V78H40Z"
      fill="url(#sirenGradient)"
    />

    {/* Dome Inner Light Reflection / Highlight */}
    <path
      d="M45 52C45 43.7157 51.7157 37 60 37C63.2 37 66.1 38 68.5 39.7C63.5 41.5 59.8 46.2 59.8 52V74H45V52Z"
      fill="#F87171"
      fillOpacity="0.4"
    />

    {/* White Medical Cross Inside Beacon */}
    <rect x="56.5" y="46" width="7" height="20" rx="2" fill="#FFFFFF" />
    <rect x="50" y="52.5" width="20" height="7" rx="2" fill="#FFFFFF" />

    <defs>
      <linearGradient id="sirenGradient" x1="40" y1="32" x2="80" y2="78" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F87171" />
        <stop offset="0.4" stopColor="#EF4444" />
        <stop offset="1" stopColor="#B91C1C" />
      </linearGradient>
    </defs>
  </svg>
);

// 2. Road Accident Hero Banner Scene (Image 1)
export const RoadAccidentBannerIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-44 sm:h-52' }) => (
  <svg
    viewBox="0 0 400 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="xMidYMid slice"
  >
    {/* Sky & Background */}
    <rect width="400" height="200" fill="url(#skyGrad)" />
    
    {/* Distant Soft Clouds */}
    <ellipse cx="60" cy="30" rx="35" ry="12" fill="#FFFFFF" fillOpacity="0.75" />
    <ellipse cx="85" cy="26" rx="25" ry="14" fill="#FFFFFF" fillOpacity="0.75" />
    <ellipse cx="280" cy="35" rx="40" ry="10" fill="#FFFFFF" fillOpacity="0.6" />

    {/* Distant City Skyline */}
    <rect x="70" y="45" width="22" height="40" rx="2" fill="#CFE4F3" />
    <rect x="94" y="35" width="28" height="50" rx="2" fill="#BAD8EE" />
    <rect x="124" y="50" width="18" height="35" rx="2" fill="#CFE4F3" />
    <rect x="144" y="42" width="26" height="43" rx="2" fill="#C4E0F3" />
    <rect x="230" y="40" width="30" height="45" rx="2" fill="#BAD8EE" />
    <rect x="262" y="52" width="20" height="33" rx="2" fill="#CFE4F3" />

    {/* Lush Green Trees & Bushes */}
    <ellipse cx="35" cy="78" rx="28" ry="24" fill="#48BB78" />
    <ellipse cx="60" cy="76" rx="24" ry="20" fill="#38A169" />
    <ellipse cx="180" cy="74" rx="26" ry="22" fill="#48BB78" />
    <ellipse cx="205" cy="78" rx="22" ry="18" fill="#38A169" />
    <ellipse cx="355" cy="72" rx="36" ry="28" fill="#48BB78" />
    <ellipse cx="380" cy="78" rx="28" ry="24" fill="#2F855A" />
    <ellipse cx="325" cy="79" rx="24" ry="20" fill="#38A169" />

    {/* Road Surface */}
    <path d="M0 86H400V200H0V86Z" fill="#4A5568" />
    <path d="M0 86H400V105H0V86Z" fill="#5A677D" />

    {/* Road Side Kerb / Pavement */}
    <rect x="0" y="84" width="400" height="5" fill="#CBD5E1" />
    <line x1="0" y1="89" x2="400" y2="89" stroke="#E2E8F0" strokeWidth="2" strokeDasharray="16 12" />

    {/* Dashed White Highway Center Line */}
    <line x1="20" y1="128" x2="90" y2="128" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeDasharray="18 16" />
    <line x1="120" y1="128" x2="260" y2="128" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeDasharray="18 16" />
    <line x1="290" y1="128" x2="380" y2="128" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeDasharray="18 16" />

    {/* Road Skid Mark */}
    <path d="M70 148 C100 145 130 152 165 150" stroke="#2D3748" strokeWidth="3.5" strokeLinecap="round" opacity="0.6" />

    {/* ----------------- VEHICLE 1: CAR (Left) ----------------- */}
    <g transform="translate(90, 88)">
      {/* Car Shadow */}
      <ellipse cx="50" cy="38" rx="46" ry="7" fill="#2D3748" fillOpacity="0.5" />
      {/* Car Body */}
      <path
        d="M6 26C6 24 16 14 26 12H72C80 12 90 22 92 26L95 32C95 34 93 36 90 36H8C5 36 4 34 5 32L6 26Z"
        fill="#FFFFFF"
        stroke="#CBD5E1"
        strokeWidth="1.5"
      />
      {/* Car Cabin & Windows */}
      <path d="M25 14L32 23H66L62 14H25Z" fill="#3B82F6" fillOpacity="0.35" />
      <path d="M68 23H86L79 15H66L68 23Z" fill="#3B82F6" fillOpacity="0.35" />
      {/* Headlight & Bumper */}
      <rect x="91" y="27" width="4" height="4" rx="1" fill="#FBBF24" />
      <rect x="4" y="27" width="3" height="4" rx="1" fill="#EF4444" />
      {/* Wheels */}
      <circle cx="24" cy="36" r="8" fill="#1E293B" />
      <circle cx="24" cy="36" r="4" fill="#94A3B8" />
      <circle cx="76" cy="36" r="8" fill="#1E293B" />
      <circle cx="76" cy="36" r="4" fill="#94A3B8" />
    </g>

    {/* ----------------- VEHICLE 2: OVERTURNED MOTORCYCLE & DEBRIS ----------------- */}
    <g transform="translate(60, 132)">
      {/* Motorcycle Frame */}
      <ellipse cx="40" cy="18" rx="32" ry="6" fill="#1A202C" fillOpacity="0.4" />
      <path d="M18 16L32 6L54 10L42 20L18 16Z" fill="#3182CE" />
      {/* Wheels on side */}
      <ellipse cx="20" cy="16" rx="9" ry="5" fill="#1E293B" stroke="#4A5568" strokeWidth="2" />
      <ellipse cx="56" cy="18" rx="9" ry="5" fill="#1E293B" stroke="#4A5568" strokeWidth="2" />
      {/* Handlebar & Exhaust */}
      <line x1="30" y1="6" x2="36" y2="2" stroke="#A0AEC0" strokeWidth="2" strokeLinecap="round" />
      <rect x="25" y="19" width="22" height="3" rx="1.5" fill="#E2E8F0" />
      {/* Accident Debris / Glass */}
      <polygon points="68,14 72,12 70,16" fill="#E2E8F0" />
      <polygon points="74,18 78,16 75,20" fill="#E2E8F0" />
      {/* Helmet on Ground */}
      <ellipse cx="10" cy="22" rx="6" ry="5" fill="#E53E3E" />
      <path d="M6 22C6 20 10 18 13 18C15 18 16 20 16 22H6Z" fill="#1A202C" />
    </g>

    {/* ----------------- AMBULANCE ARRIVING (Right) ----------------- */}
    <g transform="translate(215, 70)">
      {/* Siren Flash Effect */}
      <circle cx="65" cy="4" r="14" fill="#EF4444" fillOpacity="0.25" />
      <line x1="65" y1="-8" x2="65" y2="-2" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="56" y1="-5" x2="60" y2="-1" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
      <line x1="74" y1="-5" x2="70" y2="-1" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />

      {/* Flashing Siren Light on Roof */}
      <rect x="61" y="4" width="8" height="5" rx="2" fill="#EF4444" />
      <rect x="63" y="2" width="4" height="3" rx="1" fill="#FCA5A5" />

      {/* Ambulance Van Shadow */}
      <ellipse cx="65" cy="56" rx="60" ry="8" fill="#1E293B" fillOpacity="0.4" />

      {/* Ambulance Main Body */}
      <path
        d="M8 18C8 12 12 8 18 8H100C106 8 110 12 110 18V44C110 48 108 50 104 50H12C8 50 8 48 8 44V18Z"
        fill="#FFFFFF"
        stroke="#E2E8F0"
        strokeWidth="1.5"
      />
      {/* Front Cab Slope */}
      <path d="M10 22L2 34V46C2 48 4 50 8 50H14V22H10Z" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      {/* Windshield & Cab Windows */}
      <path d="M6 32L12 20H26V35H6V32Z" fill="#38BDF8" fillOpacity="0.4" />
      <rect x="32" y="16" width="22" height="14" rx="2" fill="#38BDF8" fillOpacity="0.3" />
      <rect x="60" y="16" width="34" height="14" rx="2" fill="#38BDF8" fillOpacity="0.3" />

      {/* Red Emergency Stripe */}
      <rect x="2" y="36" width="108" height="5" fill="#EF4444" />

      {/* Medical Cross Badge on Side */}
      <circle cx="78" cy="27" r="9" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
      <rect x="76" y="21" width="4" height="12" rx="1" fill="#EF4444" />
      <rect x="72" y="25" width="12" height="4" rx="1" fill="#EF4444" />

      {/* Headlights & Tail Lights */}
      <rect x="2" y="40" width="3" height="4" rx="1" fill="#FCD34D" />
      <rect x="108" y="40" width="2" height="5" rx="1" fill="#EF4444" />

      {/* Ambulance Wheels */}
      <circle cx="28" cy="50" r="10" fill="#1E293B" />
      <circle cx="28" cy="50" r="5" fill="#94A3B8" />
      <circle cx="90" cy="50" r="10" fill="#1E293B" />
      <circle cx="90" cy="50" r="5" fill="#94A3B8" />
    </g>

    {/* ----------------- INJURED PERSON / RESPONDER ON ROADSIDE ----------------- */}
    <g transform="translate(260, 130)">
      {/* Person Sitting Shadow */}
      <ellipse cx="38" cy="46" rx="22" ry="6" fill="#1E293B" fillOpacity="0.35" />
      {/* Head */}
      <circle cx="44" cy="16" r="6.5" fill="#FBBF24" />
      {/* Hair */}
      <path d="M40 14C40 10 44 9 48 9C51 9 52 11 51 14H40Z" fill="#475569" />
      {/* Orange/Hi-Vis Safety Jacket Body */}
      <path d="M36 24C36 22 40 20 44 20C48 20 52 22 52 24L56 38H32L36 24Z" fill="#F97316" />
      {/* Silver Hi-Vis Reflective Strips */}
      <line x1="34" y1="30" x2="54" y2="30" stroke="#E2E8F0" strokeWidth="2.5" />
      {/* Arm supporting body */}
      <line x1="36" y1="26" x2="22" y2="38" stroke="#F97316" strokeWidth="4" strokeLinecap="round" />
      <circle cx="22" cy="38" r="3" fill="#FBBF24" />
      {/* Blue Trousers (Legs extended on ground) */}
      <path d="M34 38L56 42L72 44L72 48L54 48L32 40Z" fill="#1E3A8A" />
      <ellipse cx="73" cy="46" rx="4" ry="2.5" fill="#1E293B" />
    </g>

    <defs>
      <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="120" gradientUnits="userSpaceOnUse">
        <stop stopColor="#E0F2FE" />
        <stop offset="1" stopColor="#BAE6FD" />
      </linearGradient>
    </defs>
  </svg>
);

// 3. Pregnancy Care Hero Banner Scene (Image 2)
export const PregnancyCareBannerIllustration: React.FC<{ className?: string }> = ({ className = 'w-full h-44 sm:h-52' }) => (
  <svg
    viewBox="0 0 400 200"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    preserveAspectRatio="xMidYMid slice"
  >
    {/* Clinic Room Wall */}
    <rect width="400" height="200" fill="url(#clinicGrad)" />

    {/* Room Floor */}
    <rect x="0" y="145" width="400" height="55" fill="#EDE9FE" />
    <line x1="0" y1="145" x2="400" y2="145" stroke="#DDD6FE" strokeWidth="2" />

    {/* Window with Soft Light Curtains in Background */}
    <rect x="140" y="12" width="120" height="110" rx="6" fill="#E0F2FE" stroke="#BAE6FD" strokeWidth="2" />
    <rect x="142" y="14" width="56" height="50" fill="#F0F9FF" />
    <rect x="202" y="14" width="56" height="50" fill="#F0F9FF" />
    <rect x="142" y="68" width="56" height="50" fill="#F0F9FF" />
    <rect x="202" y="68" width="56" height="50" fill="#F0F9FF" />
    {/* Soft Sheer Curtains */}
    <path d="M136 12C144 40 142 80 138 122H146C152 70 148 30 146 12H136Z" fill="#FFFFFF" fillOpacity="0.6" />
    <path d="M264 12C256 40 258 80 262 122H254C248 70 252 30 254 12H264Z" fill="#FFFFFF" fillOpacity="0.6" />

    {/* ----------------- LEFT POTTED PLANT & NIGHTSTAND ----------------- */}
    <g transform="translate(40, 75)">
      {/* Small Stand Table */}
      <rect x="6" y="44" width="34" height="28" rx="3" fill="#93C5FD" fillOpacity="0.4" stroke="#60A5FA" strokeWidth="1" />
      <rect x="12" y="52" width="22" height="4" rx="1" fill="#3B82F6" fillOpacity="0.3" />
      {/* Plant Pot */}
      <path d="M15 44L17 28H31L33 44H15Z" fill="#0284C7" />
      <ellipse cx="24" cy="28" rx="7" ry="2" fill="#0369A1" />
      {/* Monstera / Indoor Leaves */}
      <path d="M24 26C20 16 12 18 10 14C10 22 18 24 24 26Z" fill="#22C55E" />
      <path d="M24 26C28 14 36 16 38 12C38 20 30 24 24 26Z" fill="#16A34A" />
      <path d="M24 26C24 10 20 6 24 4C28 6 24 14 24 26Z" fill="#4ADE80" />
      <path d="M24 26C16 22 14 26 12 28C16 30 20 28 24 26Z" fill="#15803D" />
    </g>

    {/* ----------------- FLOATING HEART CARE BADGE ----------------- */}
    <g transform="translate(178, 22)">
      {/* Radiating Soft Ring */}
      <circle cx="22" cy="22" r="21" fill="#FCE7F3" fillOpacity="0.6" />
      {/* Circle Badge */}
      <circle cx="22" cy="22" r="16" fill="#F43F5E" />
      {/* White Heart Symbol */}
      <path
        d="M22 28.5L16.2 22.8C14.1 20.7 14.1 17.3 16.2 15.2C18.3 13.1 21.7 13.1 23.8 15.2L22 17L20.2 15.2C18.1 13.1 14.7 13.1 12.6 15.2C10.5 17.3 10.5 20.7 12.6 22.8L22 28.5Z"
        fill="#FFFFFF"
        transform="translate(4, -2) scale(0.85)"
      />
    </g>

    {/* ----------------- CLINIC BED & MATTRESS ----------------- */}
    <g transform="translate(70, 80)">
      {/* Bed Frame & Headboard */}
      <rect x="180" y="24" width="8" height="60" rx="3" fill="#60A5FA" />
      <rect x="8" y="52" width="6" height="32" rx="2" fill="#60A5FA" />
      {/* Bed Mattress Base */}
      <path d="M10 56H184V72C184 75 181 78 178 78H16C13 78 10 75 10 72V56Z" fill="#93C5FD" />
      {/* Soft Blue Comforter / Quilt */}
      <path
        d="M16 48C16 45 19 43 22 43H176C179 43 182 45 182 48V58H16V48Z"
        fill="#BFDBFE"
      />
      {/* Pillow Under Head */}
      <ellipse cx="160" cy="40" rx="18" ry="10" fill="#FFFFFF" stroke="#DBEAFE" strokeWidth="1.5" />
    </g>

    {/* ----------------- PREGNANT MOTHER RESTING (Pink Dress) ----------------- */}
    <g transform="translate(90, 72)">
      {/* Head */}
      <circle cx="134" cy="30" r="11" fill="#FCD34D" />
      {/* Brunette Hair */}
      <path
        d="M125 30C123 20 131 16 141 17C148 18 150 25 146 33C143 31 140 28 135 28C130 28 126 31 125 30Z"
        fill="#78350F"
      />
      <path d="M142 27C146 32 147 40 144 48C142 46 141 42 140 38L142 27Z" fill="#78350F" />

      {/* Relaxed Happy Facial Profile */}
      <path d="M130 32C130 32 128 33 129 35" stroke="#92400E" strokeWidth="1" strokeLinecap="round" />
      <path d="M133 29C132 29 131 29 130 30" stroke="#92400E" strokeWidth="1.2" strokeLinecap="round" />

      {/* Mother Body & Pink Maternity Gown */}
      {/* Upper Torso */}
      <path
        d="M126 38C120 40 114 44 108 50L98 62H140L135 44C134 40 130 38 126 38Z"
        fill="#F472B6"
      />
      {/* Large Pregnant Baby Bump Curve */}
      <path
        d="M106 48C90 48 78 62 82 78H132C136 64 124 48 106 48Z"
        fill="#F472B6"
      />
      {/* Light Gown Highlight & Fold */}
      <path
        d="M104 52C94 52 86 63 88 74C94 65 104 57 114 55C110 53 107 52 104 52Z"
        fill="#FBCFE8"
        fillOpacity="0.7"
      />
      {/* Lower Legs under Bed Blanket */}
      <path
        d="M35 72C40 68 55 68 84 76L82 82H26L35 72Z"
        fill="#F9A8D4"
      />

      {/* Caring Hands on Baby Bump */}
      {/* Arm 1 (Reaching down onto tummy) */}
      <path
        d="M124 44C118 48 112 56 106 62C102 65 96 66 94 64C93 62 96 58 100 56L116 42L124 44Z"
        fill="#FCD34D"
      />
      {/* Second Hand resting gently */}
      <ellipse cx="94" cy="65" rx="5" ry="3.5" fill="#FCD34D" />
      <ellipse cx="103" cy="62" rx="5.5" ry="4" fill="#FCD34D" />
    </g>

    {/* ----------------- RIGHT POTTED PLANT ----------------- */}
    <g transform="translate(325, 68)">
      {/* Nightstand */}
      <rect x="4" y="52" width="34" height="28" rx="3" fill="#93C5FD" fillOpacity="0.4" stroke="#60A5FA" strokeWidth="1" />
      {/* Modern Plant Pot */}
      <path d="M12 52L15 36H27L30 52H12Z" fill="#FB7185" />
      <ellipse cx="21" cy="36" rx="6" ry="2" fill="#E11D48" />
      {/* Botanical Leaves */}
      <path d="M21 34C16 22 8 26 6 20C7 30 16 32 21 34Z" fill="#16A34A" />
      <path d="M21 34C26 22 34 24 36 18C35 28 26 32 21 34Z" fill="#22C55E" />
      <path d="M21 34C21 16 26 12 22 8C18 12 21 22 21 34Z" fill="#4ADE80" />
    </g>

    <defs>
      <linearGradient id="clinicGrad" x1="200" y1="0" x2="200" y2="150" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F5F3FF" />
        <stop offset="0.7" stopColor="#EDE9FE" />
        <stop offset="1" stopColor="#E0E7FF" />
      </linearGradient>
    </defs>
  </svg>
);

// 4. Circular Red Badge with Glowing Car Icon (Image 3 Option 1)
export const RoadAccidentBadgeIcon: React.FC<{ className?: string }> = ({ className = 'w-13 h-13' }) => (
  <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Red Gradient Background */}
    <circle cx="30" cy="30" r="28" fill="url(#accidentRedGrad)" />
    
    {/* Glowing rays around car */}
    <line x1="16" y1="20" x2="11" y2="17" stroke="#FEF2F2" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />
    <line x1="20" y1="15" x2="17" y2="10" stroke="#FEF2F2" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />
    <line x1="27" y1="13" x2="27" y2="7" stroke="#FEF2F2" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.8" />

    {/* White Car Graphic */}
    <path
      d="M17 32C17 30 23 23 29 22H42C46 22 51 28 52 31L53 35C53 37 52 38 50 38H19C17 38 16 37 17 35L17 32Z"
      fill="#FFFFFF"
    />
    {/* Car Window */}
    <path d="M29 24L33 30H43L40 24H29Z" fill="#EF4444" fillOpacity="0.85" />
    <path d="M44 30H50L46 25H41L44 30Z" fill="#EF4444" fillOpacity="0.85" />
    {/* Wheels */}
    <circle cx="25" cy="38" r="4.5" fill="#1E293B" stroke="#FFFFFF" strokeWidth="1.5" />
    <circle cx="45" cy="38" r="4.5" fill="#1E293B" stroke="#FFFFFF" strokeWidth="1.5" />

    <defs>
      <linearGradient id="accidentRedGrad" x1="10" y1="6" x2="52" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F87171" />
        <stop offset="0.4" stopColor="#EF4444" />
        <stop offset="1" stopColor="#DC2626" />
      </linearGradient>
    </defs>
  </svg>
);

// 5. Circular Purple Badge with Pregnant Mother Icon (Image 3 Option 2)
export const PregnancyBadgeIcon: React.FC<{ className?: string }> = ({ className = 'w-13 h-13' }) => (
  <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    {/* Purple Gradient Background */}
    <circle cx="30" cy="30" r="28" fill="url(#pregnancyPurpGrad)" />

    {/* Pregnant Woman Silhouette / Illustration */}
    <circle cx="30" cy="18" r="5" fill="#FDE047" />
    {/* Hair */}
    <path d="M26 18C25 14 29 12 33 13C36 14 36 17 35 20C33 19 31 18 29 18H26Z" fill="#451A03" />

    {/* Dress with Baby Bump */}
    <path
      d="M26 25C24 28 20 33 20 38C20 44 24 47 30 47C36 47 40 44 40 38C40 33 36 28 34 25L30 24L26 25Z"
      fill="#FFFFFF"
    />
    {/* Belly Baby Bump Highlight */}
    <path
      d="M23 37C23 32 27 28 32 28C34 28 36 29 37 31C35 30 32 30 29 32C26 34 24 37 24 40C23.3 39 23 38 23 37Z"
      fill="#DDD6FE"
    />
    {/* Hands over belly in pink */}
    <ellipse cx="28" cy="36" rx="4" ry="2.5" fill="#FDE047" />

    <defs>
      <linearGradient id="pregnancyPurpGrad" x1="10" y1="6" x2="52" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#A78BFA" />
        <stop offset="0.4" stopColor="#8B5CF6" />
        <stop offset="1" stopColor="#6D28D9" />
      </linearGradient>
    </defs>
  </svg>
);
