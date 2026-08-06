import React from 'react'
import { Navbar } from '../features/navigation/components/Navbar'
import { BusinessDashboard } from '../features/business/components/BusinessDashboard'

export const BusinessDashboardPage = () => {
    return (
        <>
            <Navbar isProductList={true} />
            <BusinessDashboard />
        </>
    )
}
