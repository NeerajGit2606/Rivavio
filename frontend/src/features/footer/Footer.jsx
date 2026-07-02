import { Box, Divider, Grid, IconButton, TextField, Typography, useMediaQuery, useTheme } from '@mui/material'
import { Stack } from '@mui/material'
import React from 'react'
import { facebookPng, instagramPng, twitterPng, linkedinPng } from '../../assets'
import SendIcon from '@mui/icons-material/Send';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export const Footer = () => {
    const theme = useTheme()
    const is768 = useMediaQuery(theme.breakpoints.down(768))

    const footerLinks = {
        'Company': [
            { label: 'About Us', to: '/about' },
            { label: 'Our Team', to: '/team' },
            { label: 'Careers', to: '/careers' },
            { label: 'Contact Us', to: '/contact' },
        ],
        'Support': [
            { label: 'Help Center', to: '/help' },
            { label: 'Track Order', to: '/orders' },
            { label: 'Returns', to: '/returns' },
            { label: 'FAQ', to: '/faq' },
        ],
        'Account': [
            { label: 'My Account', to: '/profile' },
            { label: 'Orders', to: '/orders' },
            { label: 'Wishlist', to: '/wishlist' },
            { label: 'Cart', to: '/cart' },
        ],
        'Legal': [
            { label: 'Privacy Policy', to: '/privacy-policy' },
            { label: 'Terms of Use', to: '/terms' },
            { label: 'Cookie Policy', to: '/cookie-policy' },
            { label: 'FAQ', to: '/faq' },
        ],
    }

    return (
        <Box sx={{ bgcolor: '#0F1111', color: 'white' }}>

            {/* Newsletter strip */}
            <Box sx={{ bgcolor: '#232F3E', py: 4, px: { xs: 2, md: 6 } }}>
                <Stack direction={is768 ? 'column' : 'row'} justifyContent="space-between" alignItems="center" gap={3} maxWidth={1200} mx="auto">
                    <Stack>
                        <Typography variant="h5" fontWeight={700} color="white">
                            Stay in the loop
                        </Typography>
                        <Typography variant="body2" color="#AAA" mt={0.5}>
                            Get exclusive deals and new arrivals directly in your inbox
                        </Typography>
                    </Stack>
                    <Stack direction="row" gap={0}>
                        <TextField
                            placeholder="Enter your email address"
                            size="small"
                            sx={{
                                width: is768 ? '100%' : '320px',
                                '& .MuiOutlinedInput-root': {
                                    bgcolor: 'white',
                                    borderRadius: '2px 0 0 2px',
                                    '& fieldset': { border: 'none' },
                                },
                                '& .MuiInputBase-input': { fontSize: '14px' }
                            }}
                        />
                        <Box sx={{
                            bgcolor: '#FF9900', px: 2.5, display: 'flex', alignItems: 'center',
                            borderRadius: '0 2px 2px 0', cursor: 'pointer', '&:hover': { bgcolor: '#E47911' }
                        }}>
                            <SendIcon sx={{ color: '#000', fontSize: 18 }} />
                        </Box>
                    </Stack>
                </Stack>
            </Box>

            {/* Main footer */}
            <Box sx={{ py: 6, px: { xs: 2, md: 6 } }}>
                <Grid container spacing={4} maxWidth={1200} mx="auto">

                    {/* Brand column */}
                    <Grid item xs={12} md={3}>
                        <Typography variant="h5" fontWeight={800} color="#FF9900" letterSpacing={2} mb={2}>
                            RIVAVIO
                        </Typography>
                        <Typography variant="body2" color="#999" lineHeight={1.8} mb={3}>
                            Your trusted destination for quality products, fast delivery, and exceptional service.
                        </Typography>

                        {/* Social icons */}
                        <Stack direction="row" gap={1.5}>
                            {[facebookPng, twitterPng, instagramPng, linkedinPng].map((icon, i) => (
                                <motion.div key={i} whileHover={{ y: -3 }} whileTap={{ scale: 0.9 }}>
                                    <Box sx={{
                                        width: 36, height: 36, borderRadius: '50%',
                                        border: '1px solid #444', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        cursor: 'pointer', '&:hover': { borderColor: '#FF9900', bgcolor: '#FF9900' }
                                    }}>
                                        <img src={icon} alt="" style={{ width: 16, height: 16, objectFit: 'contain' }} />
                                    </Box>
                                </motion.div>
                            ))}
                        </Stack>
                    </Grid>

                    {/* Links */}
                    {Object.entries(footerLinks).map(([heading, links]) => (
                        <Grid item xs={6} sm={3} md={2} key={heading}>
                            <Typography variant="body1" fontWeight={700} color="white" mb={2} fontSize="13px" textTransform="uppercase" letterSpacing="0.5px">
                                {heading}
                            </Typography>
                            <Stack gap={1}>
                                {links.map(link => (
                                    <motion.div key={link.label} whileHover={{ x: 3 }}>
                                        <Typography component={Link} to={link.to} variant="body2" color="#999" sx={{ display: 'block', fontSize: '13px', textDecoration: 'none', '&:hover': { color: '#FF9900' } }}>
                                            {link.label}
                                        </Typography>
                                    </motion.div>
                                ))}
                            </Stack>
                        </Grid>
                    ))}

                </Grid>
            </Box>

            <Divider sx={{ borderColor: '#2A2A2A' }} />

            {/* Bottom bar */}
            <Box sx={{ py: 2.5, px: { xs: 2, md: 6 } }}>
                <Stack direction={is768 ? 'column' : 'row'} justifyContent="space-between" alignItems="center" gap={1} maxWidth={1200} mx="auto">
                    <Typography variant="body2" color="#666" fontSize="13px">
                        © Rivavio {new Date().getFullYear()}. All rights reserved.
                    </Typography>
                    <Stack direction="row" gap={3}>
                        {[
                            { label: 'Privacy', to: '/privacy-policy' },
                            { label: 'Terms', to: '/terms' },
                            { label: 'Cookies', to: '/cookie-policy' },
                        ].map(item => (
                            <Typography key={item.label} component={Link} to={item.to} variant="body2" color="#666" fontSize="13px" sx={{ textDecoration: 'none', '&:hover': { color: '#FF9900' } }}>
                                {item.label}
                            </Typography>
                        ))}
                    </Stack>
                </Stack>
            </Box>
        </Box>
    )
}
