import React, { useEffect, useState } from 'react'
import { Stack, Typography, Paper, Chip, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Divider } from '@mui/material'
import { useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getBillById, getBillLedger } from '../BusinessApi'
import { formatPrice } from '../../../utils/formatPrice'

const statusColor = { unpaid: 'error', partial: 'warning', paid: 'success' }

export const BillDetails = () => {
    const { id } = useParams()
    const [bill, setBill] = useState(null)
    const [ledger, setLedger] = useState([])

    useEffect(() => {
        (async () => {
            try {
                const [billData, ledgerData] = await Promise.all([getBillById(id), getBillLedger(id)])
                setBill(billData)
                setLedger(ledgerData)
            } catch (error) {
                toast.error(error?.message || 'Error loading bill')
            }
        })()
    }, [id])

    if (!bill) return null

    const rupees = (paise) => formatPrice(paise / 100)

    return (
        <Stack alignItems="center" mt={5} mb={5} rowGap={4}>
            <Stack component={Paper} elevation={1} p={4} rowGap={1.5} width="32rem" maxWidth="90vw">
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h5">Bill #{bill.billNumber}</Typography>
                    <Chip label={bill.status} color={statusColor[bill.status]} />
                </Stack>
                <Typography variant="body2">Customer: {bill.customerName} ({bill.customerPhone})</Typography>
                <Typography variant="body2">Due: {new Date(bill.dueDate).toLocaleDateString()}</Typography>
                {bill.notes && <Typography variant="body2">Notes: {bill.notes}</Typography>}

                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2">Pricing Breakdown</Typography>
                <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Effective Weight</Typography><Typography variant="body2">{bill.effectiveWeightGrams} g</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Metal Value</Typography><Typography variant="body2">{rupees(bill.metalValuePaise)}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Making Charge</Typography><Typography variant="body2">{rupees(bill.makingChargePaise)}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography variant="body2">GST</Typography><Typography variant="body2">{rupees(bill.gstPaise)}</Typography></Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between"><Typography variant="subtitle2">Total</Typography><Typography variant="subtitle2">{rupees(bill.totalPaise)}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography variant="body2">Paid</Typography><Typography variant="body2">{rupees(bill.paidPaise)}</Typography></Stack>
                <Stack direction="row" justifyContent="space-between"><Typography variant="body2" fontWeight="bold">Outstanding</Typography><Typography variant="body2" fontWeight="bold">{rupees(bill.outstandingPaise)}</Typography></Stack>
            </Stack>

            <Stack width="40rem" maxWidth="95vw" rowGap={2}>
                <Typography variant="h6">Ledger Trail</Typography>
                <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Type</TableCell>
                            <TableCell>Reason</TableCell>
                            <TableCell align="right">Amount</TableCell>
                            <TableCell align="right">Balance After</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {ledger.map((entry) => (
                            <TableRow key={entry._id}>
                                <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                                <TableCell>
                                    <Chip size="small" label={entry.type} color={entry.type === 'credit' ? 'success' : 'default'} />
                                </TableCell>
                                <TableCell>{entry.reason}</TableCell>
                                <TableCell align="right">{rupees(entry.amountPaise)}</TableCell>
                                <TableCell align="right">{rupees(entry.balanceAfterPaise)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
                </TableContainer>
            </Stack>
        </Stack>
    )
}
