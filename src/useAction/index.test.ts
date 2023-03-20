import { describe, it, expectTypeOf, expect, vi } from 'vitest'
import { useAction } from './index.js'
import { sleep } from '../test/wait.js'
import { ref } from '@vue/reactivity'

describe('useAction', () => {
  it('returns a correctly typed runner function', () => {
    {
      const [run] = useAction(() => {})
      expectTypeOf(run).toMatchTypeOf<() => Promise<void | null>>()
    }

    {
      const [run] = useAction(() => ({
        foo: 'bar',
      }))
      expectTypeOf(run).toMatchTypeOf<() => Promise<{ foo: string } | null>>()
    }

    {
      const [run] = useAction(() => ({ foo: 'bar' } as const))
      expectTypeOf(run).toMatchTypeOf<() => Promise<{ foo: 'bar' } | null>>()
    }

    {
      const [run] = useAction(() => undefined)
      expectTypeOf(run).toMatchTypeOf<() => Promise<undefined | null>>()
    }

    {
      const [run] = useAction(() => 'hello')
      expectTypeOf(run).toMatchTypeOf<() => Promise<string | null>>()
    }

    {
      const [run] = useAction(() => 'hello' as const)
      expectTypeOf(run).toMatchTypeOf<() => Promise<'hello' | null>>()
    }

    {
      const [run] = useAction(() => 3)
      expectTypeOf(run).toMatchTypeOf<() => Promise<number | null>>()
    }

    {
      const [run] = useAction(() => 3 as const)
      expectTypeOf(run).toMatchTypeOf<() => Promise<3 | null>>()
    }

    {
      const [run] = useAction(async () => 'hello')
      expectTypeOf(run).toMatchTypeOf<() => Promise<string | null>>()
    }

    {
      const [run] = useAction(async () => 'hello' as const)
      expectTypeOf(run).toMatchTypeOf<() => Promise<'hello' | null>>()
    }

    {
      const [run] = useAction(async (foo: string, bar: number, baz: true) => ({
        foo,
        bar,
        baz,
      }))
      expectTypeOf(run).toMatchTypeOf<
        (
          foo: string,
          bar: number,
          baz: true
        ) => Promise<{ foo: string; bar: number; baz: true } | null>
      >()
    }

    {
      const [run] = useAction(async (foo: 'hello', bar: number, baz: true) => ({
        foo,
        bar,
        baz,
      }))
      expectTypeOf(run).toMatchTypeOf<
        (
          foo: 'hello',
          bar: number,
          baz: true
        ) => Promise<{ foo: 'hello'; bar: number; baz: true } | null>
      >()
    }
  })

  it('calls the action with the correct arguments and returns the value', async () => {
    const [run] = useAction(async (foo: string, bar: number, baz: true) => ({
      foo: `foo:${foo}`,
      bar: bar * 3,
      baz,
    }))

    const { foo, bar, baz } = (await run('bar', 5, true))!

    expect(foo).toBe('foo:bar')
    expect(bar).toBe(15)
    expect(baz).toBe(true)
  })

  it('returns null when the action throws', async () => {
    const [run] = useAction(async () => {
      throw new Error('foo')
    })

    expect(await run()).toBe(null)
  })

  it('provides the error message when the action throws', async () => {
    const [run, , error] = useAction(async () => {
      throw new Error('foo')
    })

    await run()

    expect(error.value).toBe('foo')
  })

  it('resets the error message before running the action', async () => {
    let called = false
    const [run, , error] = useAction(() => {
      if (called) return
      called = true
      throw new Error('foo')
    })

    expect(error.value).toBe(null)
    await run()
    expect(error.value).toBe('foo')
    await run()
    expect(error.value).toBe(null)
  })

  it('is pending while the action is running', async () => {
    const [run, pending] = useAction(() => sleep(50))

    expect(pending.value).toBe(false)

    const p = run()
    expect(pending.value).toBe(true)

    await p
    expect(pending.value).toBe(false)
  })

  it('is not pending after an action throws', async () => {
    const [run, pending] = useAction(() => {
      throw new Error('foo')
    })

    await run()
    expect(pending.value).toBe(false)
  })

  it('throws an error when enabling the `throw` option', () => {
    const [run, , error] = useAction(
      () => {
        throw new Error('foo')
      },
      { throw: true }
    )

    expect(run).rejects.toThrow('foo')
    expect(error.value).toBe('foo')
  })

  it(`does not add null to the return type when enabling the 'throw' option`, () => {
    {
      const [run] = useAction(() => {}, { throw: true })
      expectTypeOf(run).toMatchTypeOf<() => Promise<void>>()
    }

    {
      const [run] = useAction(() => undefined, { throw: true })
      expectTypeOf(run).toMatchTypeOf<() => Promise<undefined>>()
    }

    {
      const [run] = useAction(() => 'hello', { throw: true })
      expectTypeOf(run).toMatchTypeOf<() => Promise<string>>()
    }

    {
      const [run] = useAction(() => 'hello' as const, { throw: true })
      expectTypeOf(run).toMatchTypeOf<() => Promise<'hello'>>()
    }

    {
      const [run] = useAction(() => ({ foo: 'bar' }), { throw: true })
      expectTypeOf(run).toMatchTypeOf<() => Promise<{ foo: string }>>()
    }
  })

  it('can be disabled', async () => {
    const ctx = { action: () => {} }
    const spy = vi.spyOn(ctx, 'action')

    const [run] = useAction(ctx.action, { disabled: true })

    await run()

    expect(spy).not.toHaveBeenCalled()
  })

  it('can be disabled with a ref', async () => {
    const ctx = { action: () => {} }
    const spy = vi.spyOn(ctx, 'action')

    const disabled = ref(false)
    const [run] = useAction(ctx.action, { disabled })

    await run()

    expect(spy).toHaveBeenCalledTimes(1)

    disabled.value = true
    await run()

    expect(spy).toHaveBeenCalledTimes(1)

    disabled.value = false
    await run()

    expect(spy).toHaveBeenCalledTimes(2)
  })

  it(`returns 'null' while disabled`, async () => {
    {
      const [run] = useAction(() => {}, { disabled: true })
      expectTypeOf(run).toMatchTypeOf<() => Promise<null>>()
    }

    {
      const [run] = useAction(() => {}, { disabled: ref(true) })
      expectTypeOf(run).toMatchTypeOf<() => Promise<null>>()
    }
  })
})
