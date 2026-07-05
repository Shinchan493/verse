module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Verse — editorial warm palette
        paper: '#faf7f2',
        'paper-2': '#f2ece1',
        ink: '#1a1a1a',
        'ink-soft': '#57514a',
        'ink-faint': '#8a8279',
        accent: {
          DEFAULT: '#b45309',
          hover: '#92400e',
          soft: '#fbe4cf',
          tint: '#fdf3e7',
        },
      },
      fontFamily: {
        serif: ['Fraunces', 'Georgia', 'Cambria', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      maxWidth: {
        container: '85rem',
        '1/2': '50%',
      },
      borderWidth: {
        6: '6px',
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
