const VARIANTS = {
  primary: 'btn-primary',
  ghost:   'btn-ghost',
  outline: 'btn-outline',
};
const SIZES = {
  sm: 'text-xs px-2.5 py-1.5',
  md: 'text-sm px-3 py-2',
  lg: 'text-sm px-4 py-2.5',
};

export default function Button({
  children, variant = 'outline', size = 'md',
  className = '', disabled, loading, ...props
}) {
  return (
    <button
      className={`${VARIANTS[variant] ?? VARIANTS.outline} ${SIZES[size] ?? SIZES.md} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
      ) : null}
      {children}
    </button>
  );
}
