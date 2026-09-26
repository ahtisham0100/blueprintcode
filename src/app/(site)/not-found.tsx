import Link from 'next/link';
import './globals.css';

export default function NotFound() {
  return (
    <main className="not-found-wrapper">
      <div className="not-found-stars" aria-hidden="true" />
      <div className="not-found-glow" aria-hidden="true" />

      <div className="not-found-content">
        {/* Floating Astronaut & Broken Grid SVG */}
        <div className="not-found-illustration" aria-hidden="true">
          <svg
            className="astronaut-svg"
            width="220"
            height="220"
            viewBox="0 0 220 220"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="astroGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="38%" stopColor="#3b82f6" />
                <stop offset="68%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#8b5cf6" />
              </linearGradient>
              <linearGradient id="visorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#3b82f6" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.9" />
              </linearGradient>
              <radialGradient id="planetGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#0a0e1a" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Broken blueprint grid background lines */}
            <g opacity="0.35" stroke="#3b82f6" strokeWidth="1" strokeDasharray="3 3">
              <line x1="20" y1="170" x2="200" y2="170" />
              <line x1="30" y1="185" x2="190" y2="185" />
              <line x1="45" y1="200" x2="175" y2="200" />
              <line x1="60" y1="160" x2="40" y2="205" />
              <line x1="110" y1="160" x2="110" y2="205" />
              <line x1="160" y1="160" x2="180" y2="205" />
            </g>

            {/* Drifting sparkle particles */}
            <circle cx="35" cy="45" r="2" fill="#22d3ee" opacity="0.8" />
            <circle cx="190" cy="60" r="1.5" fill="#8b5cf6" opacity="0.7" />
            <circle cx="175" cy="140" r="2" fill="#22d3ee" opacity="0.6" />
            <circle cx="40" cy="130" r="1.5" fill="#3b82f6" opacity="0.7" />
            <circle cx="110" cy="25" r="2.5" fill="#eef2fb" opacity="0.9" />

            {/* Astronaut body & suit */}
            <g className="astronaut-figure">
              {/* Floating Tether Cable */}
              <path
                d="M110 135 C95 160, 60 145, 45 170 C35 185, 25 180, 15 195"
                stroke="url(#astroGrad)"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
                opacity="0.75"
              />

              {/* Backpack / Life Support */}
              <rect
                x="82"
                y="68"
                width="56"
                height="54"
                rx="14"
                fill="#151b2d"
                stroke="url(#astroGrad)"
                strokeWidth="2"
              />

              {/* Suit Body */}
              <rect
                x="88"
                y="74"
                width="44"
                height="46"
                rx="12"
                fill="#1b2236"
                stroke="#2a3350"
                strokeWidth="1.5"
              />

              {/* Chest Badge / Status Screen */}
              <rect x="98" y="82" width="24" height="12" rx="4" fill="#0a0e1a" stroke="#22d3ee" strokeWidth="1" />
              <circle cx="104" cy="88" r="2" fill="#22d3ee" />
              <circle cx="111" cy="88" r="2" fill="#6366f1" />
              <circle cx="117" cy="88" r="2" fill="#8b5cf6" />

              {/* Legs */}
              <path
                d="M94 118 L90 142 A4 4 0 0 0 98 145 L104 120"
                fill="#151b2d"
                stroke="url(#astroGrad)"
                strokeWidth="1.5"
              />
              <path
                d="M126 118 L130 142 A4 4 0 0 1 122 145 L116 120"
                fill="#151b2d"
                stroke="url(#astroGrad)"
                strokeWidth="1.5"
              />

              {/* Arms reaching in zero gravity */}
              <path
                d="M88 84 Q70 78 66 94 Q64 102 74 102 Q84 100 88 92"
                fill="#151b2d"
                stroke="url(#astroGrad)"
                strokeWidth="1.5"
              />
              <path
                d="M132 84 Q150 78 154 94 Q156 102 146 102 Q136 100 132 92"
                fill="#151b2d"
                stroke="url(#astroGrad)"
                strokeWidth="1.5"
              />

              {/* Gloves */}
              <circle cx="68" cy="98" r="5" fill="#22d3ee" opacity="0.9" />
              <circle cx="152" cy="98" r="5" fill="#8b5cf6" opacity="0.9" />

              {/* Helmet outer */}
              <circle
                cx="110"
                cy="54"
                r="24"
                fill="#151b2d"
                stroke="url(#astroGrad)"
                strokeWidth="2.5"
              />

              {/* Visor with vibrant reflective glow */}
              <ellipse
                cx="110"
                cy="54"
                rx="17"
                ry="13"
                fill="url(#visorGrad)"
              />

              {/* Visor reflection highlight */}
              <path
                d="M100 46 Q110 43 118 46"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.85"
              />
            </g>
          </svg>
        </div>

        {/* 404 Large Glowing Gradient Text */}
        <h1 className="not-found-code">404</h1>

        {/* Heading */}
        <h2 className="not-found-heading">You&apos;ve drifted off the map.</h2>

        {/* Subtext */}
        <p className="not-found-subtext">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Button */}
        <div className="not-found-actions">
          <Link href="/" className="not-found-btn">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            <span>Back to Home</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
