
import { ReactNode, CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hoverEffect?: boolean;
  onClick?: () => void;
  style?: CSSProperties;
}

const GlassCard = ({ children, className, hoverEffect = true, onClick, style }: GlassCardProps) => {
  return (
    <div 
      className={cn(
        "glass-panel", 
        hoverEffect && "hover:scale-[1.02] hover:shadow-glass-hover", 
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
};

export default GlassCard;
