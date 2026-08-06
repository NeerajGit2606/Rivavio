import React from 'react'
import { Table, TableHead, TableRow, TableCell, TableBody, Paper, Chip, Link as MuiLink } from '@mui/material'
import { Link } from 'react-router-dom'
import { formatPrice } from '../../../utils/formatPrice'

const statusColor = {
    unpaid: 'error',
    partial: 'warning',
    paid: 'success',
}

export const BillsTable = ({ bills }) => {
    return (
        <Table component={Paper}>
            <TableHead>
                <TableRow>
                    <TableCell>Bill #</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell align="right">Total</TableCell>
                    <TableCell align="right">Outstanding</TableCell>
                    <TableCell>Status</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {bills.map((bill) => (
                    <TableRow key={bill._id}>
                        <TableCell>
                            <MuiLink component={Link} to={`/business/bills/${bill._id}`}>#{bill.billNumber}</MuiLink>
                        </TableCell>
                        <TableCell>{bill.customerName}</TableCell>
                        <TableCell>{bill.customerPhone}</TableCell>
                        <TableCell align="right">{formatPrice(bill.totalPaise / 100)}</TableCell>
                        <TableCell align="right">{formatPrice(bill.outstandingPaise / 100)}</TableCell>
                        <TableCell>
                            <Chip size="small" label={bill.status} color={statusColor[bill.status]} />
                        </TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
