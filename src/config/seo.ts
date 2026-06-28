export interface PageSEO {
  title: string;
  description: string;
  keywords: string;
  type?: string;
}

export const pageSEOConfig: Record<string, PageSEO> = {
  home: {
    title: "Expertisestation | Connect with Industry Experts",
    description: "Your premier destination for professional expertise. Connect with industry experts, share knowledge, and accelerate your professional development journey.",
    keywords: "expertise platform, industry experts, professional development, knowledge sharing, business consultation, expert network, skill development"
  },
  about: {
    title: "About Expertisestation | Professional Expertise Platform",
    description: "Learn about Expertisestation's mission to connect professionals with industry experts for knowledge sharing and skill development.",
    keywords: "about expertisestation, company mission, professional platform, expert network, team"
  },
  network: {
    title: "Expert Network | Find Industry Professionals",
    description: "Browse our extensive network of verified industry experts across various domains. Find the right professional for your consultation needs.",
    keywords: "expert network, industry professionals, business consultants, verified experts, professional services"
  },
  features: {
    title: "Platform Features | Expertisestation Capabilities",
    description: "Discover powerful features that make Expertisestation the leading platform for professional expertise and knowledge sharing.",
    keywords: "platform features, expertise sharing, professional tools, consultation features, expert matching"
  },
  insights: {
    title: "Industry Insights | Professional Knowledge Hub",
    description: "Access valuable industry insights, trends, and professional knowledge shared by our network of verified experts.",
    keywords: "industry insights, professional knowledge, business trends, expert analysis, market intelligence"
  },
  products: {
    title: "Our Products | Professional Services & Solutions",
    description: "Explore our range of professional services and solutions designed to accelerate your business growth and development.",
    keywords: "professional services, business solutions, consultation products, expert services, business development"
  },
  contact: {
    title: "Contact Us | Get in Touch with Expertisestation",
    description: "Contact Expertisestation for inquiries about our platform, services, or partnership opportunities. We're here to help.",
    keywords: "contact expertisestation, customer support, business inquiries, partnership, help center"
  },
  pricing: {
    title: "Pricing Plans | Affordable Expert Consultation",
    description: "Choose from flexible pricing plans for accessing expert consultations and professional services on Expertisestation.",
    keywords: "pricing plans, consultation rates, expert fees, subscription plans, professional services cost"
  },
  blog: {
    title: "Blog | Professional Insights & Industry News",
    description: "Stay updated with the latest professional insights, industry news, and expert opinions on our comprehensive blog.",
    keywords: "professional blog, industry news, expert insights, business articles, professional development"
  },
  careers: {
    title: "Careers | Join the Expertisestation Team",
    description: "Explore career opportunities at Expertisestation. Join our mission to connect professionals with industry expertise.",
    keywords: "careers, job opportunities, expertisestation jobs, professional careers, team positions"
  },
  expertsPublic: {
    title: "Browse Experts | Find Professional Consultants",
    description: "Browse our public directory of verified experts and professional consultants across various industries and domains.",
    keywords: "browse experts, professional consultants, expert directory, industry specialists, verified professionals"
  },
  getStarted: {
    title: "Get Started | Begin Your Expert Journey",
    description: "Start your journey with Expertisestation. Connect with experts, share knowledge, and accelerate your professional growth.",
    keywords: "get started, expert platform, professional development, consultation services, expert matching"
  },
  seekerAuth: {
    title: "Seeker Login & Signup | Expertisestation",
    description: "Login or create your seeker account to connect with industry experts and access professional consultation services.",
    keywords: "seeker login, seeker signup, solution seeker, expert consultation, professional help"
  },
  expertAuth: {
    title: "Expert Login & Signup | Expertisestation",
    description: "Login or join as an expert to share your knowledge and provide professional consultation services to seekers.",
    keywords: "expert login, expert signup, become expert, share expertise, professional consulting"
  },
  webinar: {
    title: "Webinars | Expert-Led Professional Sessions",
    description: "Join expert-led webinars and professional sessions to enhance your skills and knowledge in various industry domains.",
    keywords: "webinars, expert sessions, professional training, online learning, skill development"
  },
  privacyPolicy: {
    title: "Privacy Policy | Expertisestation Data Protection",
    description: "Learn about Expertisestation's privacy policy and how we protect your personal information and data.",
    keywords: "privacy policy, data protection, personal information, GDPR compliance, data security"
  },
  termsOfService: {
    title: "Terms of Service | Expertisestation User Agreement",
    description: "Read Expertisestation's terms of service and user agreement for using our professional expertise platform.",
    keywords: "terms of service, user agreement, platform rules, legal terms, service conditions"
  }
};