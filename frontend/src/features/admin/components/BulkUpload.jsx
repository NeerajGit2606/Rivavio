import React, { useEffect, useState } from 'react'
import { Stack, Typography, Button, Paper, Alert, List, ListItem, ListItemText } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { axiosi } from '../../../config/axios'
import { toast } from 'react-toastify'

export const BulkUpload = () => {
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState(null)
    const [sampleCategory, setSampleCategory] = useState('CategoryName')
    const [sampleBrand, setSampleBrand] = useState('BrandName')

    useEffect(() => {
        // Fetch real category + brand names so sample CSV always works
        axiosi.get('/categories').then(r => {
            const first = r.data?.[0]?.name
            if (first) setSampleCategory(first)
        }).catch(() => {})

        axiosi.get('/brands').then(r => {
            const first = r.data?.[0]?.name
            if (first) setSampleBrand(first)
        }).catch(() => {})
    }, [])

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a CSV file first')
            return
        }
        setUploading(true)
        setResult(null)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await axiosi.post('/products/bulk-upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            setResult(res.data)
            toast.success(`${res.data.inserted} products uploaded`)
        } catch (error) {
            toast.error(error?.response?.data?.message || 'Error uploading CSV')
        } finally {
            setUploading(false)
        }
    }

    const handleDownloadSample = () => {
        const csv = `title,description,price,discountPercentage,category,brand,stockQuantity,thumbnail,images\nSample Product 1,A sample product description,599,10,${sampleCategory},${sampleBrand},50,https://example.com/thumb.jpg,https://example.com/img1.jpg|https://example.com/img2.jpg\nSample Product 2,Another sample product,999,5,${sampleCategory},${sampleBrand},30,https://example.com/thumb2.jpg,https://example.com/img3.jpg`
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.setAttribute('download', 'sample-products.csv')
        document.body.appendChild(link)
        link.click()
        link.remove()
        window.URL.revokeObjectURL(url)
    }

    return (
        <Stack alignItems="center" mt={5} mb={5}>
            <Stack component={Paper} elevation={1} p={4} rowGap={2} width="32rem" maxWidth="90vw">
                <Typography variant="h5">Bulk Upload Products</Typography>
                <Typography variant="body2" color="text.secondary">
                    Upload a CSV with columns: title, description, price, discountPercentage, category, brand, stockQuantity, thumbnail, images (pipe "|" separated URLs).
                    Category and brand must match existing names.
                </Typography>

                <Typography variant="body2" color="text.secondary">
                    Available categories and brands:{' '}
                    <strong>{sampleCategory}</strong>, ... — check{' '}
                    <a href="/api/categories" target="_blank" rel="noreferrer">/api/categories</a>{' '}
                    and{' '}
                    <a href="/api/brands" target="_blank" rel="noreferrer">/api/brands</a>{' '}
                    for all names.
                </Typography>

                <Button variant="text" onClick={handleDownloadSample}>Download sample CSV</Button>

                <input type="file" accept=".csv" onChange={(e) => setFile(e.target.files[0])} />

                <LoadingButton loading={uploading} variant="contained" onClick={handleUpload}>
                    Upload
                </LoadingButton>

                {result && (
                    <Stack rowGap={1} mt={2}>
                        <Alert severity={result.failed ? 'warning' : 'success'}>
                            {result.inserted} inserted, {result.failed} failed
                        </Alert>
                        {result.errors?.length > 0 && (
                            <List dense sx={{ maxHeight: 200, overflowY: 'auto', bgcolor: '#fff5f5' }}>
                                {result.errors.map((err, i) => (
                                    <ListItem key={i}><ListItemText primary={err} /></ListItem>
                                ))}
                            </List>
                        )}
                    </Stack>
                )}
            </Stack>
        </Stack>
    )
}
