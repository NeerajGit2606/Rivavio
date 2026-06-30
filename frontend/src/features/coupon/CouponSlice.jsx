import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { validateCoupon } from './CouponApi'

const initialState = {
    appliedCoupon: null, // { code, discountAmount }
    validateStatus: 'idle',
    validateError: null
}

export const validateCouponAsync = createAsyncThunk('coupon/validateCouponAsync', async (data) => {
    const res = await validateCoupon(data)
    return res
})

const couponSlice = createSlice({
    name: 'couponSlice',
    initialState,
    reducers: {
        clearCoupon: (state) => {
            state.appliedCoupon = null
            state.validateStatus = 'idle'
            state.validateError = null
        },
        resetCouponValidateStatus: (state) => {
            state.validateStatus = 'idle'
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(validateCouponAsync.pending, (state) => {
                state.validateStatus = 'pending'
            })
            .addCase(validateCouponAsync.fulfilled, (state, action) => {
                state.validateStatus = 'fulfilled'
                state.appliedCoupon = action.payload
            })
            .addCase(validateCouponAsync.rejected, (state, action) => {
                state.validateStatus = 'rejected'
                state.validateError = action.error
                state.appliedCoupon = null
            })
    }
})

export const selectAppliedCoupon = (state) => state.CouponSlice.appliedCoupon
export const selectCouponValidateStatus = (state) => state.CouponSlice.validateStatus
export const selectCouponValidateError = (state) => state.CouponSlice.validateError

export const { clearCoupon, resetCouponValidateStatus } = couponSlice.actions
export default couponSlice.reducer
