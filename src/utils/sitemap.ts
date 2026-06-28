export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority?: number;
}

export const generateSitemap = (urls: SitemapUrl[]): string => {
  const urlElements = urls.map(url => `
  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    ${url.changefreq ? `<changefreq>${url.changefreq}</changefreq>` : ''}
    ${url.priority ? `<priority>${url.priority}</priority>` : ''}
  </url>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlElements}
</urlset>`;
};

export const sitemapUrls: SitemapUrl[] = [
  { loc: 'https://expertisestation.com/', changefreq: 'daily', priority: 1.0 },
  { loc: 'https://expertisestation.com/about', changefreq: 'monthly', priority: 0.8 },
  { loc: 'https://expertisestation.com/network', changefreq: 'weekly', priority: 0.9 },
  { loc: 'https://expertisestation.com/features', changefreq: 'monthly', priority: 0.8 },
  { loc: 'https://expertisestation.com/insights', changefreq: 'weekly', priority: 0.8 },
  { loc: 'https://expertisestation.com/products', changefreq: 'monthly', priority: 0.8 },
  { loc: 'https://expertisestation.com/contact', changefreq: 'monthly', priority: 0.7 },
  { loc: 'https://expertisestation.com/pricing', changefreq: 'monthly', priority: 0.9 },
  { loc: 'https://expertisestation.com/blog', changefreq: 'daily', priority: 0.8 },
  { loc: 'https://expertisestation.com/careers', changefreq: 'weekly', priority: 0.7 },
  { loc: 'https://expertisestation.com/experts-public', changefreq: 'daily', priority: 0.9 },
  { loc: 'https://expertisestation.com/get-started', changefreq: 'monthly', priority: 0.8 },
  { loc: 'https://expertisestation.com/privacypolicy', changefreq: 'yearly', priority: 0.3 },
  { loc: 'https://expertisestation.com/termofservice', changefreq: 'yearly', priority: 0.3 },
];