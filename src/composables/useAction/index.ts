import { type Ref, computed, ref } from 'vue'
import { type MaybeRefOrGetter, toRef } from '@vueuse/core'

/**
 * `useAction` encapsulates an asynchronous operation, providing reactive states
 * for its execution status and any errors that occur. It accepts an action
 * function of type {@link TAction} and an optional configuration object. The
 * configuration can specify error handling with `parseError`, whether to throw
 * errors with `throw`, and a condition to disable the action with `disabled`.
 * The function returns a tuple where the first element is the `run` function
 * that triggers the action and the second element is an object containing
 * reactive states: `pending`, indicating if the action is in progress, and
 * `error`, which holds any error that has occurred. The return type of the
 * `run` function is determined by the Result type, which considers whether the
 * action is disabled, should return null, or throw an error.
 */
export function useAction<
  TAction extends (...args: any[]) => any,
  TThrow extends boolean,
  TDisabled extends boolean,
  TError extends Error | string = string,
>(
  action: TAction,
  options?: {
    /**
     * Whether to throw errors. If `true`, the `run` function will throw any
     * errors that occur. If `false`, the `run` function will return `null` if
     * an error occurs.
     *
     * Regardless of this option, the `error` state will be set to the error
     * that occurred.
     *
     * @default false
     */
    throw?: TThrow

    /**
     * Whether the action is disabled. If `true`, the `run` function will not
     * execute the action.
     *
     * @default false
     */
    disabled?: MaybeRefOrGetter<TDisabled>

    /**
     * A function to parse errors. If provided, the `error` state will be set to
     * the result of this function. If not provided, the `error` state will be
     * set to the error's `message` property.
     *
     * @param error The error that occurred.
     * @returns The parsed error.
     */
    parseError?: (error: Error) => TError
  },
) {
  const disabled = toRef(options?.disabled)

  const pending = ref(false)
  const error: Ref<TError | null> = ref(null)

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

      if (!(e instanceof Error)) {
        throw new TypeError(`Action threw a non-Error object: ${e}`)
      }

      const err = e as Error

      if (!options?.parseError) {
        error.value = err.message as TError

        if (options?.throw) {
          throw err
        }

        return null as any
      }

      error.value = (
        options?.parseError ? options.parseError(err) : err
      ) as TError

      if (options?.throw) {
        const terr =
          error.value instanceof Error
            ? error.value
            : new Error(String(error.value))
        throw terr
      }

      return null as any
    }
  }

  return [
    run,
    {
      pending: computed(() => pending.value),
      error: error as Ref<TError | null>,
    },
  ] as const
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
