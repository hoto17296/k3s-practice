import type { AnchorHTMLAttributes, MouseEvent } from "react";

import { navigate } from "./router.ts";

type Props = AnchorHTMLAttributes<HTMLAnchorElement> & { href: string };

export function Link({ href, ...props }: Props) {
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigate(href);
  };
  return <a href={href} onClick={onClick} {...props} />;
}
