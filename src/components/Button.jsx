import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Button = ({ children, className, variant = 'primary', size = 'default', ...props }) => {
    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
        secondary: 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 focus:ring-indigo-500',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
        ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 focus:ring-slate-500',
    };

    const sizes = {
        sm: 'px-3 py-1.5 text-xs',
        default: 'px-4 py-2 text-sm',
        lg: 'px-5 py-2.5 text-base',
    };

    return (
        <button
            className={twMerge(
                "inline-flex items-center justify-center font-medium rounded-lg shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                variants[variant],
                sizes[size],
                className
            )}
            {...props}
        >
            {children}
        </button>
    );
};
