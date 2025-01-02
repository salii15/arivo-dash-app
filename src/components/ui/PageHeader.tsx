import { BookOpen } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  className?: string;
  bgColor?: string;
  textColor?: string;
  radius?: string;
  padding?: string;
  icon: React.ReactNode;
}

export default function PageHeader({ 
  title, 
  description, 
  className = "",
  bgColor = "bg-primary-50",
  textColor = "text-primary-900",
  radius = "rounded-full",
  padding = "p-4",
  icon
}: PageHeaderProps) {
  return (
    <div className={`${padding} ${bgColor} ${radius} ${className}`}>
      <div className="flex flex-row items-center gap-2">
        <div className="text-primary-600">{icon}</div>
        
        <h1 className={`text-md font-medium ${textColor}`}>{title}</h1>
        {description && (
        <div className="mt-2 border-t border-primary-100" />
      )}

      {description && (
        <p className="mt-2 text-xs font-light text-secondary-400">{description}</p>
      )}

      </div>


    
    </div>
  );
} 