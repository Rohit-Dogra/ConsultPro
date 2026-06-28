import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  noindex?: boolean;
  canonical?: string;
}

const SEOHead = ({
  title = "Expertisestation | Your premier destination for professional expertise",
  description = "Expertisestation - Your premier destination for professional expertise, knowledge sharing, and skill development. Connect with industry experts and elevate your professional journey.",
  keywords = "expertise, professional development, industry experts, knowledge sharing, skill development, consultation, business advice",
  image = "/og-image.webp",
  url = "https://expertisestation.com",
  type = "website",
  author = "Brenstoneinternational",
  publishedTime,
  modifiedTime,
  section,
  tags = [],
  noindex = false,
  canonical
}: SEOHeadProps) => {
  const fullImageUrl = image.startsWith('http') ? image : `${url}${image}`;
  const fullUrl = url.includes(window.location.pathname) ? url : `${url}${window.location.pathname}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonical || fullUrl} />
      
      {/* Robots */}
      {noindex && <meta name="robots" content="noindex,nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={fullImageUrl} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="Expertisestation" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={fullImageUrl} />
      
      {/* Article specific */}
      {publishedTime && <meta property="article:published_time" content={publishedTime} />}
      {modifiedTime && <meta property="article:modified_time" content={modifiedTime} />}
      {author && <meta property="article:author" content={author} />}
      {section && <meta property="article:section" content={section} />}
      {tags.map(tag => (
        <meta key={tag} property="article:tag" content={tag} />
      ))}
      
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === "article" ? "Article" : "WebSite",
          "name": title,
          "description": description,
          "url": fullUrl,
          "image": fullImageUrl,
          "author": {
            "@type": "Organization",
            "name": author
          },
          ...(type === "article" && publishedTime && {
            "datePublished": publishedTime,
            "dateModified": modifiedTime || publishedTime
          })
        })}
      </script>
    </Helmet>
  );
};

export default SEOHead;