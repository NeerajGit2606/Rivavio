import React from 'react'
import { Navbar } from '../features/navigation/components/Navbar'
import { SharedWishlist } from '../features/wishlist/components/SharedWishlist'
import { Footer } from '../features/footer/Footer'

export const SharedWishlistPage = () => {
  return (
    <>
    <Navbar/>
    <SharedWishlist/>
    <Footer/>
    </>
  )
}
