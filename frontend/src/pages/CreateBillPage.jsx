import React from 'react'
import { Navbar } from '../features/navigation/components/Navbar'
import { CreateBillForm } from '../features/business/components/CreateBillForm'

export const CreateBillPage = () => {
    return (
        <>
            <Navbar isProductList={true} />
            <CreateBillForm />
        </>
    )
}
