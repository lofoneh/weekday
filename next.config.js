import "./env.js";

/** @type {import("next").NextConfig} */
const config = {
  experimental: {
    nodeMiddleware: true,
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default config;
