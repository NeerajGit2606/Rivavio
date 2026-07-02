import { Box, Chip, Divider, Grid, Stack, Typography } from '@mui/material'
import GitHubIcon from '@mui/icons-material/GitHub'
import CodeIcon from '@mui/icons-material/Code'
import StorageIcon from '@mui/icons-material/Storage'
import CloudIcon from '@mui/icons-material/Cloud'
import SecurityIcon from '@mui/icons-material/Security'
import PaymentIcon from '@mui/icons-material/Payment'

const stack = [
    { icon: <CodeIcon />, label: 'Frontend', items: ['React 18', 'Redux Toolkit', 'MUI v5', 'Framer Motion', 'React Router v6'] },
    { icon: <StorageIcon />, label: 'Backend', items: ['Node.js', 'Express.js', 'MongoDB + Mongoose', 'JWT Auth (httpOnly)', 'Passport.js (Google OAuth)'] },
    { icon: <CloudIcon />, label: 'Infrastructure', items: ['AWS EC2 (Amazon Linux)', 'Docker + docker-compose', 'Nginx reverse proxy', 'Cloudflare CDN', 'GitHub Actions CI/CD'] },
    { icon: <SecurityIcon />, label: 'Security', items: ['httpOnly cookie JWT', 'bcrypt password hashing', 'OTP email verification', 'Role-based access control', 'CORS + helmet'] },
    { icon: <PaymentIcon />, label: 'Integrations', items: ['Razorpay payments', 'Nodemailer (email)', 'Google OAuth 2.0', 'PWA (installable)', 'Tawk.to live chat'] },
]

const features = [
    'Full auth flow (signup, OTP verify, login, Google OAuth, forgot/reset password)',
    'Product catalog with category, brand, price, search, sort filters',
    'Cart, Wishlist, Compare products',
    'Checkout with Razorpay payment gateway',
    'Order management (user + admin)',
    'Admin dashboard: analytics, product CRUD, bulk CSV upload, coupon management',
    'Shareable wishlists, product reviews & ratings',
    'PWA — installable on mobile',
    'Automated GitHub Actions deploy to EC2 on every push',
    'Responsive across all screen sizes',
]

export const DeveloperPage = () => {
    return (
        <Box sx={{ bgcolor: '#0F1111', minHeight: '100vh', color: 'white', py: 8, px: { xs: 3, md: 8 } }}>
            <Box maxWidth={900} mx="auto">

                {/* Header */}
                <Stack alignItems="center" textAlign="center" mb={8}>
                    <Typography sx={{ color: '#C9A96E', letterSpacing: 4, fontSize: 11, mb: 2 }}>BUILT BY</Typography>
                    <Typography variant="h2" sx={{ fontFamily: '"Playfair Display", serif', fontWeight: 400, mb: 1 }}>
                        Neeraj Verma
                    </Typography>
                    <Typography sx={{ color: '#888', fontSize: 15, mb: 3 }}>Full Stack Developer</Typography>
                    <Stack direction="row" gap={2} flexWrap="wrap" justifyContent="center">
                        <Chip
                            icon={<GitHubIcon sx={{ color: 'white !important', fontSize: 16 }} />}
                            label="github.com/NeerajGit2606/Rivavio"
                            sx={{ bgcolor: '#1a1a1a', color: '#C9A96E', border: '1px solid #333', fontSize: 12 }}
                        />
                        <Chip label="rivavio.com" sx={{ bgcolor: '#1a1a1a', color: '#C9A96E', border: '1px solid #333', fontSize: 12 }} />
                    </Stack>
                </Stack>

                <Divider sx={{ borderColor: '#222', mb: 8 }} />

                {/* Tech Stack */}
                <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', mb: 4, color: '#C9A96E' }}>
                    Tech Stack
                </Typography>
                <Grid container spacing={3} mb={8}>
                    {stack.map(({ icon, label, items }) => (
                        <Grid item xs={12} sm={6} key={label}>
                            <Box sx={{ bgcolor: '#1a1a1a', borderRadius: 1, p: 3, height: '100%', border: '1px solid #222' }}>
                                <Stack direction="row" gap={1.5} alignItems="center" mb={2}>
                                    <Box sx={{ color: '#C9A96E' }}>{icon}</Box>
                                    <Typography fontWeight={700} fontSize={14} letterSpacing={1} textTransform="uppercase">{label}</Typography>
                                </Stack>
                                <Stack gap={0.8}>
                                    {items.map(item => (
                                        <Typography key={item} sx={{ color: '#aaa', fontSize: 13 }}>· {item}</Typography>
                                    ))}
                                </Stack>
                            </Box>
                        </Grid>
                    ))}
                </Grid>

                <Divider sx={{ borderColor: '#222', mb: 8 }} />

                {/* Features */}
                <Typography variant="h5" sx={{ fontFamily: '"Playfair Display", serif', mb: 4, color: '#C9A96E' }}>
                    Features Built
                </Typography>
                <Grid container spacing={1.5} mb={8}>
                    {features.map((f, i) => (
                        <Grid item xs={12} sm={6} key={i}>
                            <Stack direction="row" gap={1.5} alignItems="flex-start">
                                <Typography sx={{ color: '#C9A96E', mt: 0.1 }}>✓</Typography>
                                <Typography sx={{ color: '#aaa', fontSize: 13, lineHeight: 1.7 }}>{f}</Typography>
                            </Stack>
                        </Grid>
                    ))}
                </Grid>

                <Divider sx={{ borderColor: '#222', mb: 6 }} />

                <Typography sx={{ color: '#444', fontSize: 12, textAlign: 'center' }}>
                    rivavio.com · Deployed on AWS EC2 · Built with MERN Stack
                </Typography>
            </Box>
        </Box>
    )
}
