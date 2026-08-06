import React, { useState } from 'react'
import { Stack, Typography, Paper, TextField } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useForm } from 'react-hook-form'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { createBusiness } from '../BusinessApi'
import { checkAuthAsync } from '../../auth/AuthSlice'

export const CreateBusinessForm = () => {
    const [loading, setLoading] = useState(false)
    const { register, handleSubmit, formState: { errors } } = useForm()
    const dispatch = useDispatch()
    const navigate = useNavigate()

    const onSubmit = async (data) => {
        setLoading(true)
        try {
            await createBusiness(data)
            // the server re-issued our JWT cookie with the fresh businessId/role claims,
            // but Redux still holds the old loggedInUser -- re-run checkAuth so the app
            // (and route guards keyed on loggedInUser.businessId) pick up the change
            await dispatch(checkAuthAsync())
            toast.success('Business created')
            navigate('/business/dashboard')
        } catch (error) {
            toast.error(error?.message || 'Error creating business')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Stack alignItems="center" mt={5} mb={5}>
            <Stack component={Paper} elevation={1} p={4} rowGap={2} width="28rem" maxWidth="90vw">
                <Typography variant="h5">Start Your Business</Typography>
                <Typography variant="body2" color="text.secondary">
                    Set up your jewelry shop to start creating bills and tracking payments.
                </Typography>
                <Stack component="form" rowGap={2} onSubmit={handleSubmit(onSubmit)}>
                    <TextField
                        label="Business Name"
                        {...register('name', { required: true })}
                        error={!!errors.name}
                        helperText={errors.name ? 'Business name is required' : ''}
                    />
                    <TextField label="GST Number (optional)" {...register('gstNumber')} />
                    <TextField label="Phone (optional)" {...register('phone')} />
                    <TextField label="Address (optional)" multiline rows={2} {...register('address')} />
                    <LoadingButton loading={loading} type="submit" variant="contained">
                        Create Business
                    </LoadingButton>
                </Stack>
            </Stack>
        </Stack>
    )
}
