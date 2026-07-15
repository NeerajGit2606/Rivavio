/**
 * Allocates a single payment across multiple outstanding bills, oldest-due-date first.
 * @param {number} paymentAmountPaise - integer paise
 * @param {Array<{billId: string, outstandingPaise: number, dueDate: Date|string}>} outstandingBills
 * @returns {{
 *   allocations: Array<{billId: string, allocatedPaise: number, remainingOutstandingPaise: number}>,
 *   unallocatedPaise: number
 * }}
 */
exports.allocatePaymentFIFO = (paymentAmountPaise, outstandingBills) => {
    if (!Number.isInteger(paymentAmountPaise) || paymentAmountPaise < 0) {
        throw new Error(`allocatePaymentFIFO: paymentAmountPaise must be a non-negative integer, got ${paymentAmountPaise}`)
    }
    if (!Array.isArray(outstandingBills)) {
        throw new Error('allocatePaymentFIFO: outstandingBills must be an array')
    }

    outstandingBills.forEach((bill) => {
        if (!Number.isInteger(bill.outstandingPaise) || bill.outstandingPaise < 0) {
            throw new Error(`allocatePaymentFIFO: bill ${bill.billId} has invalid outstandingPaise ${bill.outstandingPaise}`)
        }
    })

    // oldest-due-date first; tie-break by billId so ordering is deterministic, not
    // dependent on the input array's original order or the sort algorithm's stability
    const sortedBills = [...outstandingBills].sort((a, b) => {
        const dateDiff = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
        return dateDiff !== 0 ? dateDiff : String(a.billId).localeCompare(String(b.billId))
    })

    let remaining = paymentAmountPaise
    const allocations = []

    for (const bill of sortedBills) {
        if (remaining === 0 || bill.outstandingPaise === 0) continue

        const allocatedPaise = Math.min(remaining, bill.outstandingPaise)
        allocations.push({
            billId: bill.billId,
            allocatedPaise,
            remainingOutstandingPaise: bill.outstandingPaise - allocatedPaise
        })
        remaining -= allocatedPaise
    }

    return { allocations, unallocatedPaise: remaining }
}
