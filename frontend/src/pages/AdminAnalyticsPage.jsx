import React from 'react'
import { Navbar } from '../features/navigation/components/Navbar'
import { AdminAnalytics } from '../features/admin/components/AdminAnalytics'

export const AdminAnalyticsPage = () => {
  return (
    <>
    <Navbar isProductList={true}/>
    <AdminAnalytics/>
    </>
  )
}
