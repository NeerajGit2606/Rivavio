import React from 'react'
import { Navbar } from '../features/navigation/components/Navbar'
import { BulkUpload } from '../features/admin/components/BulkUpload'

export const AdminBulkUploadPage = () => {
  return (
    <>
    <Navbar isProductList={true}/>
    <BulkUpload/>
    </>
  )
}
