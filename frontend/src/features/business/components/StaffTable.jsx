import React from 'react'
import { Table, TableHead, TableRow, TableCell, TableBody, Paper, Chip, IconButton } from '@mui/material'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'

export const StaffTable = ({ members, isOwner, onRemove }) => {
    return (
        <Table component={Paper}>
            <TableHead>
                <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Role</TableCell>
                    {isOwner && <TableCell align="right">Action</TableCell>}
                </TableRow>
            </TableHead>
            <TableBody>
                {members.map((member) => (
                    <TableRow key={member._id}>
                        <TableCell>{member.name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell><Chip size="small" label={member.role} color={member.role === 'owner' ? 'primary' : 'default'} /></TableCell>
                        {isOwner && (
                            <TableCell align="right">
                                {member.role !== 'owner' && (
                                    <IconButton onClick={() => onRemove(member._id)}>
                                        <DeleteOutlineIcon />
                                    </IconButton>
                                )}
                            </TableCell>
                        )}
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    )
}
