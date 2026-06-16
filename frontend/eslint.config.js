export default [
  {
    ignores: ["dist/", "node_modules/"],
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },
];
