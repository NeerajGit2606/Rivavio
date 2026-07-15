const Counter = require("../models/Counter")

/**
 * Atomically returns the next number in a named sequence (e.g. `bill:${businessId}`).
 * @param {string} key
 * @param {import('mongoose').ClientSession} [session]
 * @returns {Promise<number>}
 */
exports.getNextSequence = async (key, session) => {
    const counter = await Counter.findOneAndUpdate(
        { _id: key },
        { $inc: { seq: 1 } },
        { new: true, upsert: true, session }
    )
    return counter.seq
}
