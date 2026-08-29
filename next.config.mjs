/** @type {import('next').NextConfig} */
const nextConfig = {
  // Uncomment the line below if you want a fully static site
  // (required for GitHub Pages, optional for Vercel/Netlify):
  // output: 'export',

  // Keep the review scraper's package out of the bundler; load it at runtime
  // inside the /api/wishlist/scrape serverless function.
  serverExternalPackages: ["google-play-scraper"],
};

export default nextConfig;
