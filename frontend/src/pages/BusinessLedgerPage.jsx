import React from 'react'
import { Navbar } from '../features/navigation/components/Navbar'
import { BusinessLedger } from '../features/business/components/BusinessLedger'

export const BusinessLedgerPage = () => {
    return (
        <>
            <Navbar isProductList={true} />
            <BusinessLedger />
        </>
    )
}
