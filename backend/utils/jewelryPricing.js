const { Decimal } = require('./money')

const toPaiseFromDecimal = (d) => d.times(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()

/**
 * @param {Object} params
 * @param {number} params.grossWeightGrams
 * @param {number} params.ratePerGram
 * @param {number} [params.wastagePercent=0]
 * @param {'percentage'|'flat'} params.makingChargeType
 * @param {number} params.makingChargeValue
 * @param {'perGram'|'total'} [params.makingChargeBasis='total'] - only used when makingChargeType==='flat'
 * @param {number} [params.gstPercent=3]
 */
exports.calculateJewelryPrice = ({
    grossWeightGrams,
    ratePerGram,
    wastagePercent = 0,
    makingChargeType,
    makingChargeValue,
    makingChargeBasis = 'total',
    gstPercent = 3
}) => {
    if (typeof grossWeightGrams !== 'number' || grossWeightGrams <= 0) {
        throw new Error(`calculateJewelryPrice: grossWeightGrams must be a positive number, got ${grossWeightGrams}`)
    }
    if (typeof ratePerGram !== 'number' || ratePerGram <= 0) {
        throw new Error(`calculateJewelryPrice: ratePerGram must be a positive number, got ${ratePerGram}`)
    }
    if (typeof wastagePercent !== 'number' || wastagePercent < 0) {
        throw new Error(`calculateJewelryPrice: wastagePercent must be a non-negative number, got ${wastagePercent}`)
    }
    if (!['percentage', 'flat'].includes(makingChargeType)) {
        throw new Error(`calculateJewelryPrice: makingChargeType must be 'percentage' or 'flat', got ${makingChargeType}`)
    }
    if (typeof makingChargeValue !== 'number' || makingChargeValue < 0) {
        throw new Error(`calculateJewelryPrice: makingChargeValue must be a non-negative number, got ${makingChargeValue}`)
    }
    if (typeof gstPercent !== 'number' || gstPercent < 0) {
        throw new Error(`calculateJewelryPrice: gstPercent must be a non-negative number, got ${gstPercent}`)
    }

    // wastage applies to WEIGHT before the rate is multiplied in -- applying it to the
    // final rupee value instead would silently produce a different (wrong) number
    const effectiveWeight = new Decimal(grossWeightGrams)
        .times(new Decimal(1).plus(new Decimal(wastagePercent).dividedBy(100)))
    const metalValue = effectiveWeight.times(ratePerGram)

    let makingCharge
    if (makingChargeType === 'percentage') {
        makingCharge = metalValue.times(new Decimal(makingChargeValue).dividedBy(100))
    } else if (makingChargeBasis === 'perGram') {
        makingCharge = effectiveWeight.times(makingChargeValue)
    } else {
        makingCharge = new Decimal(makingChargeValue)
    }

    // round each line item exactly once; the subtotal is the SUM of the already-rounded
    // line items (not an independently-rounded aggregate) so it always foots correctly
    const metalValuePaise = toPaiseFromDecimal(metalValue)
    const makingChargePaise = toPaiseFromDecimal(makingCharge)
    const subtotalPaise = metalValuePaise + makingChargePaise

    // GST is charged on (metal + making), not on metal value alone -- computed from the
    // precise pre-rounding subtotal so a single line item's rounding doesn't skew the tax
    const preciseSubtotal = metalValue.plus(makingCharge)
    const gstPaise = toPaiseFromDecimal(preciseSubtotal.times(new Decimal(gstPercent).dividedBy(100)))
    const totalPaise = subtotalPaise + gstPaise

    return {
        effectiveWeightGrams: effectiveWeight.toDecimalPlaces(3, Decimal.ROUND_HALF_UP).toNumber(),
        metalValuePaise,
        makingChargePaise,
        subtotalPaise,
        gstPaise,
        totalPaise
    }
}
