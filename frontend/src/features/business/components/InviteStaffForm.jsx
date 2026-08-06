import React, { useState } from 'react'
import { Stack, TextField, Typography, Paper } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { inviteStaff } from '../BusinessApi'

export const InviteStaffForm = ({ onInvited }) => {
    const [loading, setLoading] = useState(false)
    const { register, handleSubmit, reset, formState: { errors } } = useForm()

    const onSubmit = async (data) => {
        setLoading(true)
        try {
            await inviteStaff(data)
            toast.success('Team member invited')
            reset()
            onInvited()
        } catch (error) {
            toast.error(error?.message || 'Error inviting team member')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Stack component={Paper} elevation={1} p={3} rowGap={2} width="22rem" maxWidth="90vw">
            <Typography variant="h6">Invite Staff</Typography>
            <Typography variant="body2" color="text.secondary">
                They must already have an account (ask them to sign up first).
            </Typography>
            <Stack component="form" rowGap={2} onSubmit={handleSubmit(onSubmit)}>
                <TextField
                    label="Email"
                    {...register('email', { required: true })}
                    error={!!errors.email}
                />
                <LoadingButton loading={loading} type="submit" variant="contained">
                    Send Invite
                </LoadingButton>
            </Stack>
        </Stack>
    )
}
