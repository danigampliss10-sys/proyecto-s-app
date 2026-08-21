import { useLayoutEffect, useRef } from 'react';

/* Elemento con contentEditable que sincroniza su innerHTML con `html`,
   pero nunca se pisa a sí mismo mientras el usuario lo tiene enfocado. */
export default function EditableHtml({
  as: Tag = 'div',
  html,
  onChange,
  className,
  singleLine = false,
  style,
}) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.innerHTML !== (html ?? '')) el.innerHTML = html ?? '';
  }, [html]);

  return (
    <Tag
      ref={ref}
      className={className}
      style={style}
      contentEditable
      suppressContentEditableWarning
      onInput={(e) => onChange(e.currentTarget.innerHTML)}
      onKeyDown={(e) => {
        if (singleLine && e.key === 'Enter') {
          e.preventDefault();
          e.currentTarget.blur();
        }
      }}
    />
  );
}
