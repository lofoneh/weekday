import "./env.js";

/** @type {import("next").NextConfig} */
const config = {
  compiler: {
    reactRemoveProperties: process.env.NODE_ENV === "production",
    removeConsole: process.env.NODE_ENV === "production",
  },
  // experimental: {
  //   optimizeCss: true,
  //   optimizePackageImports: ["@radix-ui/react-select"],
  //   scrollRestoration: true,
  // },
  images: {
    remotePatterns: [
      {
        hostname: "lh3.googleusercontent.com",
        protocol: "https",
      },
      {
        hostname: "res.cloudinary.com",
        protocol: "https",
      },
    ],
  },
  reactStrictMode: true,
};

export default config;
