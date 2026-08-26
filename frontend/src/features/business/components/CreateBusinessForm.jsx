import React, { useState } from 'react'
import { Stack, Typography, Paper, TextField } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { createBusiness } from '../BusinessApi'

export const CreateBusinessForm = () => {
    const [loading, setLoading] = useState(false)
    const { register, handleSubmit, formState: { errors } } = useForm()

    const onSubmit = async (data) => {
        setLoading(true)
        try {
            await createBusiness(data)
            toast.success('Business created')
            // App.js's route table is rebuilt from loggedInUser.businessId, recomputed on
            // every render -- an in-SPA navigate() right after a checkAuth dispatch can still
            // land on the router snapshot from before that state change committed, producing
            // a bogus 404 (confirmed via browser testing, a setTimeout(0) deferral was not
            // enough to reliably beat the race). A hard navigation sidesteps the race
            // entirely: the whole app remounts and fetches checkAuth before routing at all.
            window.location.href = '/business/dashboard'
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
