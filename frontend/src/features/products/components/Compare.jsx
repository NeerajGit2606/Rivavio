import React, { useEffect, useState } from 'react'
import { Stack, Typography, Table, TableBody, TableCell, TableRow, Paper, Button, IconButton, Rating } from '@mui/material'
import { Link } from 'react-router-dom'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline'
import { axiosi } from '../../../config/axios'
import { formatPrice } from '../../../utils/formatPrice'
import { getCompareList, toggleCompare, clearCompare } from '../../../utils/compareStorage'

export const Compare = () => {
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)

    const loadProducts = async () => {
        setLoading(true)
        const ids = getCompareList()
        const results = await Promise.all(
            ids.map(id => axiosi.get(`/products/${id}`).then(res => res.data).catch(() => null))
        )
        setProducts(results.filter(Boolean))
        setLoading(false)
    }

    useEffect(() => { loadProducts() }, [])

    const handleRemove = (id) => {
        toggleCompare(id)
        setProducts(products.filter(p => p._id !== id))
    }

    if (loading) return null

    if (!products.length) {
        return (
            <Stack alignItems="center" mt={10} rowGap={2}>
                <Typography variant="h6">No products to compare yet</Typography>
                <Button component={Link} to="/products" variant="contained">Browse products</Button>
            </Stack>
        )
    }

    const rows = [
        { label: 'Image', render: (p) => <img src={p.thumbnail} alt={p.title} style={{ width: 100, height: 100, objectFit: 'contain' }} /> },
        { label: 'Title', render: (p) => <Typography component={Link} to={`/product-details/${p._id}`} sx={{ textDecoration: 'none' }}>{p.title}</Typography> },
        { label: 'Brand', render: (p) => p.brand?.name },
        { label: 'Price', render: (p) => formatPrice(p.price) },
        { label: 'Rating', render: (p) => <Rating value={p.averageRating || 0} readOnly size="small" /> },
        { label: 'Stock', render: (p) => p.stockQuantity > 0 ? `${p.stockQuantity} in stock` : 'Out of stock' },
        { label: 'Description', render: (p) => <Typography variant="body2" sx={{ maxWidth: 220 }}>{p.description}</Typography> },
        { label: '', render: (p) => <IconButton onClick={() => handleRemove(p._id)}><DeleteOutlineIcon /></IconButton> },
    ]

    return (
        <Stack p={4} alignItems="center">
            <Stack direction="row" justifyContent="space-between" width="100%" maxWidth={1000} mb={2}>
                <Typography variant="h4">Compare Products</Typography>
                <Button onClick={() => { clearCompare(); setProducts([]) }}>Clear all</Button>
            </Stack>
            <Table component={Paper} sx={{ maxWidth: 1000, overflowX: 'auto' }}>
                <TableBody>
                    {rows.map((row) => (
                        <TableRow key={row.label}>
                            <TableCell sx={{ fontWeight: 600 }}>{row.label}</TableCell>
                            {products.map((p) => (
                                <TableCell key={p._id}>{row.render(p)}</TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </Stack>
    )
}
