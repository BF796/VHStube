export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom YouTube-like dark mode colors
        vhsDark: '#0f0f0f',
        vhsLightGray: '#272727',
        vhsText: '#f1f1f1',
        vhsRed: '#ff0000'
      }
    },
  },
  plugins: [],
}