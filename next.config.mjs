/** @type {import('next').NextConfig} */
const nextConfig = {
  // Uncomment the line below if you want a fully static site
  // (required for GitHub Pages, optional for Vercel/Netlify):
  // output: 'export',

  // Keep the review scraper's package out of the bundler; load it at runtime
  // inside the /api/wishlist/scrape serverless function.
  serverExternalPackages: ["google-play-scraper"],

  // Practice moved inside the logged-in module; keep old links working.
  async redirects() {
    return [
      { source: "/practice", destination: "/app/practice", permanent: false },
      { source: "/practice/test", destination: "/app/practice/test", permanent: false },
      { source: "/practice/story", destination: "/app/story", permanent: false },
      { source: "/practice/:slug", destination: "/app/practice/:slug", permanent: false },
    ];
  },
};

export default nextConfig;
