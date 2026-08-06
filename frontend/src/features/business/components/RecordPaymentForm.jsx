import React, { useState } from 'react'
import { Stack, Typography, Paper, TextField } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { recordPayment } from '../BusinessApi'

export const RecordPaymentForm = ({ onPaymentRecorded }) => {
    const [loading, setLoading] = useState(false)
    const { register, handleSubmit, reset, formState: { errors } } = useForm()

    const onSubmit = async (data) => {
        setLoading(true)
        try {
            // amount is collected in rupees (what a shop owner thinks in) but the
            // backend ledger works in integer paise -- see money.js/ledgerEngine.js
            const amountPaise = Math.round(Number(data.amount) * 100)
            const result = await recordPayment({ customerPhone: data.customerPhone, amountPaise })

            const allocatedCount = result.allocations.filter((a) => a.allocatedPaise > 0).length
            toast.success(
                allocatedCount > 0
                    ? `Payment applied to ${allocatedCount} bill(s)`
                    : 'Payment recorded (no open bills matched this phone number)'
            )
            reset()
            onPaymentRecorded()
        } catch (error) {
            toast.error(error?.message || 'Error recording payment')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Stack component={Paper} elevation={1} p={3} rowGap={2} width="22rem" maxWidth="90vw">
            <Typography variant="h6">Record a Payment</Typography>
            <Typography variant="body2" color="text.secondary">
                Applied automatically (oldest bill first) across this customer's open bills.
            </Typography>
            <Stack component="form" rowGap={2} onSubmit={handleSubmit(onSubmit)}>
                <TextField
                    label="Customer Phone"
                    {...register('customerPhone', { required: true })}
                    error={!!errors.customerPhone}
                />
                <TextField
                    label="Amount (₹)"
                    type="number"
                    inputProps={{ step: '0.01' }}
                    {...register('amount', { required: true, min: 0.01 })}
                    error={!!errors.amount}
                />
                <LoadingButton loading={loading} type="submit" variant="contained">
                    Record Payment
                </LoadingButton>
            </Stack>
        </Stack>
    )
}
