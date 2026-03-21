import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../lib/classes';

type ButtonVariant = 'solid' | 'subtle' | 'ghost' | 'danger';

type Props = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: ButtonVariant;
};

const variants: Record<ButtonVariant, string> = {
  solid:
    'border border-teal/70 bg-teal/14 text-soft-linen hover:border-teal hover:bg-teal/22 focus-visible:outline-teal',
  subtle:
    'border border-white/8 bg-white/4 text-soft-linen hover:bg-white/7 focus-visible:outline-white/40',
  ghost:
    'border border-transparent bg-transparent text-muted hover:border-white/8 hover:text-soft-linen focus-visible:outline-white/40',
  danger:
    'border border-rose-400/25 bg-rose-400/10 text-rose-200 hover:bg-rose-400/18 focus-visible:outline-rose-300',
};

export function Button({ children, className, variant = 'subtle', type = 'button', ...props }: Props) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition duration-150 ease-quiet focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
