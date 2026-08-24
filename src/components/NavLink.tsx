import { forwardRef, type ComponentProps } from "react";
import { Link, useLocation } from "@/lib/router-compat";
import { cn } from "@/lib/utils";

interface NavLinkCompatProps extends Omit<
  ComponentProps<typeof Link>,
  "className"
> {
  className?: string;
  activeClassName?: string;
  pendingClassName?: string;
  /** Match the path exactly instead of by prefix (react-router `end` semantics). */
  end?: boolean;
}

const NavLink = forwardRef<HTMLAnchorElement, NavLinkCompatProps>(
  (
    {
      className,
      activeClassName,
      pendingClassName: _pendingClassName,
      end,
      to,
      ...props
    },
    ref,
  ) => {
    const { pathname } = useLocation();
    const target = to.split("?")[0].split("#")[0];
    const isActive = end
      ? pathname === target
      : pathname === target ||
        pathname.startsWith(target.endsWith("/") ? target : `${target}/`);
    return (
      <Link
        ref={ref}
        to={to}
        className={cn(className, isActive && activeClassName)}
        {...props}
      />
    );
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
