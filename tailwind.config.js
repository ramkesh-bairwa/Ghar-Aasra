// Binds a Tailwind color to a CSS custom property while still supporting
// Tailwind's `/opacity` modifier (e.g. `bg-teal-500/15`) — a plain
// `var(--x)` string loses the modifier because Tailwind can't parse an rgb
// triple out of a var() reference at build time, so it has to be a function.
function withOpacity(variable) {
  return ({ opacityValue }) => {
    if (opacityValue === undefined) return `var(${variable})`;
    return `color-mix(in srgb, var(${variable}) calc(${opacityValue} * 100%), transparent)`;
  };
}

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Core brand palette. These resolve to CSS custom properties
        // (defined in app/globals.css, overridden per-site from the admin
        // Site Settings → Theme colors panel), so every navy/teal/coral/sand
        // className updates live when an admin changes the theme color.
        navy: {
          950: withOpacity("--color-navy-950"),
          900: withOpacity("--color-navy-900"),
          800: withOpacity("--color-navy-800"),
          700: withOpacity("--color-navy-700"),
        },
        teal: {
          600: withOpacity("--color-teal-600"),
          500: withOpacity("--color-teal-500"),
          400: withOpacity("--color-teal-400"),
        },
        coral: {
          600: withOpacity("--color-coral-600"),
          500: withOpacity("--color-coral-500"),
        },
        sand: {
          50: withOpacity("--color-sand-50"),
          100: withOpacity("--color-sand-100"),
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
      },
      boxShadow: {
        card: "0 8px 24px -12px rgba(15, 27, 45, 0.18)",
        soft: "0 2px 10px rgba(15, 27, 45, 0.06)",
      },
      borderRadius: {
        xl2: "1.1rem",
      },
    },
  },
  plugins: [],
};
