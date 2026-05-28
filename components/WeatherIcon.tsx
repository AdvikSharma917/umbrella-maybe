import React from 'react';

interface IconProps {
  name: string;
  className?: string;
}

export default function WeatherIcon({ name, className = 'w-6 h-6' }: IconProps) {
  switch (name) {
    case 'sunny':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${className} text-amber-400`}
        >
          <circle cx="12" cy="12" r="4" fill="currentColor" fillOpacity="0.2" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
        </svg>
      );

    case 'partly-cloudy':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          {/* Sun behind */}
          <path
            d="M12 2v2M4.93 4.93l1.41 1.41M2 12h2M6.34 17.66l-1.41 1.41"
            className="text-amber-400"
          />
          <circle cx="12" cy="12" r="4" className="text-amber-400" fill="currentColor" fillOpacity="0.1" />
          {/* Cloud in front */}
          <path
            d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42 0-.83.07-1.22.2A5 5 0 0 0 5 13c0 2.21 1.79 4 4 4"
            className="text-slate-300"
            fill="currentColor"
            fillOpacity="0.2"
          />
        </svg>
      );

    case 'cloudy':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${className} text-slate-400`}
        >
          <path
            d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42 0-.83.07-1.22.2A5 5 0 0 0 5 13c0 2.21 1.79 4 4 4h8.5z"
            fill="currentColor"
            fillOpacity="0.2"
          />
        </svg>
      );

    case 'foggy':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${className} text-slate-400`}
        >
          <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42 0-.83.07-1.22.2A5 5 0 0 0 5 13c0 2.21 1.79 4 4 4" />
          <path d="M5 20h14M8 17h8" strokeWidth="1.5" />
        </svg>
      );

    case 'drizzle':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${className} text-sky-400`}
        >
          <path
            d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42 0-.83.07-1.22.2A5 5 0 0 0 5 13c0 2.21 1.79 4 4 4h8.5z"
            className="text-slate-400"
            fill="currentColor"
            fillOpacity="0.1"
          />
          <path d="M8 20v2M12 20v2M16 20v2" strokeWidth="1.5" strokeDasharray="1 3" />
        </svg>
      );

    case 'rainy':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${className} text-blue-400`}
        >
          <path
            d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42 0-.83.07-1.22.2A5 5 0 0 0 5 13c0 2.21 1.79 4 4 4h8.5z"
            className="text-slate-400"
            fill="currentColor"
            fillOpacity="0.2"
          />
          <path d="M8 19l-2 3M12 19l-2 3M16 19l-2 3" />
        </svg>
      );

    case 'thunderstorm':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path
            d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42 0-.83.07-1.22.2A5 5 0 0 0 5 13c0 2.21 1.79 4 4 4h8.5z"
            className="text-slate-500"
            fill="currentColor"
            fillOpacity="0.3"
          />
          <path d="M11 20l-2 3M15 20l-2 3" className="text-blue-400" />
          <path d="M13 13l-3 5h4l-2 4" className="text-amber-400" fill="currentColor" />
        </svg>
      );

    case 'snowy':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${className} text-sky-200`}
        >
          <path
            d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42 0-.83.07-1.22.2A5 5 0 0 0 5 13c0 2.21 1.79 4 4 4h8.5z"
            className="text-slate-400"
            fill="currentColor"
            fillOpacity="0.1"
          />
          <path d="M8 20h.01M12 20h.01M16 20h.01M10 22h.01M14 22h.01" strokeWidth="3" />
        </svg>
      );

    case 'wind':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${className} text-teal-400`}
        >
          <path d="M9.59 4.59A2 2 0 1 1 11 8H2M12.59 9.59a2 2 0 1 1 1.41 3.41H2M15.07 16.07a2 2 0 1 1-1.41 3.41H2" />
        </svg>
      );

    case 'umbrella':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="M22 12a10.06 10.06 0 0 0-20 0Z" fill="currentColor" fillOpacity="0.2" />
          <path d="M12 12v8a2 2 0 0 0 4 0" />
          <path d="M12 2v1" />
        </svg>
      );

    case 'temp':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${className} text-rose-400`}
        >
          <path d="M14 4v10.54a4 4 0 1 1-4 0V4a2 2 0 0 1 4 0Z" />
        </svg>
      );

    case 'precipitation':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${className} text-sky-400`}
        >
          <path d="M12 22a7 7 0 0 0 5-12.2L12 3 7 9.8a7 7 0 0 0 5 12.2z" fill="currentColor" fillOpacity="0.2" />
        </svg>
      );

    case 'search':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      );

    case 'location':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${className} text-emerald-400`}
        >
          <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      );

    case 'chevron':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={className}
        >
          <path d="m9 18 6-6-6-6" />
        </svg>
      );

    case 'spinner':
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${className} animate-spin text-indigo-400`}
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
      );

    default:
      return (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={className}
        >
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
}
