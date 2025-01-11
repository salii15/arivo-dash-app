import { ButtonHTMLAttributes } from 'react';
import { IconType } from 'react-icons';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'solid' | 'outlined' | 'pastel' | 'close';
  color?: 'primary' | 'dark' | 'midDark' | 'secondary' | 'danger';
  icon?: IconType;
  iconPosition?: 'left' | 'right';
  size?: 'sm' | 'md';
  children?: React.ReactNode;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({ 
  variant = 'solid', 
  color = 'primary',
  icon: Icon,
  iconPosition = 'left',
  size = 'md',
  children, 
  className = '', 
  type,
  ...props 
}: ButtonProps) {
  const sizeStyles = {
    sm: 'px-2 py-2 gap-px',
    md: 'px-4 py-3 gap-2'
  };

  const baseStyles = `rounded-md flex justify-center items-center transition-colors ${sizeStyles[size]}`;
  
  const variantStyles = {
    solid: {
      primary: 'bg-primary-600 text-secondary-200 font-medium text-sm hover:bg-primary/90',
      dark: 'bg-dark text-white font-medium text-sm hover:bg-dark/90',
      midDark: 'bg-gray-700 text-white font-medium text-sm hover:bg-gray-600',
      secondary: 'bg-secondary-600 text-white font-medium text-sm hover:bg-secondary-500',
      danger: 'bg-red-600 text-white font-medium text-sm hover:bg-red-500',
      lavender: 'bg-lavender-600 text-white font-medium text-sm hover:bg-lavender-500'
    },
    outlined: {
      primary: 'border-2 bg-base-100/50 border-primary-700 font-light text-sm text-white hover:bg-primary/10',
      dark: 'border-2 border-dark text-dark font-medium text-sm hover:bg-dark/10',
      midDark: 'border-2 border-gray-700 text-gray-700 font-medium text-sm hover:bg-gray-100',
      secondary: 'border-2 bg-base-100 border-secondary-600 font-medium text-sm text-white hover:bg-secondary-500/10',
      danger: 'border-2 bg-base-100 border-red-600 font-medium text-sm text-white hover:bg-red-500/10',
      lavender: 'border-2 bg-base-100 border-lavender-600 font-medium text-sm text-secondary-200 hover:bg-lavender-500/10'
    },
    pastel: {
      primary: 'border-2 bg-primary-600/50 border-primary-300 font-medium text-sm text-white hover:bg-primary/10',
      dark: 'border-2 bg-dark/50 border-dark text-dark font-medium text-sm hover:bg-dark/10',
      midDark: 'border-2 bg-gray-700/50 border-gray-700 text-gray-700 font-medium text-sm hover:bg-gray-100',
      secondary: 'border-2 bg-base-100/50 border-secondary-600 font-medium text-sm text-white hover:bg-secondary-500/10',
      danger: 'border-2 bg-base-100/50 border-red-600 font-medium text-sm text-white hover:bg-red-500/10',
      lavender: 'border-2 bg-lavender-500/50 border-lavender-600 font-medium text-sm text-secondary-200 hover:bg-lavender-500/10'
    },
    close: {
      primary: 'rounded-full p-2 bg-base-100 hover:bg-gray-300',
      dark: 'rounded-full p-2 bg-base-100 hover:bg-gray-100',
      midDark: 'rounded-full p-2 bg-base-100 hover:bg-gray-100',
      secondary: 'rounded-full p-2 bg-base-100 hover:bg-gray-100',
      danger: 'rounded-full p-2 bg-base-100 hover:bg-gray-100',
      lavender: 'rounded-full p-2 bg-base-100 hover:bg-gray-100'
    }
  };

  return (
    <button
      type={type}
      className={`
        ${variant === 'close' ? '' : baseStyles}
        ${variantStyles[variant][color]}
        ${className}
      `}
      {...props}
    >
      {variant === 'close' ? (
        <XMarkIcon className="h-6 w-6" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}`} />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className={`${size === 'sm' ? 'w-3 h-3' : 'w-4 h-4'}`} />}
        </>
      )}
    </button>
  );
} 