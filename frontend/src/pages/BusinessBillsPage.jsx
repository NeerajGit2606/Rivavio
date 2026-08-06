import React from 'react'
import { Navbar } from '../features/navigation/components/Navbar'
import { BusinessBills } from '../features/business/components/BusinessBills'

export const BusinessBillsPage = () => {
    return (
        <>
            <Navbar isProductList={true} />
            <BusinessBills />
        </>
    )
}
