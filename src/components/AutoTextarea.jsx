import { useLayoutEffect, useRef } from 'react';

export default function AutoTextarea({ value, onChange, className = 'cell-input', style }) {
  const ref = useRef(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = el.scrollHeight + 'px';
  }, [value]);

  return (
    <textarea
      ref={ref}
      className={className}
      style={style}
      rows={1}
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
