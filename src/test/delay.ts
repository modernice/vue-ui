/**
 * Returns a {@link Promise} that resolves after the given number of milliseconds.
 */
export async function delay(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}
