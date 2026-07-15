const { calculateJewelryPrice } = require('../jewelryPricing')

describe('calculateJewelryPrice', () => {
    test('basic whole-gram, round-rate, zero-wastage case matches hand calculation', () => {
        // 10g * Rs.6000/g = Rs.60000 metal, +Rs.500 flat making = Rs.60500 subtotal,
        // +3% GST (Rs.1815) = Rs.62315 total
        const result = calculateJewelryPrice({
            grossWeightGrams: 10,
            ratePerGram: 6000,
            wastagePercent: 0,
            makingChargeType: 'flat',
            makingChargeValue: 500,
            makingChargeBasis: 'total',
            gstPercent: 3
        })

        expect(result.metalValuePaise).toBe(6000000)
        expect(result.makingChargePaise).toBe(50000)
        expect(result.subtotalPaise).toBe(6050000)
        expect(result.gstPaise).toBe(181500)
        expect(result.totalPaise).toBe(6231500)
    })

    test('retains fractional-gram precision (10.375g), not truncated', () => {
        const result = calculateJewelryPrice({
            grossWeightGrams: 10.375,
            ratePerGram: 6000,
            makingChargeType: 'flat',
            makingChargeValue: 500,
            gstPercent: 3
        })

        expect(result.effectiveWeightGrams).toBe(10.375)
        expect(result.metalValuePaise).toBe(6225000)
        expect(result.totalPaise).toBe(6463250)
    })

    test('applies wastage % to weight BEFORE multiplying by rate', () => {
        const result = calculateJewelryPrice({
            grossWeightGrams: 10,
            ratePerGram: 1000,
            wastagePercent: 10,
            makingChargeType: 'flat',
            makingChargeValue: 0,
            gstPercent: 0
        })

        expect(result.effectiveWeightGrams).toBe(11)
        expect(result.metalValuePaise).toBe(1100000) // 11g * 1000, not 10g*1000*1.10 applied elsewhere
    })

    test('zero wastage leaves effective weight exactly equal to gross weight', () => {
        const result = calculateJewelryPrice({
            grossWeightGrams: 7.25,
            ratePerGram: 5000,
            makingChargeType: 'flat',
            makingChargeValue: 0,
            gstPercent: 0
        })

        expect(result.effectiveWeightGrams).toBe(7.25)
    })

    describe('three making-charge modes', () => {
        test('percentage of metal value', () => {
            const result = calculateJewelryPrice({
                grossWeightGrams: 10,
                ratePerGram: 1000,
                makingChargeType: 'percentage',
                makingChargeValue: 10, // 10%
                gstPercent: 0
            })
            expect(result.metalValuePaise).toBe(1000000)
            expect(result.makingChargePaise).toBe(100000) // 10% of metal value
        })

        test('flat rate per gram', () => {
            const result = calculateJewelryPrice({
                grossWeightGrams: 10,
                ratePerGram: 1000,
                makingChargeType: 'flat',
                makingChargeBasis: 'perGram',
                makingChargeValue: 50, // Rs.50/gram
                gstPercent: 0
            })
            expect(result.makingChargePaise).toBe(50000) // 10g * Rs.50
        })

        test('flat total, independent of weight', () => {
            const result = calculateJewelryPrice({
                grossWeightGrams: 5,
                ratePerGram: 1000,
                makingChargeType: 'flat',
                makingChargeBasis: 'total',
                makingChargeValue: 500,
                gstPercent: 0
            })
            expect(result.makingChargePaise).toBe(50000) // flat Rs.500 regardless of the 5g weight
        })
    })

    test('GST is computed on (metal + making) subtotal, not metal value alone', () => {
        const result = calculateJewelryPrice({
            grossWeightGrams: 1,
            ratePerGram: 1000,
            makingChargeType: 'flat',
            makingChargeValue: 1000,
            gstPercent: 10
        })
        // subtotal = 1000 + 1000 = 2000, gst = 10% of 2000 = 200 (not 10% of 1000 = 100)
        expect(result.gstPaise).toBe(20000)
    })

    test('zero making charge produces 0, not NaN', () => {
        const result = calculateJewelryPrice({
            grossWeightGrams: 10,
            ratePerGram: 1000,
            makingChargeType: 'flat',
            makingChargeValue: 0,
            gstPercent: 0
        })
        expect(result.makingChargePaise).toBe(0)
        expect(Number.isNaN(result.totalPaise)).toBe(false)
    })

    test('very small weight does not underflow to zero', () => {
        const result = calculateJewelryPrice({
            grossWeightGrams: 0.001,
            ratePerGram: 6000,
            makingChargeType: 'flat',
            makingChargeValue: 0,
            gstPercent: 0
        })
        expect(result.metalValuePaise).toBe(600) // 0.001g * Rs.6000 = Rs.6.00
        expect(result.metalValuePaise).toBeGreaterThan(0)
    })

    test('large rate (platinum-style) has no overflow or precision loss', () => {
        const result = calculateJewelryPrice({
            grossWeightGrams: 5,
            ratePerGram: 100000,
            makingChargeType: 'flat',
            makingChargeValue: 1000,
            gstPercent: 3
        })
        expect(result.metalValuePaise).toBe(50000000)
        expect(result.totalPaise).toBe(51603000)
    })

    test('rounds a half-paise boundary deterministically (half-up)', () => {
        const result = calculateJewelryPrice({
            grossWeightGrams: 1,
            ratePerGram: 100.005, // metal value = Rs.100.005 -> 10000.5 paise
            makingChargeType: 'flat',
            makingChargeValue: 0,
            gstPercent: 0
        })
        expect(result.metalValuePaise).toBe(10001)
    })

    test('rejects invalid input with descriptive errors', () => {
        const base = { grossWeightGrams: 10, ratePerGram: 1000, makingChargeType: 'flat', makingChargeValue: 0 }
        expect(() => calculateJewelryPrice({ ...base, grossWeightGrams: -1 })).toThrow(/grossWeightGrams/)
        expect(() => calculateJewelryPrice({ ...base, ratePerGram: 0 })).toThrow(/ratePerGram/)
        expect(() => calculateJewelryPrice({ ...base, makingChargeType: 'discount' })).toThrow(/makingChargeType/)
    })

    test('invariant: metal + making + gst always equals total', () => {
        const cases = [
            { grossWeightGrams: 10, ratePerGram: 6000, makingChargeType: 'flat', makingChargeValue: 500, gstPercent: 3 },
            { grossWeightGrams: 10.375, ratePerGram: 6000, makingChargeType: 'flat', makingChargeValue: 500, gstPercent: 3 },
            { grossWeightGrams: 5, ratePerGram: 100000, wastagePercent: 2.5, makingChargeType: 'percentage', makingChargeValue: 12, gstPercent: 3 }
        ]

        cases.forEach((params) => {
            const r = calculateJewelryPrice(params)
            expect(r.metalValuePaise + r.makingChargePaise + r.gstPaise).toBe(r.totalPaise)
        })
    })
})
