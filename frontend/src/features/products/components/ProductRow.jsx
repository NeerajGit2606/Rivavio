import React from 'react'
import { Stack, Typography } from '@mui/material'
import { ProductCard } from './ProductCard'

export const ProductRow = ({ title, products }) => {
    if (!products?.length) return null

    return (
        <Stack rowGap={2} mt={4} px={2}>
            <Typography variant="h6" fontWeight={700}>{title}</Typography>
            <Stack direction="row" columnGap={2} sx={{ overflowX: 'auto', pb: 1 }}>
                {products.map((product) => (
                    <ProductCard
                        key={product._id}
                        id={product._id}
                        title={product.title}
                        thumbnail={product.thumbnail}
                        brand={product.brand?.name}
                        price={product.price}
                        stockQuantity={product.stockQuantity}
                        handleAddRemoveFromWishlist={() => {}}
                    />
                ))}
            </Stack>
        </Stack>
    )
}
