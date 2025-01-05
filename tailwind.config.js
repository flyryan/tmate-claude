/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/electron/renderer/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors can be added here
      },
      keyframes: {
        bounce: {
          '0%, 100%': { transform: 'translateY(0)', opacity: 0.4 },
          '50%': { transform: 'translateY(-4px)', opacity: 1 }
        }
      },
      animation: {
        bounce: 'bounce 1s ease-in-out infinite',
        'bounce-delayed-1': 'bounce 1s ease-in-out infinite 0.2s',
        'bounce-delayed-2': 'bounce 1s ease-in-out infinite 0.4s'
      },
      typography: (theme) => ({
        DEFAULT: {
          css: {
            color: theme('colors.gray.300'),
            a: {
              color: theme('colors.blue.400'),
              '&:hover': {
                color: theme('colors.blue.300'),
              },
            },
            strong: {
              color: theme('colors.gray.200'),
            },
            code: {
              color: theme('colors.gray.200'),
              backgroundColor: theme('colors.gray.800'),
              padding: '0.25rem',
              borderRadius: '0.25rem',
            },
            pre: {
              backgroundColor: theme('colors.gray.900'),
              code: {
                backgroundColor: 'transparent',
                padding: 0,
              },
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}
