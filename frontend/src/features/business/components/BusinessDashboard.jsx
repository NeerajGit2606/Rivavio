import React, { useEffect, useState } from 'react'
import { Stack, Typography, Paper, Chip, Grid } from '@mui/material'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getMyBusiness } from '../BusinessApi'

const navCards = [
    { label: 'Bills', description: 'Create and view jewelry bills', to: '/business/bills' },
    { label: 'Ledger', description: 'Full debit/credit transaction history', to: '/business/ledger' },
    { label: 'Staff', description: 'Manage your team', to: '/business/staff' },
]

export const BusinessDashboard = () => {
    const [business, setBusiness] = useState(null)

    useEffect(() => {
        (async () => {
            try {
                const data = await getMyBusiness()
                setBusiness(data)
            } catch (error) {
                toast.error(error?.message || 'Error loading business')
            }
        })()
    }, [])

    if (!business) return null

    return (
        <Stack alignItems="center" mt={5} mb={5} rowGap={4}>
            <Stack component={Paper} elevation={1} p={4} rowGap={1.5} width="32rem" maxWidth="90vw">
                <Typography variant="h5">{business.name}</Typography>
                <Stack direction="row" columnGap={1}>
                    <Chip size="small" label={business.slug} />
                    <Chip size="small" color="primary" label={business.plan} />
                </Stack>
                {business.gstNumber && <Typography variant="body2">GST: {business.gstNumber}</Typography>}
                {business.phone && <Typography variant="body2">Phone: {business.phone}</Typography>}
                {business.address && <Typography variant="body2">Address: {business.address}</Typography>}
            </Stack>

            <Grid container gap={2} justifyContent="center" width="50rem" maxWidth="95vw">
                {navCards.map((card) => (
                    <Stack
                        key={card.to}
                        component={Link}
                        to={card.to}
                        sx={{ textDecoration: 'none' }}
                    >
                        <Stack component={Paper} elevation={1} p={3} rowGap={0.5} width="15rem" sx={{ '&:hover': { boxShadow: 4 } }}>
                            <Typography variant="h6" color="text.primary">{card.label}</Typography>
                            <Typography variant="body2" color="text.secondary">{card.description}</Typography>
                        </Stack>
                    </Stack>
                ))}
            </Grid>
        </Stack>
    )
}
