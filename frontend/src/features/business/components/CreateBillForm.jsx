import React, { useState } from 'react'
import { Stack, Typography, Paper, TextField, MenuItem } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useForm, Controller } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { createBill } from '../BusinessApi'

export const CreateBillForm = () => {
    const [loading, setLoading] = useState(false)
    const { register, handleSubmit, control, watch, formState: { errors } } = useForm({
        defaultValues: { makingChargeType: 'percentage', makingChargeBasis: 'total', gstPercent: 3, wastagePercent: 0 }
    })
    const navigate = useNavigate()
    const makingChargeType = watch('makingChargeType')

    const onSubmit = async (data) => {
        setLoading(true)
        try {
            // ratePerGram/grossWeightGrams/percentages are plain numbers here -- only
            // amountPaise-style fields (payments) need the rupees->paise conversion,
            // see jewelryPricing.js for why these go in as-is
            const bill = await createBill({
                customerName: data.customerName,
                customerPhone: data.customerPhone,
                dueDate: data.dueDate,
                notes: data.notes || undefined,
                grossWeightGrams: Number(data.grossWeightGrams),
                ratePerGram: Number(data.ratePerGram),
                wastagePercent: Number(data.wastagePercent) || 0,
                makingChargeType: data.makingChargeType,
                makingChargeValue: Number(data.makingChargeValue),
                makingChargeBasis: data.makingChargeBasis,
                gstPercent: Number(data.gstPercent),
            })
            toast.success(`Bill #${bill.billNumber} created`)
            navigate(`/business/bills/${bill._id}`)
        } catch (error) {
            toast.error(error?.message || 'Error creating bill')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Stack alignItems="center" mt={5} mb={5}>
            <Stack component={Paper} elevation={1} p={4} rowGap={2} width="30rem" maxWidth="90vw">
                <Typography variant="h5">New Bill</Typography>
                <Stack component="form" rowGap={2} onSubmit={handleSubmit(onSubmit)}>
                    <TextField label="Customer Name" {...register('customerName', { required: true })} error={!!errors.customerName} />
                    <TextField label="Customer Phone" {...register('customerPhone', { required: true })} error={!!errors.customerPhone} />
                    <TextField
                        label="Due Date" type="date" InputLabelProps={{ shrink: true }}
                        {...register('dueDate', { required: true })} error={!!errors.dueDate}
                    />

                    <Typography variant="subtitle2" mt={1}>Pricing</Typography>
                    <TextField
                        label="Gross Weight (grams)" type="number" inputProps={{ step: '0.001' }}
                        {...register('grossWeightGrams', { required: true, min: 0.001 })} error={!!errors.grossWeightGrams}
                    />
                    <TextField
                        label="Rate per Gram (₹)" type="number" inputProps={{ step: '0.01' }}
                        {...register('ratePerGram', { required: true, min: 0.01 })} error={!!errors.ratePerGram}
                    />
                    <TextField
                        label="Wastage (%)" type="number" inputProps={{ step: '0.01' }}
                        {...register('wastagePercent', { min: 0 })}
                    />

                    <Controller
                        name="makingChargeType" control={control}
                        render={({ field }) => (
                            <TextField select label="Making Charge Type" {...field}>
                                <MenuItem value="percentage">Percentage of metal value</MenuItem>
                                <MenuItem value="flat">Flat amount</MenuItem>
                            </TextField>
                        )}
                    />
                    <TextField
                        label={makingChargeType === 'percentage' ? 'Making Charge (%)' : 'Making Charge (₹)'}
                        type="number" inputProps={{ step: '0.01' }}
                        {...register('makingChargeValue', { required: true, min: 0 })} error={!!errors.makingChargeValue}
                    />
                    {makingChargeType === 'flat' && (
                        <Controller
                            name="makingChargeBasis" control={control}
                            render={({ field }) => (
                                <TextField select label="Flat Charge Basis" {...field}>
                                    <MenuItem value="total">Total (fixed ₹ regardless of weight)</MenuItem>
                                    <MenuItem value="perGram">Per Gram</MenuItem>
                                </TextField>
                            )}
                        />
                    )}
                    <TextField
                        label="GST (%)" type="number" inputProps={{ step: '0.01' }}
                        {...register('gstPercent', { required: true, min: 0 })} error={!!errors.gstPercent}
                    />
                    <TextField label="Notes (optional)" multiline rows={2} {...register('notes')} />

                    <LoadingButton loading={loading} type="submit" variant="contained">
                        Create Bill
                    </LoadingButton>
                </Stack>
            </Stack>
        </Stack>
    )
}
