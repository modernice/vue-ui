import { type Ref, computed, ref } from '@vue/reactivity'
import { type MaybeRefOrGetter, toRef } from '@vueuse/core'

/**
 * Wraps an action to provide pending status and error handling.
 *
 * Returns the runner function as the first element of the returned tuple.
 * The second element is a {@link Ref} that is `true` while the action is
 * pending. The third element is a {@link Ref} that contains the error message
 * if the action throws.
 *
 * The runner will not throw an error if underlying action throws. To enable
 * this behavior, pass `true` to the `throw` option.
 *
 * You can disable the runner via the `disabled` option. While disabled, the
 * runner immediately returns null and does not run the action.
 *
 * @example
 * ```ts
 * const [run, pending, error] = useAction(async () => {
 *  const resp = await fetch('https:
 *  return await resp.json()
 * })
 *
 * const promise = run()
 *
 * const user = await promise
 *
 * console.log({ user, error })
 * ```
 */
export function useAction<
  TAction extends (...args: any[]) => any,
  TThrow extends boolean,
  TDisabled extends boolean,
>(
  action: TAction,
  options?: {
    /**
     * If `true`, the runner will throw an error if the action throws.
     */
    throw?: TThrow

    /**
     * While disabled, the runner will return `null` immediately without running the action.
     */
    disabled?: MaybeRefOrGetter<TDisabled>
  },
) {
  const disabled = toRef(options?.disabled)

  const pending = ref(false)
  const error = ref(null) as Ref<string | null>

  async function run(
    ...args: Parameters<TAction>
  ): Promise<Result<TAction, TDisabled, TThrow>> {
    if (disabled.value) {
      return null as any
    }

    error.value = null
    pending.value = true

    try {
      const result = await action(...args)
      pending.value = false
      return result
    } catch (e) {
      pending.value = false

      if (e instanceof Error) {
        error.value = e.message

        if (options?.throw) {
          throw e
        }

        return null as any
      }

      error.value = String(e)

      if (options?.throw) {
        throw error.value
      }

      return null as any
    }
  }

  return [run, { pending: computed(() => pending.value), error }] as const
}

type Result<
  Action extends (...args: any[]) => any,
  Disabled extends boolean,
  Throw extends boolean,
  Return = _Awaited<ReturnType<Action>>,
> = [Disabled] extends [true]
  ? null
  : null extends Return
    ? Return
    : [Throw] extends [true]
      ? Return
      : Return | NullResult<Throw>

type _Awaited<T> = T extends PromiseLike<infer U> ? _Awaited<U> : T

type NullResult<Throw> = [Throw] extends [true] ? never : null
