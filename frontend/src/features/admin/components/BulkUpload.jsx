import React, { useState } from 'react'
import { Stack, Typography, Button, Paper, Alert, List, ListItem, ListItemText } from '@mui/material'
import { LoadingButton } from '@mui/lab'
import { axiosi } from '../../../config/axios'
import { toast } from 'react-toastify'

const SAMPLE_CSV = `title,description,price,discountPercentage,category,brand,stockQuantity,thumbnail,images
Sample T-Shirt,A comfortable cotton t-shirt,599,10,Clothing,Generic,50,https://example.com/thumb.jpg,https://example.com/img1.jpg|https://example.com/img2.jpg`

export const BulkUpload = () => {
    const [file, setFile] = useState(null)
    const [uploading, setUploading] = useState(false)
    const [result, setResult] = useState(null)

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
        const blob = new Blob([SAMPLE_CSV], { type: 'text/csv' })
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
