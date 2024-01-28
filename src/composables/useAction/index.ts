import { type Ref, computed, ref } from 'vue'
import { type MaybeRefOrGetter, toRef } from '@vueuse/core'
import { defu } from 'defu'

/**
 * Defines configuration options for the `useAction` composable.
 */
export interface UseActionOptions<
  TThrow extends boolean,
  TDisabled extends boolean,
  TError extends Error | string = string,
> {
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
}

/**
 * `createUseAction` is a higher-order function that provides a mechanism to
 * handle asynchronous actions within Vue components. It accepts an optional
 * base configuration for error parsing and returns a `useAction` function. This
 * `useAction` function then takes an action and an options object to create a
 * composable that manages the action's execution state, error handling, and
 * optional disabling of the action.
 */
export function createUseAction<
  TError extends Error | string = string,
>(baseOptions?: { parseError?: (error: Error) => TError }) {
  return function useAction<
    TAction extends (...args: any[]) => any,
    TThrow extends boolean,
    TDisabled extends boolean,
    TError2 extends Error | string = TError,
  >(action: TAction, options?: UseActionOptions<TThrow, TDisabled, TError2>) {
    const opts = defu(options, baseOptions)

    const disabled = toRef(opts.disabled)

    const pending = ref(false)
    const error: Ref<TError2 | null> = ref(null)

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

        if (!opts?.parseError) {
          error.value = err.message as TError2

          if (opts?.throw) {
            throw err
          }

          return null as any
        }

        error.value = (opts.parseError ? opts.parseError(err) : err) as TError2

        if (opts.throw) {
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
        error,
      },
    ] as const
  }
}

/**
 * `useAction` manages the execution state of an action, along with its error
 * handling and potential disabling. It takes an action and an options object to
 * configure behavior such as error parsing and whether errors should be thrown
 * or handled silently. The composable provides a `run` function to execute the
 * given action, while exposing the current pending state and any errors that
 * may have occurred. It returns a tuple containing the `run` function and an
 * object with reactive `pending` and `error` states. The `error` state is
 * either a string or an instance of {@link Error}, depending on the provided
 * parseError function in the options. If the action is set to disabled via the
 * options, the `run` function will not execute the action and will return
 * `null`.
 */
export const useAction = createUseAction()

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
