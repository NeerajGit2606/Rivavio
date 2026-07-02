import { Box, Button, Grid, Stack, TextField, Typography } from '@mui/material'
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined'
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined'
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined'
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined'
import { useState } from 'react'
import { toast } from 'react-toastify'
import { Navbar } from '../features/navigation/components/Navbar'
import { Footer } from '../features/footer/Footer'

export const ContactPage = () => {
    const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

    const handleSubmit = (e) => {
        e.preventDefault()
        toast.success('Message sent! We will get back to you within 24 hours.')
        setForm({ name: '', email: '', subject: '', message: '' })
    }

    const info = [
        { icon: <EmailOutlinedIcon />, label: 'Email', value: 'support@rivavio.com' },
        { icon: <PhoneOutlinedIcon />, label: 'Phone', value: '+91 98765 43210' },
        { icon: <LocationOnOutlinedIcon />, label: 'Address', value: '123 Commerce Street, Mumbai, Maharashtra 400001' },
        { icon: <AccessTimeOutlinedIcon />, label: 'Hours', value: 'Mon–Sat: 9 AM – 6 PM IST' },
    ]

    return (
        <>
            <Navbar />
            <Box sx={{ bgcolor: '#f9f9f7', minHeight: '60vh' }}>
                {/* Hero */}
                <Box sx={{ bgcolor: '#1a1a1a', py: 7, textAlign: 'center' }}>
                    <Typography sx={{ color: '#C9A96E', letterSpacing: 4, fontSize: 12, mb: 1 }}>GET IN TOUCH</Typography>
                    <Typography variant="h3" sx={{ color: 'white', fontFamily: '"Playfair Display", serif', fontWeight: 400 }}>Contact Us</Typography>
                </Box>

                <Box sx={{ maxWidth: 1100, mx: 'auto', px: { xs: 2, md: 5 }, py: 8 }}>
                    <Grid container spacing={6}>
                        {/* Form */}
                        <Grid item xs={12} md={7}>
                            <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', mb: 3 }}>Send Us a Message</Typography>
                            <Stack component="form" onSubmit={handleSubmit} gap={2.5}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Your Name" required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField fullWidth label="Email Address" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                                    </Grid>
                                </Grid>
                                <TextField fullWidth label="Subject" required value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} />
                                <TextField fullWidth label="Message" multiline rows={5} required value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} />
                                <Button type="submit" variant="contained" sx={{ bgcolor: '#1a1a1a', color: 'white', px: 5, py: 1.5, alignSelf: 'flex-start', '&:hover': { bgcolor: '#C9A96E' } }}>
                                    Send Message
                                </Button>
                            </Stack>
                        </Grid>

                        {/* Info */}
                        <Grid item xs={12} md={5}>
                            <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', mb: 3 }}>Contact Information</Typography>
                            <Stack gap={3}>
                                {info.map(({ icon, label, value }) => (
                                    <Stack key={label} direction="row" gap={2} alignItems="flex-start">
                                        <Box sx={{ color: '#C9A96E', mt: 0.3 }}>{icon}</Box>
                                        <Box>
                                            <Typography sx={{ fontWeight: 600, fontSize: 14, mb: 0.3 }}>{label}</Typography>
                                            <Typography sx={{ color: '#666', fontSize: 14 }}>{value}</Typography>
                                        </Box>
                                    </Stack>
                                ))}
                            </Stack>

                            <Box sx={{ mt: 4, p: 3, bgcolor: '#1a1a1a', borderRadius: 1 }}>
                                <Typography sx={{ color: '#C9A96E', fontWeight: 600, mb: 1 }}>Quick Response Guarantee</Typography>
                                <Typography sx={{ color: '#ccc', fontSize: 13, lineHeight: 1.8 }}>
                                    We respond to all inquiries within 24 hours on business days. For urgent matters, please call us directly.
                                </Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Box>
            <Footer />
        </>
    )
}
