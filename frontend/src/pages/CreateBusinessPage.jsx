import React from 'react'
import { Navbar } from '../features/navigation/components/Navbar'
import { CreateBusinessForm } from '../features/business/components/CreateBusinessForm'

export const CreateBusinessPage = () => {
    return (
        <>
            <Navbar isProductList={true} />
            <CreateBusinessForm />
        </>
    )
}
