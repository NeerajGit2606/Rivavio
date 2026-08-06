import React, { useEffect, useState } from 'react'
import { Stack, Typography, Button } from '@mui/material'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getAllBills } from '../BusinessApi'
import { BillsTable } from './BillsTable'
import { RecordPaymentForm } from './RecordPaymentForm'

export const BusinessBills = () => {
    const [bills, setBills] = useState([])

    const loadBills = async () => {
        try {
            const data = await getAllBills()
            setBills(data)
        } catch (error) {
            toast.error(error?.message || 'Error loading bills')
        }
    }

    useEffect(() => { loadBills() }, [])

    return (
        <Stack alignItems="center" mt={5} mb={5} rowGap={4}>
            <Stack width="55rem" maxWidth="95vw" rowGap={2}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5">Bills</Typography>
                    <Button component={Link} to="/business/bills/new" variant="contained">New Bill</Button>
                </Stack>
                {bills.length === 0 ? (
                    <Typography color="text.secondary">No bills yet. Create your first one.</Typography>
                ) : (
                    <BillsTable bills={bills} />
                )}
            </Stack>

            <RecordPaymentForm onPaymentRecorded={loadBills} />
        </Stack>
    )
}
