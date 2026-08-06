import React from 'react'
import { Navbar } from '../features/navigation/components/Navbar'
import { BusinessStaff } from '../features/business/components/BusinessStaff'

export const BusinessStaffPage = () => {
    return (
        <>
            <Navbar isProductList={true} />
            <BusinessStaff />
        </>
    )
}
