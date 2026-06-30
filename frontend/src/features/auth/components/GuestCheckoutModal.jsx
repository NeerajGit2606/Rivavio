import React from 'react'
import { Dialog, DialogTitle, DialogContent, DialogActions, Stack, TextField, Button, Typography, Divider } from '@mui/material'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { guestCheckoutAsync, selectGuestCheckoutStatus } from '../AuthSlice'

// Shown when a logged-out shopper tries to add something to their cart.
// Lets them either log in, or continue with just a name+email (a lightweight
// "guest" account is created behind the scenes so cart/checkout work as-is).
export const GuestCheckoutModal = ({ open, onClose, onGuestReady }) => {
    const { register, handleSubmit, formState: { errors } } = useForm()
    const dispatch = useDispatch()
    const guestCheckoutStatus = useSelector(selectGuestCheckoutStatus)

    const onSubmit = async (data) => {
        const result = await dispatch(guestCheckoutAsync(data))
        if (result.meta.requestStatus === 'fulfilled') {
            onGuestReady?.(result.payload)
            onClose()
        }
    }

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle>Sign in to continue</DialogTitle>
            <DialogContent>
                <Stack rowGap={2} mt={1}>
                    <Button component={Link} to="/login" variant="contained" onClick={onClose}>
                        Log in to your account
                    </Button>

                    <Divider>or continue as guest</Divider>

                    <Stack component="form" rowGap={2} onSubmit={handleSubmit(onSubmit)}>
                        <TextField
                            label="Full name"
                            {...register('name', { required: 'Name is required' })}
                            error={!!errors.name}
                            helperText={errors.name?.message}
                        />
                        <TextField
                            label="Email"
                            {...register('email', { required: 'Email is required' })}
                            error={!!errors.email}
                            helperText={errors.email?.message}
                        />
                        <Typography variant="caption" color="text.secondary">
                            We will use this to send your order updates. No password needed.
                        </Typography>
                        <Button type="submit" variant="outlined" disabled={guestCheckoutStatus === 'pending'}>
                            Continue as Guest
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
            </DialogActions>
        </Dialog>
    )
}
