import { useEffect, useRef } from 'react';
import { Users, Award } from 'lucide-react';

interface Card {
  title: string;
  description: string;
  image: string;
  experts: string;
  projects: string;
  category: string;
}

interface AutoScrollCardsProps {
  cards: Card[];
  speed?: 'slow' | 'normal' | 'fast';
  className?: string;
}

export const AutoScrollCards = ({ 
  cards, 
  speed = 'normal',
  className = '' 
}: AutoScrollCardsProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const speedMap = {
    slow: 20,
    normal: 40,
    fast: 60
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const scrollSpeed = speedMap[speed];
    let animationId: number;

    const scroll = () => {
      scrollContainer.scrollLeft += 1;
      if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
        scrollContainer.scrollLeft = 0;
      }
      animationId = requestAnimationFrame(scroll);
    };

    const interval = setInterval(() => {
      scroll();
    }, 100 - scrollSpeed);

    return () => {
      clearInterval(interval);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [speed]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />
      
      <div
        ref={scrollRef}
        className="flex space-x-6 overflow-hidden py-4"
        style={{ scrollBehavior: 'auto' }}
      >
        {[...cards, ...cards].map((card, index) => (
          <div
            key={index}
            className="flex-shrink-0 w-80 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 group cursor-pointer"
          >
            <div className="relative overflow-hidden rounded-t-xl">
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-4 left-4">
                <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-medium text-gray-700">
                  {card.category}
                </span>
              </div>
            </div>
            
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                {card.title}
              </h3>
              <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                {card.description}
              </p>
              
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>{card.experts} Experts</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Award className="h-4 w-4" />
                  <span>{card.projects} Projects</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};