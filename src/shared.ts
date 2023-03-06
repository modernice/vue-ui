/**
 * Could be {@link T}, or an array of {@link T}.
 */
export type MaybeArray<T> = T | T[]

/**
 * Same as `string & T`.
 */
export type StringOf<T> = string & T

/**
 * Forces the value into an array if it isn't already.
 */
export function forceArray<T>(value: T | T[]) {
  return Array.isArray(value) ? value : [value]
}
