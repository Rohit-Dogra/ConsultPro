import { useState } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { cn } from "@/lib/utils";
import { Search, Filter, ShoppingCart } from "lucide-react";

// Mock product data
const products = [
  {
    id: 1,
    name: "Advanced AI Analytics Suite",
    description: "Enterprise-grade AI analytics solution for data-driven insights",
    price: 999.99,
    category: "analytics",
    features: ["Real-time processing", "Custom reporting", "API integration"],
    
  },
  {
    id: 2,
    name: "Neural Network Optimizer",
    description: "Optimize your neural networks for maximum performance",
    price: 499.99,
    category: "optimization",
    features: ["Auto-tuning", "Performance metrics", "Model comparison"],
   
  },
  {
    id: 3,
    name: "AI Development Toolkit",
    description: "Complete toolkit for AI application development",
    price: 799.99,
    category: "development",
    features: ["Code templates", "Testing suite", "Documentation"],
    
  },
];

const categories = [
  { id: "all", label: "All Products" },
  { id: "analytics", label: "Analytics" },
  { id: "optimization", label: "Optimization" },
  { id: "development", label: "Development" },
];

const ProductShowcase = () => {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Filter products based on category and search query
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <section id="products" className="section-container relative">
      <div className="text-center mb-16">
        <span className="badge badge-blue mb-4">Our Products</span>
        <h2 className="section-title">
          Cutting-Edge <span className="text-gradient">AI Solutions</span>
        </h2>
        <p className="section-subtitle mx-auto">
          Discover our range of advanced AI products designed to transform your business
          with intelligent automation and data-driven insights.
        </p>
      </div>

      <div className="mb-8">
        <GlassCard className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search bar */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search products..."
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-secondary/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Category filters */}
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-muted-foreground" />
              <div className="flex gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm transition-colors",
                      selectedCategory === category.id
                        ? "bg-primary text-white"
                        : "bg-secondary hover:bg-secondary/80"
                    )}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Products grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredProducts.map((product) => (
          <GlassCard key={product.id} className="group hover:scale-105 transition-transform duration-300">
            {/* Product image */}
            <div className="relative h-48 rounded-t-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-purple-500/20" />
              
            </div>

            {/* Product details */}
            <div className="p-6">
              <h3 className="text-xl font-display font-semibold mb-2">{product.name}</h3>
              <p className="text-muted-foreground mb-4">{product.description}</p>

              {/* Features */}
              <ul className="space-y-2 mb-6">
                {product.features.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <svg
                      className="w-4 h-4 text-primary mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              {/* Price and CTA */}
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">
                  ${product.price.toFixed(2)}
                </div>
                <button className="btn-primary flex items-center space-x-2">
                  <ShoppingCart className="w-4 h-4" />
                  <span>Add to Cart</span>
                </button>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </section>
  );
};

export default ProductShowcase;