import { Either } from './Either'
import { Monoid } from './Monoid'
import { Ord } from './Ord'
import { Semigroup } from './Semigroup'
import { Eq, fromEquals } from './Eq'
import { Predicate, not, Refinement, identity } from './function'
import { Separated } from './Compactable'
import { Option } from './Option'
import { Show } from './Show'

/**
 * @since 1.17.0
 */
export const getShow = <A>(SA: Show<A>): Show<Set<A>> => {
  return {
    show: s => {
      let elements = ''
      s.forEach(a => {
        elements += SA.show(a) + ', '
      })
      if (elements !== '') {
        elements = elements.substring(0, elements.length - 2)
      }
      return `new Set([${elements}])`
    }
  }
}

/**
 * @since 1.14.0
 */
export const empty: Set<never> = new Set()

/**
 * @since 1.0.0
 */
export const toArray = <A>(O: Ord<A>) => (x: Set<A>): Array<A> => {
  const r: Array<A> = []
  x.forEach(e => r.push(e))
  return r.sort(O.compare)
}

/**
 * Use `getEq`
 *
 * @since 1.0.0
 * @deprecated
 */
export const getSetoid: <A>(E: Eq<A>) => Eq<Set<A>> = getEq

/**
 * @since 1.19.0
 */
export function getEq<A>(E: Eq<A>): Eq<Set<A>> {
  const subsetE = subset(E)
  return fromEquals((x, y) => subsetE(x, y) && subsetE(y, x))
}

/**
 * @since 1.0.0
 */
export const some = <A>(x: Set<A>, predicate: Predicate<A>): boolean => {
  const values = x.values()
  let e: IteratorResult<A>
  let found = false
  while (!found && !(e = values.next()).done) {
    found = predicate(e.value)
  }
  return found
}

/**
 * Projects a Set through a function
 *
 * @since 1.2.0
 */
export const map = <B>(E: Eq<B>): (<A>(set: Set<A>, f: (x: A) => B) => Set<B>) => {
  const has = elem(E)
  return (set, f) => {
    const r = new Set<B>()
    set.forEach(e => {
      const v = f(e)
      if (!has(v, r)) {
        r.add(v)
      }
    })
    return r
  }
}

/**
 * @since 1.0.0
 */
export const every = <A>(x: Set<A>, predicate: Predicate<A>): boolean => {
  return !some(x, not(predicate))
}

/**
 * @since 1.2.0
 */
export const chain = <B>(E: Eq<B>): (<A>(set: Set<A>, f: (x: A) => Set<B>) => Set<B>) => {
  const has = elem(E)
  return (set, f) => {
    let r = new Set<B>()
    set.forEach(e => {
      f(e).forEach(e => {
        if (!has(e, r)) {
          r.add(e)
        }
      })
    })
    return r
  }
}

/**
 * `true` if and only if every element in the first set is an element of the second set
 *
 * @since 1.0.0
 */
export const subset = <A>(E: Eq<A>): ((x: Set<A>, y: Set<A>) => boolean) => {
  const has = elem(E)
  return (x, y) => every(x, a => has(a, y))
}

/**
 * @since 1.0.0
 */
export function filter<A, B extends A>(x: Set<A>, predicate: Refinement<A, B>): Set<B>
export function filter<A>(x: Set<A>, predicate: Predicate<A>): Set<A>
export function filter<A>(x: Set<A>, predicate: Predicate<A>): Set<A> {
  const values = x.values()
  let e: IteratorResult<A>
  let r = new Set<A>()
  while (!(e = values.next()).done) {
    const value = e.value
    if (predicate(value)) {
      r.add(value)
    }
  }
  return r
}

/**
 * @since 1.2.0
 */
export function partition<A, B extends A>(x: Set<A>, predicate: Refinement<A, B>): Separated<Set<A>, Set<B>>
export function partition<A>(x: Set<A>, predicate: Predicate<A>): Separated<Set<A>, Set<A>>
export function partition<A>(x: Set<A>, predicate: Predicate<A>): Separated<Set<A>, Set<A>> {
  const values = x.values()
  let e: IteratorResult<A>
  let right = new Set<A>()
  let left = new Set<A>()
  while (!(e = values.next()).done) {
    const value = e.value
    if (predicate(value)) {
      right.add(value)
    } else {
      left.add(value)
    }
  }
  return { left, right }
}

/**
 * Use `elem` instead
 * @since 1.0.0
 * @deprecated
 */
export const member = <A>(E: Eq<A>): ((set: Set<A>) => (a: A) => boolean) => {
  const has = elem(E)
  return set => a => has(a, set)
}

/**
 * Test if a value is a member of a set
 *
 * @since 1.14.0
 */
export const elem = <A>(E: Eq<A>) => (a: A, x: Set<A>): boolean => {
  return some(x, (ax: A) => E.equals(a, ax))
}

/**
 * Form the union of two sets
 *
 * @since 1.0.0
 */
export const union = <A>(E: Eq<A>): ((x: Set<A>, y: Set<A>) => Set<A>) => {
  const has = elem(E)
  return (x, y) => {
    const r = new Set(x)
    y.forEach(e => {
      if (!has(e, r)) {
        r.add(e)
      }
    })
    return r
  }
}

/**
 * The set of elements which are in both the first and second set
 *
 * @since 1.0.0
 */
