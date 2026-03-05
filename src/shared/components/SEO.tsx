
import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description?: string;
  keywords?: string;
  author?: string;
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  twitterCard?: 'summary' | 'summary_large_image';
  noindex?: boolean;
  children?: React.ReactNode;
}  

const SEO: React.FC<SEOProps> = ({
  title,
  description = "Official E-learning portal for our school system.",
  keywords = "elearning, school, education, clubs, library, courses, online learning, student portal, university, university portal, trespics, trespics institute, trespics school, trespics university, tech, technology",
  author = "Trespics Institute",
  canonical,
  ogTitle,    
  ogDescription,
  ogImage,
  ogUrl,
  twitterCard = 'summary_large_image',
  noindex = false,
  children
}) => {
  const siteTitle = `${title} | Trespics Institute`;
  const currentUrl = ogUrl || (typeof window !== 'undefined' ? window.location.href : '');

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{siteTitle}</title>
      <meta name="description" content={ogDescription || description} />
      <meta name="keywords" content={keywords} />
      <meta name="author" content={author} />

      {/* Robots indexing */}
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}

      {/* Canonical URL */}
      {canonical && <link rel="canonical" href={canonical} />}

      {/* Open Graph Tags */}
      <meta property="og:title" content={ogTitle || siteTitle} />
      <meta property="og:description" content={ogDescription || description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={currentUrl} />
      {ogImage && <meta property="og:image" content={ogImage} />}

      {/* Twitter Card Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={ogTitle || siteTitle} />
      <meta name="twitter:description" content={ogDescription || description} />
      {ogImage && <meta name="twitter:image" content={ogImage} />}

      {children}
    </Helmet>
  );
};

export default SEO;
