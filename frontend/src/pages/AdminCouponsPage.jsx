import React from 'react'
import { Navbar } from '../features/navigation/components/Navbar'
import { AdminCoupons } from '../features/admin/components/AdminCoupons'

export const AdminCouponsPage = () => {
  return (
    <>
    <Navbar isProductList={true}/>
    <AdminCoupons/>
    </>
  )
}