export const intersection = <A>(E: Eq<A>): ((x: Set<A>, y: Set<A>) => Set<A>) => {
  const has = elem(E)
  return (x, y) => {
    const r = new Set<A>()
    x.forEach(e => {
      if (has(e, y)) {
        r.add(e)
      }
    })
    return r
  }
}

/**
 * @since 1.2.0
 */
export const partitionMap = <L, R>(EL: Eq<L>, ER: Eq<R>) => <A>(
  x: Set<A>,
  f: (a: A) => Either<L, R>
): Separated<Set<L>, Set<R>> => {
  const values = x.values()
  let e: IteratorResult<A>
  let left = new Set<L>()
  let right = new Set<R>()
  const hasL = elem(EL)
  const hasR = elem(ER)
  while (!(e = values.next()).done) {
    const v = f(e.value)
    if (v.isLeft()) {
      if (!hasL(v.value, left)) {
        left.add(v.value)
      }
    } else {
      if (!hasR(v.value, right)) {
        right.add(v.value)
      }
    }
  }
  return { left, right }
}

/**
 * Use `difference2v` instead
 *
 * @since 1.0.0
 * @deprecated
 */
export const difference = <A>(E: Eq<A>): ((x: Set<A>, y: Set<A>) => Set<A>) => {
  const d = difference2v(E)
  return (x, y) => d(y, x)
}

/**
 * Form the set difference (`x` - `y`)
 *
 * @example
 * import { difference2v } from 'fp-ts/lib/Set'
 * import { eqNumber } from 'fp-ts/lib/Eq'
 *
 * assert.deepStrictEqual(difference2v(eqNumber)(new Set([1, 2]), new Set([1, 3])), new Set([2]))
 *
 *
 * @since 1.12.0
 */
export const difference2v = <A>(E: Eq<A>): ((x: Set<A>, y: Set<A>) => Set<A>) => {
  const has = elem(E)
  return (x, y) => filter(x, a => !has(a, y))
}

/**
 * @since 1.0.0
 */
export const getUnionMonoid = <A>(E: Eq<A>): Monoid<Set<A>> => {
  return {
    concat: union(E),
    empty
  }
}

/**
 * @since 1.0.0
 */
export const getIntersectionSemigroup = <A>(E: Eq<A>): Semigroup<Set<A>> => {
  return {
    concat: intersection(E)
  }
}

/**
 * @since 1.0.0
 */
export const reduce = <A>(O: Ord<A>): (<B>(fa: Set<A>, b: B, f: (b: B, a: A) => B) => B) => {
  const toArrayO = toArray(O)
  return (fa, b, f) => toArrayO(fa).reduce(f, b)
}

/**
 * @since 1.14.0
 */
export const foldMap = <A, M>(O: Ord<A>, M: Monoid<M>): ((fa: Set<A>, f: (a: A) => M) => M) => {
  const toArrayO = toArray(O)
  return (fa, f) => toArrayO(fa).reduce((b, a) => M.concat(b, f(a)), M.empty)
}

/**
 * Create a set with one element
 *
 * @since 1.0.0
 */
export const singleton = <A>(a: A): Set<A> => {
  return new Set([a])
}

/**
 * Insert a value into a set
 *
 * @since 1.0.0
 */
export const insert = <A>(E: Eq<A>): ((a: A, x: Set<A>) => Set<A>) => {
  const has = elem(E)
  return (a, x) => {
    if (!has(a, x)) {
      const r = new Set(x)
      r.add(a)
      return r
    } else {
      return x
    }
  }
}

/**
 * Delete a value from a set
 *
 * @since 1.0.0
 */
export const remove = <A>(E: Eq<A>) => (a: A, x: Set<A>): Set<A> => {
  return filter(x, (ax: A) => !E.equals(a, ax))
}

/**
 * Create a set from an array
 *
 * @since 1.2.0
 */
export const fromArray = <A>(E: Eq<A>) => (as: Array<A>): Set<A> => {
  const len = as.length
  const r = new Set<A>()
  const has = elem(E)
  for (let i = 0; i < len; i++) {
    const a = as[i]
    if (!has(a, r)) {
      r.add(a)
    }
  }
  return r
}

/**
 * @since 1.12.0
 */
export const compact = <A>(E: Eq<A>): ((fa: Set<Option<A>>) => Set<A>) => {
  const filterMapE = filterMap(E)
  return fa => filterMapE(fa, identity)
}

/**
 * @since 1.12.0
 */
export const separate = <L, R>(EL: Eq<L>, ER: Eq<R>) => (fa: Set<Either<L, R>>): Separated<Set<L>, Set<R>> => {
  const hasL = elem(EL)
  const hasR = elem(ER)
  const left: Set<L> = new Set()
  const right: Set<R> = new Set()
  fa.forEach(e => {
    if (e.isLeft()) {
      if (!hasL(e.value, left)) {
        left.add(e.value)
      }
    } else {
      if (!hasR(e.value, right)) {
        right.add(e.value)
      }
    }
  })
  return { left, right }
}

/**
 * @since 1.12.0
 */
export const filterMap = <B>(E: Eq<B>): (<A>(fa: Set<A>, f: (a: A) => Option<B>) => Set<B>) => {
  const has = elem(E)
  return (fa, f) => {
    const r: Set<B> = new Set()
    fa.forEach(a => {
      const ob = f(a)
      if (ob.isSome() && !has(ob.value, r)) {
        r.add(ob.value)
      }
    })
    return r
  }
}
