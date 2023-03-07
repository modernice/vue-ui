import { MaybeComputedRef, resolveRef, useArrayEvery } from '@vueuse/core'
import { computed, ref, shallowRef } from '@vue/reactivity'
import { MaybeArray, StringOf, forceArray } from '../shared.js'

/**
 * Extracts the term(s) from an item that should be compared to the search input.
 */
export type TermsFunction<T> = (item: T) => MaybeArray<string>

/**
 * Fields of {@link T} that should be compared to the search input.
 */
export type TermFields<T> = MaybeArray<
  StringOf<StringFields<T> | StringArrayFields<T>>
>

type StringFields<T> = keyof {
  [K in keyof T as T[K] extends string ? K : never]: T[K]
}

type StringArrayFields<T> = keyof {
  [K in keyof T as T[K] extends string[] ? K : never]: T[K]
}

/**
 * Filters a list of items based on a search string.
 *
 * @example
 * ```ts
 * const items = [{ first: 'Bob', last: 'Belcher' }, { first: 'Linda', last: 'Belcher' }]
 *
 * // `result` contains the items for which the `input` is contained in the
 * // `first` or `last` name.
 * const { input, result } = useSearch(items, person => ['first', 'last'])
 * ```
 */
export function useSearch<T>(
  list: MaybeComputedRef<readonly T[]>,
  terms: TermsFunction<T> | MaybeComputedRef<TermFields<T>>,
  options?: {
    /**
     * Makes the search case-sensitive.
     *
     * @default false
     */
    caseSensitive?: MaybeComputedRef<boolean>

    /**
     * Search input must match the term exactly. This option also enables case-sensitivity.
     *
     * @default false
     */
    strict?: MaybeComputedRef<boolean>

    /**
     * Trim whitespace from the search input before comparing to the items.
     *
     * @default true
     */
    trim?: boolean

    /**
     * Initial search input.
     */
    input?: string
  }
) {
  const _list = resolveRef(list)
  const termFields = typeof terms === 'function' ? undefined : resolveRef(terms)

  function getTerms(item: T) {
    if (termFields) {
      const fields = forceArray(termFields.value)
      return fields
        .map((field) => forceArray(item[field] as string | string[]))
        .flat()
    }

    const termsFn = terms as TermsFunction<T>

    return forceArray(termsFn(item))
  }

  const caseSensitive = resolveRef(options?.caseSensitive ?? false)
  const strict = resolveRef(options?.strict ?? false)

  /**
   * Input is compared to the terms of each item in the list.
   */
  const input = ref(options?.input ?? '')

  const modifiedInput = computed(() =>
    maybeTrim(
      strict.value || caseSensitive.value
        ? input.value
        : input.value.toLowerCase()
    )
  )

  function maybeTrim(s: string) {
    return options?.trim ? s.trim() : s
  }

  const termsMap = computed(() => {
    const map = new Map<number, string[]>()
    _list.value.forEach((item, index) => map.set(index, getTerms(item)))
    return map
  })

  /**
   * Items that match the search input, or all items if the search input is empty.
   */
  const result = computed(() =>
    modifiedInput.value
      ? _list.value.filter(
          (_, index) =>
            termsMap.value
              .get(index)
              ?.some((term) =>
                strict.value
                  ? term === modifiedInput.value
                  : maybeTrim(term.toLowerCase()).includes(modifiedInput.value)
              ) ?? false
        )
      : _list.value
  )

  return {
    input,
    result,
  }
}
