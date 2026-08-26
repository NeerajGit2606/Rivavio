import React, { useEffect, useState } from 'react'
import { Stack, Typography, Paper, Table, TableContainer, TableHead, TableRow, TableCell, TableBody, Chip, Link as MuiLink } from '@mui/material'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { getAllLedger } from '../BusinessApi'
import { formatPrice } from '../../../utils/formatPrice'

export const BusinessLedger = () => {
    const [entries, setEntries] = useState([])

    useEffect(() => {
        (async () => {
            try {
                const data = await getAllLedger()
                setEntries(data)
            } catch (error) {
                toast.error(error?.message || 'Error loading ledger')
            }
        })()
    }, [])

    return (
        <Stack alignItems="center" mt={5} mb={5}>
            <Stack width="50rem" maxWidth="95vw" rowGap={2}>
                <Typography variant="h5">Ledger</Typography>
                {entries.length === 0 ? (
                    <Typography color="text.secondary">No ledger entries yet.</Typography>
                ) : (
                    <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Type</TableCell>
                                <TableCell>Reason</TableCell>
                                <TableCell>Bill</TableCell>
                                <TableCell align="right">Amount</TableCell>
                                <TableCell align="right">Balance After</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {entries.map((entry) => (
                                <TableRow key={entry._id}>
                                    <TableCell>{new Date(entry.createdAt).toLocaleString()}</TableCell>
                                    <TableCell>
                                        <Chip size="small" label={entry.type} color={entry.type === 'credit' ? 'success' : 'default'} />
                                    </TableCell>
                                    <TableCell>{entry.reason}</TableCell>
                                    <TableCell>
                                        <MuiLink component={Link} to={`/business/bills/${entry.billId}`}>
                                            {String(entry.billId).slice(-6)}
                                        </MuiLink>
                                    </TableCell>
                                    <TableCell align="right">{formatPrice(entry.amountPaise / 100)}</TableCell>
                                    <TableCell align="right">{formatPrice(entry.balanceAfterPaise / 100)}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                    </TableContainer>
                )}
            </Stack>
        </Stack>
    )
}
