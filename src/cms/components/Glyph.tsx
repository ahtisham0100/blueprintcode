/* <Glyph name="posts" /> — an icon from cms/icons.ts as inline SVG. No
   hooks, so it works in server and client components alike. Decorative by
   default (aria-hidden); pass `label` when the icon carries meaning alone. */

import { ICONS, type IconName } from '../icons';

export function Glyph({ name, size = 16, label, className }: { name: IconName; size?: number; label?: string; className?: string }) {
  return (
    <svg
      className={`bpc-glyph${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
      dangerouslySetInnerHTML={{ __html: ICONS[name] }}
    />
  );
}
