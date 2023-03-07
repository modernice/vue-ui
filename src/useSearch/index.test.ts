import { describe, expect, it } from 'vitest'
import { useSearch } from './index.js'

describe('useSearch', () => {
  const people = [
    { first: 'Bob', last: 'Belcher' },
    { first: 'Linda', last: 'Belcher' },
    { first: 'Tina', last: 'Belcher' },
    { first: 'Gene', last: 'Belcher' },

    { first: 'Mario', last: 'Mario' },
    { first: 'Luigi', last: 'Mario' },
  ] as const

  it('returns all items by default', () => {
    const { result } = useSearch(people, (person) => [])

    expect(result.value).toEqual(people)
  })

  it('returns all items if no terms extracted', () => {
    const { result, input } = useSearch(people, (person) => [])

    input.value = 'Bob'

    expect(result.value).toHaveLength(0)
  })

  it('returns exact matches', () => {
    const { result, input } = useSearch(people, (person) => [
      person.first,
      person.last,
    ])

    input.value = 'Bob'
    expect(result.value).toEqual([people[0]])

    input.value = 'Tina'
    expect(result.value).toEqual([people[2]])

    input.value = 'Belcher'
    expect(result.value).toEqual(people.slice(0, -2))

    input.value = 'Mario'
    expect(result.value).toEqual(people.slice(-2))
  })

  it('returns partial matches', () => {
    const { result, input } = useSearch(people, (person) => [
      person.first,
      person.last,
    ])

    input.value = 'lch' // Belcher
    expect(result.value).toEqual(people.slice(0, -2))

    input.value = 'a' // Linda, Tina, Mario and Luigi
    expect(result.value).toEqual([people[1], people[2], people[4], people[5]])
  })

  it("doesn't return partial matches in strict mode", () => {
    const { result, input } = useSearch(
      people,
      (person) => [person.first, person.last],
      { strict: true }
    )

    input.value = 'lch' // Belcher
    expect(result.value).toHaveLength(0)

    input.value = 'a' // Linda, Tina, Mario and Luigi
    expect(result.value).toHaveLength(0)
  })

  it('supports case-sensitive mode', () => {
    const { result, input } = useSearch(
      people,
      (person) => [person.first, person.last],
      { caseSensitive: true }
    )

    input.value = 'lCh' // Belcher
    expect(result.value).toHaveLength(0)

    input.value = 'A' // Linda, Tina, Mario and Luigi
    expect(result.value).toHaveLength(0)

    input.value = 'lch' // Belcher
    expect(result.value).toHaveLength(4)

    input.value = 'a' // Linda, Tina, Mario and Luigi
    expect(result.value).toHaveLength(4)
  })

  it('extracts terms from object keys', () => {
    const { result, input } = useSearch(people, ['first'])

    input.value = 'Gene'
    expect(result.value).toEqual([people[3]])

    input.value = 'Luigi'
    expect(result.value).toEqual([people[5]])
  })

  it('accepts an initial input', () => {
    const { result, input } = useSearch(people, ['last'], { input: 'Mario' })

    expect(input.value).toBe('Mario')
    expect(result.value).toEqual([people[4], people[5]])
  })

  const complex = [
    {
      name: 'Bob',
      hobbies: ['cooking', 'music'],
      points: [5, 10, 15],
      weird: ['foo', 4, {}],
    },
  ]

  it("doesn't allow term fields that are not strings or string-arrays", () => {
    useSearch(complex, ['name'])
    useSearch(complex, ['name', 'hobbies'])

    // @ts-expect-error
    useSearch(complex, ['points'])

    // @ts-expect-error
    useSearch(complex, ['weird'])
  })
})
