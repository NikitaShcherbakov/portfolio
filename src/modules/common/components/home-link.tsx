import type { ReactNode } from 'react';
import { Link } from 'react-router';

import { cn } from '@/lib/utils';
import { routes } from '@/router/routes';

import { textActionClassName } from '../utils/text-action';

type HomeLinkProps = {
  children: ReactNode;
  className?: string;
};

export function HomeLink({ children, className }: HomeLinkProps) {
  return (
    <Link to={routes.Home} className={cn(textActionClassName, className)}>
      {children}
    </Link>
  );
}
