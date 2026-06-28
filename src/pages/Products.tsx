import { FC } from "react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Real from '@/img/products/Real Estate.jpg';
import Cab from '@/img/products/Cab Booking.jpg';
import Parcel from '@/img/products/Parcel Booking.jpg';
import SEOHead from "@/components/SEO/SEOHead";
import { pageSEOConfig } from "@/config/seo";

const products = [
  {
    id: 1,
    title: "CRM",
    description: "CRM platform with advanced analytics and reporting capabilities.",
    imageUrl: "https://static.wingify.com/gcp/uploads/sites/18/2023/08/CRM.png",
    demoUrl: "https://pm.naukarinavigator.com/forms/wtl/2190a3595f7c90fae4bde25370f6a4c9"
  },
  {
    id: 2,
    title: "Project Management",
    description: "Proect management tool with all the features you need to manage your projects.",
    imageUrl: "https://media.licdn.com/dms/image/D4D12AQHAzpZZDBIkfA/article-cover_image-shrink_720_1280/0/1710486640359?e=2147483647&v=beta&t=_kP7RyfolRjZCXpwZO3GJqC4Trnozc_G8gP1uCmzilc",
    demoUrl: "https://pm.naukarinavigator.com/forms/wtl/2190a3595f7c90fae4bde25370f6a4c9"
  },
  {
    id: 3,
    title: "HRM",
    description: "HRM platform with advanced visualization and reporting capabilities.",
    imageUrl: "https://www.zimyo.com/wp-content/uploads/2024/12/hrm-human-resource-management-scaled.webp",
    demoUrl: "https://pm.naukarinavigator.com/forms/wtl/2190a3595f7c90fae4bde25370f6a4c9"
  },
  {
    id: 4,
    title: "Real Estate Listing",
    description: "Real estate listing platform with search and recommendation features.",
    imageUrl: Real,
    demoUrl: "https://pm.naukarinavigator.com/forms/wtl/2190a3595f7c90fae4bde25370f6a4c9"
  },
  {
    id: 5,
    title: "Cab Booking",
    description: "cab booking platform with all the features you need to manage your bookings.",
    imageUrl: Cab,
    demoUrl: "https://pm.naukarinavigator.com/forms/wtl/2190a3595f7c90fae4bde25370f6a4c9"
  },
  {
    id: 6,
    title: "Parcel Delivery",
    description: "Parcel delivery platform with tracking and route optimization features.",
    imageUrl: Parcel,
    demoUrl: "https://pm.naukarinavigator.com/forms/wtl/2190a3595f7c90fae4bde25370f6a4c9"
  },
];

const Product: FC = () => {
  return (
    <>
      <SEOHead 
        title={pageSEOConfig.products.title}
        description={pageSEOConfig.products.description}
        keywords={pageSEOConfig.products.keywords}
        url="https://expertisestation.com/products"
      />
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        {/* <h1 className="text-4xl font-bold mb-6 mt-10 text-center">Our Products</h1> */}
        <h2 className="section-title text-center pt-10 pb-5">
        Our <span className="text-gradient"> Products </span>
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="bg-white rounded-lg shadow-md p-6 flex flex-col h-full transition-transform hover:scale-105"
            >
              <div className="aspect-w-16 aspect-h-9 mb-4">
                <img 
                  src={product.imageUrl} 
                  alt={product.title}
                  className="w-full h-48 object-cover rounded-lg"
                  onError={(e) => {
                    e.currentTarget.src = 'https://via.placeholder.com/300x200';
                  }}
                />
              </div>
              <h2 className="text-2xl font-semibold mb-4">{product.title}</h2>
              <p className="text-gray-600 mb-6 flex-grow">{product.description}</p>
              <a 
                href={product.demoUrl}
                className="bg-primary text-white px-6 py-2 rounded hover:bg-primary/90 text-center transition-colors inline-block"
              >
                For Demo
              </a>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Product;