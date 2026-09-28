/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        method: {
          question: '#15803d',
          code: '#dc2626',
          subject: '#2563eb',
          verb: 'var(--slot-verb, #111827)',
          v3: '#06b6d4',
          been: '#7c3aed',
          to: 'var(--slot-verb, #111827)',
          object: '#f97316',
          ctx: '#6b7280',
          neg: '#dc2626',
        },
      },
      maxWidth: {
        mobile: '480px',
      },
    },
  },
  plugins: [],
};
