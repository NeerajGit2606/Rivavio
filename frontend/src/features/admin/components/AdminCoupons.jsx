import React, { useEffect, useState } from 'react'
import {
    Stack, Typography, Button, Paper, TextField, MenuItem,
    Table, TableHead, TableRow, TableCell, TableBody, IconButton, Chip
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { useForm, Controller } from 'react-hook-form'
import { toast } from 'react-toastify'
import { createCoupon, getAllCoupons, deleteCouponById } from '../../coupon/CouponApi'
import { formatPrice } from '../../../utils/formatPrice'

export const AdminCoupons = () => {
    const [coupons, setCoupons] = useState([])
    const [loading, setLoading] = useState(false)
    const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
        defaultValues: { discountType: 'percentage' }
    })

    const loadCoupons = async () => {
        try {
            const data = await getAllCoupons()
            setCoupons(data)
        } catch (error) {
            toast.error('Error loading coupons')
        }
    }

    useEffect(() => { loadCoupons() }, [])

    const onSubmit = async (data) => {
        setLoading(true)
        try {
            await createCoupon({
                ...data,
                discountValue: Number(data.discountValue),
                minOrderValue: Number(data.minOrderValue) || 0,
                maxDiscountAmount: data.maxDiscountAmount ? Number(data.maxDiscountAmount) : null,
                usageLimit: data.usageLimit ? Number(data.usageLimit) : null,
            })
            toast.success('Coupon created')
            reset()
            loadCoupons()
        } catch (error) {
            toast.error(error?.message || 'Error creating coupon')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id) => {
        try {
            await deleteCouponById(id)
            setCoupons(coupons.filter(c => c._id !== id))
            toast.success('Coupon deleted')
        } catch (error) {
            toast.error('Error deleting coupon')
        }
    }

    return (
        <Stack alignItems="center" mt={5} mb={5} rowGap={4}>
            <Stack component={Paper} elevation={1} p={4} rowGap={2} width="32rem" maxWidth="90vw">
                <Typography variant="h5">Create Coupon</Typography>
                <Stack component="form" rowGap={2} onSubmit={handleSubmit(onSubmit)}>
                    <TextField label="Code" {...register('code', { required: true })} error={!!errors.code} />
                    <Controller
                        name="discountType"
                        control={control}
                        render={({ field }) => (
                            <TextField select label="Discount Type" {...field}>
                                <MenuItem value="percentage">Percentage</MenuItem>
                                <MenuItem value="flat">Flat Amount (₹)</MenuItem>
                            </TextField>
                        )}
                    />
                    <TextField label="Discount Value" type="number" {...register('discountValue', { required: true })} error={!!errors.discountValue} />
                    <TextField label="Min Order Value (₹)" type="number" {...register('minOrderValue')} />
                    <TextField label="Max Discount Amount (₹, optional)" type="number" {...register('maxDiscountAmount')} />
                    <TextField label="Usage Limit (optional)" type="number" {...register('usageLimit')} />
                    <TextField
                        label="Expires At"
                        type="date"
                        InputLabelProps={{ shrink: true }}
                        {...register('expiresAt', { required: true })}
                        error={!!errors.expiresAt}
                    />
                    <LoadingButton loading={loading} type="submit" variant="contained">Create Coupon</LoadingButton>
                </Stack>
            </Stack>

            <Stack width="50rem" maxWidth="95vw">
                <Typography variant="h6" mb={2}>Active Coupons</Typography>
                <Table component={Paper}>
                    <TableHead>
                        <TableRow>
                            <TableCell>Code</TableCell>
                            <TableCell>Discount</TableCell>
                            <TableCell>Min Order</TableCell>
                            <TableCell>Expires</TableCell>
                            <TableCell>Used</TableCell>
                            <TableCell align="right">Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {coupons.map((coupon) => (
                            <TableRow key={coupon._id}>
                                <TableCell><Chip label={coupon.code} /></TableCell>
                                <TableCell>{coupon.discountType === 'percentage' ? `${coupon.discountValue}%` : formatPrice(coupon.discountValue)}</TableCell>
                                <TableCell>{formatPrice(coupon.minOrderValue)}</TableCell>
                                <TableCell>{new Date(coupon.expiresAt).toLocaleDateString()}</TableCell>
                                <TableCell>{coupon.usedCount}{coupon.usageLimit ? ` / ${coupon.usageLimit}` : ''}</TableCell>
                                <TableCell align="right">
                                    <IconButton onClick={() => handleDelete(coupon._id)}><DeleteOutlineIcon /></IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Stack>
        </Stack>
    )
}
