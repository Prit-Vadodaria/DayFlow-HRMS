import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Input = ({ label, className, error, ...props }) => {
    return (
        <div className="flex flex-col gap-1.5">
            {label && (
                <label className="text-sm font-medium text-slate-700">
                    {label}
                </label>
            )}
            <input
                className={twMerge(
                    "px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm shadow-sm placeholder-slate-400",
                    "focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500",
                    "disabled:bg-slate-50 disabled:text-slate-500 disabled:border-slate-200 disabled:shadow-none",
                    error && "border-red-500 focus:border-red-500 focus:ring-red-500",
                    className
                )}
                {...props}
            />
            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}
        </div>
    );
};
