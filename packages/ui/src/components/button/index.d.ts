import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
import { BaseComponentProps } from '../../types';
declare const buttonVariants: (
  props?:
    | ({
        variant?:
          | 'default'
          | 'secondary'
          | 'destructive'
          | 'link'
          | 'outline'
          | 'ghost'
          | null
          | undefined;
        size?: 'default' | 'lg' | 'sm' | 'icon' | null | undefined;
      } & import('class-variance-authority/types').ClassProp)
    | undefined
) => string;
export interface ButtonProps extends BaseComponentProps, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  onClick?: () => void;
}
declare const Button: React.ForwardRefExoticComponent<
  ButtonProps & React.RefAttributes<HTMLButtonElement>
>;
export { Button, buttonVariants };
//# sourceMappingURL=index.d.ts.map
