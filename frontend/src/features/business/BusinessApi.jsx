import { axiosi } from '../../config/axios'

export const createBusiness = async (data) => {
    try {
        const res = await axiosi.post('/saas/businesses', data)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const getMyBusiness = async () => {
    try {
        const res = await axiosi.get('/saas/businesses/me')
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const createBill = async (data) => {
    try {
        const res = await axiosi.post('/saas/bills', data)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const getAllBills = async () => {
    try {
        const res = await axiosi.get('/saas/bills')
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const getBillById = async (id) => {
    try {
        const res = await axiosi.get(`/saas/bills/${id}`)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const getBillLedger = async (id) => {
    try {
        const res = await axiosi.get(`/saas/bills/${id}/ledger`)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const recordPayment = async (data) => {
    try {
        const res = await axiosi.post('/saas/payments', data)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const getAllLedger = async () => {
    try {
        const res = await axiosi.get('/saas/ledger')
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const inviteStaff = async (data) => {
    try {
        const res = await axiosi.post('/saas/businesses/staff', data)
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const listStaff = async () => {
    try {
        const res = await axiosi.get('/saas/businesses/staff')
        return res.data
    } catch (error) {
        throw error.response.data
    }
}

export const removeStaff = async (userId) => {
    try {
        await axiosi.delete(`/saas/businesses/staff/${userId}`)
        return userId
    } catch (error) {
        throw error.response.data
    }
}
