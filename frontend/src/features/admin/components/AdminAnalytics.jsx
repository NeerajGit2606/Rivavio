import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Grid, Paper, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { getOrderAnalyticsAsync, selectOrderAnalytics, selectOrderAnalyticsStatus } from '../../order/OrderSlice'
import { formatPrice } from '../../../utils/formatPrice'
import Lottie from 'lottie-react'
import { loadingAnimation } from '../../../assets'

const STATUS_COLORS = {
    Pending: '#dfc9f7',
    Dispatched: '#feed80',
    'Out for delivery': '#AACCFF',
    Delivered: '#b3f5ca',
    Cancelled: '#fac0c0'
}

export const AdminAnalytics = () => {
    const dispatch = useDispatch()
    const analytics = useSelector(selectOrderAnalytics)
    const analyticsStatus = useSelector(selectOrderAnalyticsStatus)
    const theme = useTheme()
    const is900 = useMediaQuery(theme.breakpoints.down(900))

    useEffect(() => {
        dispatch(getOrderAnalyticsAsync())
    }, [dispatch])

    if (analyticsStatus === 'pending' || !analytics) {
        return (
            <Stack width={'25rem'} height={'calc(100vh - 4rem)'} justifyContent={'center'} mx="auto">
                <Lottie animationData={loadingAnimation} />
            </Stack>
        )
    }

    return (
        <Stack p={is900 ? 2 : 4} rowGap={4}>
            <Typography variant="h4">Sales Analytics</Typography>

            {/* Summary cards */}
            <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography color="text.secondary">Total Revenue</Typography>
                        <Typography variant="h5" fontWeight={700}>{formatPrice(analytics.totalRevenue)}</Typography>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Paper elevation={1} sx={{ p: 2 }}>
                        <Typography color="text.secondary">Total Orders</Typography>
                        <Typography variant="h5" fontWeight={700}>{analytics.totalOrders}</Typography>
                    </Paper>
                </Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* Sales over last 30 days */}
                <Grid item xs={12} md={7}>
                    <Paper elevation={1} sx={{ p: 2, height: 350 }}>
                        <Typography mb={2}>Revenue (last 30 days)</Typography>
                        <ResponsiveContainer width="100%" height="85%">
                            <LineChart data={analytics.salesByDay}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(value) => formatPrice(value)} />
                                <Line type="monotone" dataKey="revenue" stroke="#0F1111" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Order status breakdown */}
                <Grid item xs={12} md={5}>
                    <Paper elevation={1} sx={{ p: 2, height: 350 }}>
                        <Typography mb={2}>Orders by Status</Typography>
                        <ResponsiveContainer width="100%" height="85%">
                            <PieChart>
                                <Pie data={analytics.statusBreakdown} dataKey="count" nameKey="_id" outerRadius={90} label>
                                    {analytics.statusBreakdown.map((entry) => (
                                        <Cell key={entry._id} fill={STATUS_COLORS[entry._id] || '#ccc'} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>

                {/* Top products */}
                <Grid item xs={12}>
                    <Paper elevation={1} sx={{ p: 2, height: 350 }}>
                        <Typography mb={2}>Top 5 Best-Selling Products</Typography>
                        <ResponsiveContainer width="100%" height="85%">
                            <BarChart data={analytics.topProducts}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="title" tick={{ fontSize: 11 }} />
                                <YAxis tick={{ fontSize: 11 }} />
                                <Tooltip />
                                <Bar dataKey="quantity" fill="#0F1111" />
                            </BarChart>
                        </ResponsiveContainer>
                    </Paper>
                </Grid>
            </Grid>
        </Stack>
    )
}
