import React, { useEffect, useState } from 'react'
import { Grid, Stack, Typography } from '@mui/material'
import { useParams } from 'react-router-dom'
import { fetchWishlistByUserId } from '../WishlistApi'
import { ProductCard } from '../../products/components/ProductCard'

// Public, read-only view of someone else's wishlist (no auth required) —
// reachable via the "Share" link on the Wishlist page.
export const SharedWishlist = () => {
    const { userId } = useParams()
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchWishlistByUserId(userId)
            .then(res => setItems(res.data))
            .catch(() => setItems([]))
            .finally(() => setLoading(false))
    }, [userId])

    if (loading) return null

    return (
        <Stack p={4} alignItems="center" rowGap={3}>
            <Typography variant="h4">Shared Wishlist</Typography>
            {!items.length ? (
                <Typography color="text.secondary">This wishlist is empty.</Typography>
            ) : (
                <Grid container gap={2} justifyContent="center">
                    {items.map((item) => (
                        <ProductCard
                            key={item._id}
                            id={item.product._id}
                            title={item.product.title}
                            thumbnail={item.product.thumbnail}
                            brand={item.product.brand.name}
                            price={item.product.price}
                            stockQuantity={item.product.stockQuantity}
                            handleAddRemoveFromWishlist={() => {}}
                        />
                    ))}
                </Grid>
            )}
        </Stack>
    )
}
