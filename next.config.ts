const nextConfig = {
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      { 
        protocol: "https", 
        hostname: "s4.anilist.co"
      },
      { 
        protocol: "https",
         hostname: "*.anilist.co"
      },
    ],
  },
};

export default nextConfig;