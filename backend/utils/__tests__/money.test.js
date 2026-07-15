const { toPaise, fromPaise } = require('../money')

describe('toPaise / fromPaise', () => {
    test('round-trips a simple rupee amount', () => {
        expect(toPaise(100)).toBe(10000)
        expect(fromPaise(10000)).toBe(100)
    })

    test('round-trips a fractional rupee amount', () => {
        expect(toPaise(99.5)).toBe(9950)
        expect(fromPaise(9950)).toBe(99.5)
    })

    test('avoids classic floating point drift (0.1 + 0.2 style errors)', () => {
        expect(toPaise(19.99)).toBe(1999)
        expect(toPaise(0.1 + 0.2)).toBe(30) // native float gives 0.30000000000000004
    })

    test('rounds half-up at the boundary deterministically', () => {
        expect(toPaise(1.005)).toBe(101) // half-up, not banker's rounding
        expect(toPaise(1.004)).toBe(100)
    })

    test('rejects non-finite input to toPaise', () => {
        expect(() => toPaise('100')).toThrow()
        expect(() => toPaise(NaN)).toThrow()
        expect(() => toPaise(Infinity)).toThrow()
    })

    test('rejects non-integer input to fromPaise', () => {
        expect(() => fromPaise(150.5)).toThrow()
        expect(() => fromPaise('150')).toThrow()
    })
})
