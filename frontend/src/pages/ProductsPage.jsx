import React from 'react'
import { Navbar } from '../features/navigation/components/Navbar'
import { ProductList } from '../features/products/components/ProductList'
import { Footer } from '../features/footer/Footer'

export const ProductsPage = () => {
  return (
    <>
    <Navbar/>
    <ProductList/>
    <Footer/>
    </>
  )
}
