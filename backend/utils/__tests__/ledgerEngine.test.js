const { allocatePaymentFIFO } = require('../ledgerEngine')

describe('allocatePaymentFIFO', () => {
    test('single bill, payment exactly covers it', () => {
        const result = allocatePaymentFIFO(10000, [
            { billId: 'B1', outstandingPaise: 10000, dueDate: '2026-01-01' }
        ])
        expect(result.allocations).toEqual([
            { billId: 'B1', allocatedPaise: 10000, remainingOutstandingPaise: 0 }
        ])
        expect(result.unallocatedPaise).toBe(0)
    })

    test('single bill, partial payment', () => {
        const result = allocatePaymentFIFO(4000, [
            { billId: 'B1', outstandingPaise: 10000, dueDate: '2026-01-01' }
        ])
        expect(result.allocations).toEqual([
            { billId: 'B1', allocatedPaise: 4000, remainingOutstandingPaise: 6000 }
        ])
        expect(result.unallocatedPaise).toBe(0)
    })

    test('multiple bills: pays oldest fully, then partially covers the next (FIFO)', () => {
        const result = allocatePaymentFIFO(15000, [
            { billId: 'NEW', outstandingPaise: 20000, dueDate: '2026-03-01' },
            { billId: 'OLD', outstandingPaise: 10000, dueDate: '2026-01-01' }
        ])
        expect(result.allocations).toEqual([
            { billId: 'OLD', allocatedPaise: 10000, remainingOutstandingPaise: 0 },
            { billId: 'NEW', allocatedPaise: 5000, remainingOutstandingPaise: 15000 }
        ])
        expect(result.unallocatedPaise).toBe(0)
    })

    test('payment exceeds total outstanding: surplus reported as unallocatedPaise', () => {
        const result = allocatePaymentFIFO(50000, [
            { billId: 'B1', outstandingPaise: 10000, dueDate: '2026-01-01' }
        ])
        expect(result.allocations).toEqual([
            { billId: 'B1', allocatedPaise: 10000, remainingOutstandingPaise: 0 }
        ])
        expect(result.unallocatedPaise).toBe(40000)
    })

    test('zero payment amount is a no-op', () => {
        const result = allocatePaymentFIFO(0, [
            { billId: 'B1', outstandingPaise: 10000, dueDate: '2026-01-01' }
        ])
        expect(result.allocations).toEqual([])
        expect(result.unallocatedPaise).toBe(0)
    })

    test('empty bills array: entire payment stays unallocated', () => {
        const result = allocatePaymentFIFO(10000, [])
        expect(result.allocations).toEqual([])
        expect(result.unallocatedPaise).toBe(10000)
    })

    test('tied due dates resolve deterministically by billId', () => {
        const result = allocatePaymentFIFO(5000, [
            { billId: 'B2', outstandingPaise: 10000, dueDate: '2026-01-01' },
            { billId: 'B1', outstandingPaise: 10000, dueDate: '2026-01-01' }
        ])
        expect(result.allocations[0].billId).toBe('B1') // B1 < B2 lexicographically
    })

    test('a bill with zero outstandingPaise is skipped cleanly', () => {
        const result = allocatePaymentFIFO(5000, [
            { billId: 'PAID', outstandingPaise: 0, dueDate: '2026-01-01' },
            { billId: 'DUE', outstandingPaise: 5000, dueDate: '2026-02-01' }
        ])
        expect(result.allocations).toEqual([
            { billId: 'DUE', allocatedPaise: 5000, remainingOutstandingPaise: 0 }
        ])
    })

    test('invariant: sum(allocatedPaise) + unallocatedPaise === paymentAmountPaise', () => {
        const scenarios = [
            [15000, [{ billId: 'A', outstandingPaise: 20000, dueDate: '2026-03-01' }, { billId: 'B', outstandingPaise: 10000, dueDate: '2026-01-01' }]],
            [0, [{ billId: 'A', outstandingPaise: 10000, dueDate: '2026-01-01' }]],
            [999999, []],
            [12345, [{ billId: 'A', outstandingPaise: 5000, dueDate: '2026-01-01' }, { billId: 'B', outstandingPaise: 5000, dueDate: '2026-01-02' }]]
        ]

        scenarios.forEach(([paymentAmountPaise, bills]) => {
            const { allocations, unallocatedPaise } = allocatePaymentFIFO(paymentAmountPaise, bills)
            const allocatedSum = allocations.reduce((sum, a) => sum + a.allocatedPaise, 0)
            expect(allocatedSum + unallocatedPaise).toBe(paymentAmountPaise)
        })
    })

    test('rejects non-integer payment amount', () => {
        expect(() => allocatePaymentFIFO(150.5, [])).toThrow(/paymentAmountPaise/)
    })

    test('rejects a bill with negative outstandingPaise', () => {
        expect(() => allocatePaymentFIFO(1000, [
            { billId: 'B1', outstandingPaise: -500, dueDate: '2026-01-01' }
        ])).toThrow(/outstandingPaise/)
    })

    test('handles a large number of bills and still sums correctly', () => {
        const bills = Array.from({ length: 50 }, (_, i) => ({
            billId: `B${i}`,
            outstandingPaise: 1000,
            dueDate: new Date(2026, 0, i + 1)
        }))
        const payment = 1000 * 30 + 500 // fully pays 30 bills, partially pays the 31st

        const { allocations, unallocatedPaise } = allocatePaymentFIFO(payment, bills)
        expect(allocations).toHaveLength(31)
        expect(unallocatedPaise).toBe(0)
        expect(allocations.reduce((sum, a) => sum + a.allocatedPaise, 0)).toBe(payment)
    })
})
