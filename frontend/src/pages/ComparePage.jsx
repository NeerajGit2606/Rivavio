import React from 'react'
import { Navbar } from '../features/navigation/components/Navbar'
import { Compare } from '../features/products/components/Compare'
import { Footer } from '../features/footer/Footer'

export const ComparePage = () => {
  return (
    <>
    <Navbar/>
    <Compare/>
    <Footer/>
    </>
  )
}
