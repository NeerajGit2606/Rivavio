import React from 'react'
import { Navbar } from '../features/navigation/components/Navbar'
import { BillDetails } from '../features/business/components/BillDetails'

export const BillDetailsPage = () => {
    return (
        <>
            <Navbar isProductList={true} />
            <BillDetails />
        </>
    )
}
