export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: { DEFAULT: "#0b0d10", elevated: "#12161b", muted: "#1a2027" },
        border: { DEFAULT: "#232a33", subtle: "#1a2027" },
        accent: { DEFAULT: "#7c5cff", soft: "#5b45c9" },
        success: "#34d399", warning: "#f59e0b", danger: "#ef4444",
      },
    },
  },
  plugins: [],
};