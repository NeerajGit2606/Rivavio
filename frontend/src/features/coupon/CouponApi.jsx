import { axiosi } from '../../config/axios'

export const validateCoupon = async (data) => {
    try {
        const res = await axiosi.post('/coupons/validate', data)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const createCoupon = async (data) => {
    try {
        const res = await axiosi.post('/coupons', data)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const getAllCoupons = async () => {
    try {
        const res = await axiosi.get('/coupons')
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const deleteCouponById = async (id) => {
    try {
        await axiosi.delete(`/coupons/${id}`)
        return id
    } catch (error) {
        throw error.response.data
    }
}
