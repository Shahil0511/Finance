// Tiny class-name combiner: flattens, drops falsy values, joins.
// Lets components do cn('base', isActive && 'active', className).
export function cn(...inputs) {
  return inputs.flat(Infinity).filter(Boolean).join(' ');
}
