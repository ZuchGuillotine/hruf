import * as React from 'react';
import { BaseComponentProps } from '../../types';
export interface InputProps
  extends BaseComponentProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
declare const Input: React.ForwardRefExoticComponent<
  InputProps & React.RefAttributes<HTMLInputElement>
>;
export { Input };
//# sourceMappingURL=index.d.ts.map
