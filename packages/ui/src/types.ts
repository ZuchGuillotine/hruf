import { ReactNode, ChangeEvent } from 'react'

export interface BaseComponentProps {
  className?: string
  children?: ReactNode
}

export interface VariantProps {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

export interface CardProps extends BaseComponentProps {
  variant?: 'default' | 'bordered'
}

export interface SelectProps extends BaseComponentProps {
  value?: string
  onValueChange?: (value: string) => void
  disabled?: boolean
  required?: boolean
  placeholder?: string
}

export interface ToastProps extends BaseComponentProps {
  title?: string
  description?: string
  variant?: 'default' | 'destructive'
  duration?: number
}

export interface DialogProps extends BaseComponentProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  title?: string
  description?: string
} 