/**
 * Returns a {@link Promise} that resolves after the given number of milliseconds.
 */
export async function sleep(ms: number) {
  return new Promise((res) => setTimeout(res, ms))
}
