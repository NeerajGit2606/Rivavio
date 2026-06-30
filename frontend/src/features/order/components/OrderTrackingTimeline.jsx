import React from 'react'
import { Stack, Stepper, Step, StepLabel, Typography, Chip } from '@mui/material'

const STEPS = ['Pending', 'Dispatched', 'Out for delivery', 'Delivered']

export const OrderTrackingTimeline = ({ status, statusHistory = [] }) => {
    if (status === 'Cancelled') {
        return (
            <Stack direction="row" alignItems="center" columnGap={1}>
                <Chip label="Order Cancelled" color="error" size="small" />
            </Stack>
        )
    }

    const activeStep = Math.max(0, STEPS.indexOf(status))

    const findTimestamp = (stepStatus) => {
        const entry = [...statusHistory].reverse().find(h => h.status === stepStatus)
        return entry ? new Date(entry.updatedAt).toLocaleString() : null
    }

    return (
        <Stepper activeStep={activeStep} alternativeLabel sx={{ width: '100%' }}>
            {STEPS.map((step) => (
                <Step key={step} completed={STEPS.indexOf(step) <= activeStep}>
                    <StepLabel>
                        <Typography variant="body2">{step}</Typography>
                        {findTimestamp(step) && (
                            <Typography variant="caption" color="text.secondary">{findTimestamp(step)}</Typography>
                        )}
                    </StepLabel>
                </Step>
            ))}
        </Stepper>
    )
}
