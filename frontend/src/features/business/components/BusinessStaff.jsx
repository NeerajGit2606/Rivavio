import React, { useEffect, useState } from 'react'
import { Stack, Typography } from '@mui/material'
import { useSelector } from 'react-redux'
import { toast } from 'react-toastify'
import { selectLoggedInUser } from '../../auth/AuthSlice'
import { listStaff, removeStaff } from '../BusinessApi'
import { StaffTable } from './StaffTable'
import { InviteStaffForm } from './InviteStaffForm'

export const BusinessStaff = () => {
    const [members, setMembers] = useState([])
    const loggedInUser = useSelector(selectLoggedInUser)
    const isOwner = loggedInUser?.role === 'owner'

    const loadStaff = async () => {
        try {
            const data = await listStaff()
            setMembers(data)
        } catch (error) {
            toast.error(error?.message || 'Error loading team')
        }
    }

    useEffect(() => { loadStaff() }, [])

    const handleRemove = async (userId) => {
        try {
            await removeStaff(userId)
            toast.success('Team member removed')
            loadStaff()
        } catch (error) {
            toast.error(error?.message || 'Error removing team member')
        }
    }

    return (
        <Stack alignItems="center" mt={5} mb={5} rowGap={4}>
            <Stack width="40rem" maxWidth="95vw" rowGap={2}>
                <Typography variant="h5">Team</Typography>
                <StaffTable members={members} isOwner={isOwner} onRemove={handleRemove} />
            </Stack>

            {/* display-only gate: the backend's ownerMiddleware is the real security
                boundary, this just avoids showing an action a staff member can't use */}
            {isOwner && <InviteStaffForm onInvited={loadStaff} />}
        </Stack>
    )
}
