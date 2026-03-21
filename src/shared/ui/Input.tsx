import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '../lib/classes';

type BaseProps = {
  className?: string;
};

type InputProps = BaseProps & InputHTMLAttributes<HTMLInputElement> & { as?: 'input' };
type TextareaProps = BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement> & { as: 'textarea' };

type Props = InputProps | TextareaProps;

const sharedClassName =
  'w-full rounded-2xl border border-white/8 bg-white/3 px-3.5 py-2.5 text-sm text-soft-linen outline-none transition duration-150 ease-quiet placeholder:text-muted focus:border-teal/65 focus:bg-white/5';

export function Input(props: Props) {
  if (props.as === 'textarea') {
    const { className, as, ...textareaProps } = props;
    void as;
    return <textarea className={cn(sharedClassName, 'min-h-28 resize-y', className)} {...textareaProps} />;
  }

  const { className, as, ...inputProps } = props;
  void as;
  return <input className={cn(sharedClassName, className)} {...inputProps} />;
}
