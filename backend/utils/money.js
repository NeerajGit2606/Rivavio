const Decimal = require('decimal.js')

// rupees (float) -> integer paise, rounded once, half-up
exports.toPaise = (rupees) => {
    if (typeof rupees !== 'number' || !Number.isFinite(rupees)) {
        throw new Error(`toPaise: expected a finite number, got ${rupees}`)
    }
    return new Decimal(rupees).times(100).toDecimalPlaces(0, Decimal.ROUND_HALF_UP).toNumber()
}

// integer paise -> rupees, 2 decimal places
exports.fromPaise = (paise) => {
    if (!Number.isInteger(paise)) {
        throw new Error(`fromPaise: expected an integer number of paise, got ${paise}`)
    }
    return new Decimal(paise).dividedBy(100).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber()
}

exports.Decimal = Decimal
