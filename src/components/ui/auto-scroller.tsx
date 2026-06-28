import { useEffect, useRef } from 'react';

interface AutoScrollerProps {
  items: string[];
  speed?: 'slow' | 'normal' | 'fast';
  direction?: 'left' | 'right';
  className?: string;
}

export const AutoScroller = ({ 
  items, 
  speed = 'normal', 
  direction = 'left',
  className = '' 
}: AutoScrollerProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const speedMap = {
    slow: 30,
    normal: 50,
    fast: 80
  };

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    const scrollSpeed = speedMap[speed];
    let animationId: number;

    const scroll = () => {
      if (direction === 'left') {
        scrollContainer.scrollLeft += 1;
        if (scrollContainer.scrollLeft >= scrollContainer.scrollWidth / 2) {
          scrollContainer.scrollLeft = 0;
        }
      } else {
        scrollContainer.scrollLeft -= 1;
        if (scrollContainer.scrollLeft <= 0) {
          scrollContainer.scrollLeft = scrollContainer.scrollWidth / 2;
        }
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
  }, [speed, direction]);

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-white to-transparent z-10" />
      <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-white to-transparent z-10" />
      
      <div
        ref={scrollRef}
        className="flex space-x-6 overflow-hidden py-4"
        style={{ scrollBehavior: 'auto' }}
      >
        {[...items, ...items].map((item, index) => (
          <div
            key={index}
            className="flex-shrink-0 bg-gradient-to-r from-gray-50 to-blue-50 px-6 py-3 rounded-full border border-gray-200 hover:border-blue-300 transition-colors cursor-pointer group"
          >
            <span className="text-gray-800 font-medium whitespace-nowrap group-hover:text-blue-800 transition-colors text-sm">
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};