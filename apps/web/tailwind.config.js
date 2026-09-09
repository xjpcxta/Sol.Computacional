/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        canvas: 'var(--surface-canvas)',
        surface: 'var(--surface-raised)',
        overlay: 'var(--surface-overlay)',
        drawer: 'var(--surface-drawer)',
        sidebar: 'var(--surface-sidebar)',
        sticky: 'var(--surface-sticky)',
        input: 'var(--surface-input)',
        error: 'var(--text-error)',
        warning: 'var(--amber-400)',
        success: 'var(--mineral-400)',
        info: 'var(--blue-400)',
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          tertiary: 'var(--text-tertiary)',
        },
        accent: {
          DEFAULT: 'var(--accent-bg)',
          hover: 'var(--accent-bg-hover)',
          soft: 'var(--accent-soft)',
          foreground: 'var(--text-on-accent)',
        },
        line: {
          subtle: 'var(--border-subtle)',
          DEFAULT: 'var(--border-default)',
          strong: 'var(--border-strong)',
        },
      },
      fontFamily: {
        display: ['Manrope', 'sans-serif'],
        sans: ['Manrope', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      boxShadow: {
        overlay: 'var(--shadow-overlay)',
        focus: 'var(--shadow-focus)',
      },
      borderRadius: {
        input: 'var(--radius-input)',
        button: 'var(--radius-button)',
        panel: 'var(--radius-panel)',
        media: 'var(--radius-media)',
      },
      transitionDuration: {
        fast: 'var(--motion-fast)',
        base: 'var(--motion-base)',
        medium: 'var(--motion-medium)',
        slow: 'var(--motion-slow)',
      },
      transitionTimingFunction: {
        out: 'var(--ease-out)',
      },
      keyframes: {
        shimmer: {
          from: { transform: 'translateX(-100%)' },
          to: { transform: 'translateX(100%)' },
        },
        spin: {
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.6s linear infinite',
        spin: 'spin 0.8s linear infinite',
      },
    },
  },
  plugins: [],
};
