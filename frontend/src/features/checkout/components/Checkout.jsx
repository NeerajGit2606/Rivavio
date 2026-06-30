import {
    Stack, TextField, Typography, Button,
    FormControl, Radio, Paper, IconButton,
    Grid, Box, useTheme, useMediaQuery, Collapse, Alert,
    Checkbox, FormControlLabel
} from '@mui/material'
import { LoadingButton } from '@mui/lab'
import React, { useEffect, useState } from 'react'
import { Cart } from '../../cart/components/Cart'
import { useForm } from 'react-hook-form'
import { useDispatch, useSelector } from 'react-redux'
import { addAddressAsync, selectAddressStatus, selectAddresses } from '../../address/AddressSlice'
import { selectLoggedInUser } from '../../auth/AuthSlice'
import { Link, useNavigate } from 'react-router-dom'
import { createOrderAsync, selectCurrentOrder, selectOrderStatus } from '../../order/OrderSlice'
import { resetCartByUserIdAsync, selectCartItems } from '../../cart/CartSlice'
import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { SHIPPING, TAXES } from '../../../constants'
import { motion } from 'framer-motion'
import { toast } from 'react-toastify'
import { RazorpayButton } from '../../payment/RazorpayButton'
import { formatPrice } from '../../../utils/formatPrice'
import { selectUserInfo } from '../../user/UserSlice'
import {
    validateCouponAsync, selectAppliedCoupon, selectCouponValidateStatus,
    selectCouponValidateError, clearCoupon, resetCouponValidateStatus
} from '../../coupon/CouponSlice'

export const Checkout = () => {

    const addresses = useSelector(selectAddresses)
    const [selectedAddress, setSelectedAddress] = useState(addresses[0])
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('COD')
    const [paymentError, setPaymentError] = useState('')

    const { register, handleSubmit, reset, formState: { errors } } = useForm()
    const dispatch = useDispatch()
    const loggedInUser = useSelector(selectLoggedInUser)
    const userInfo = useSelector(selectUserInfo)
    const addressStatus = useSelector(selectAddressStatus)
    const navigate = useNavigate()
    const cartItems = useSelector(selectCartItems)
    const orderStatus = useSelector(selectOrderStatus)
    const currentOrder = useSelector(selectCurrentOrder)

    const [couponInput, setCouponInput] = useState('')
    const appliedCoupon = useSelector(selectAppliedCoupon)
    const couponValidateStatus = useSelector(selectCouponValidateStatus)
    const couponValidateError = useSelector(selectCouponValidateError)
    const [useWallet, setUseWallet] = useState(false)

    const orderTotal = cartItems.reduce((acc, item) => (item.product.price * item.quantity) + acc, 0)
    const rawTotal = orderTotal + SHIPPING + TAXES
    const preWalletTotal = Math.max(0, rawTotal - (appliedCoupon?.discountAmount || 0))
    const walletBalance = userInfo?.walletBalance || 0
    const walletAmountUsed = useWallet ? Math.min(walletBalance, preWalletTotal) : 0
    const grandTotal = Math.max(0, preWalletTotal - walletAmountUsed)

    const theme = useTheme()
    const is900 = useMediaQuery(theme.breakpoints.down(900))
    const is480 = useMediaQuery(theme.breakpoints.down(480))

    const handleApplyCoupon = () => {
        if (!couponInput.trim()) return
        dispatch(validateCouponAsync({ code: couponInput.trim(), cartTotal: rawTotal }))
    }

    const handleRemoveCoupon = () => {
        dispatch(clearCoupon())
        setCouponInput('')
    }

    useEffect(() => {
        if (couponValidateStatus === 'rejected') {
            toast.error(couponValidateError?.message || 'Invalid coupon')
            dispatch(resetCouponValidateStatus())
        } else if (couponValidateStatus === 'fulfilled' && appliedCoupon) {
            toast.success(`Coupon applied: -${formatPrice(appliedCoupon.discountAmount)}`)
        }
    }, [couponValidateStatus])

    useEffect(() => {
        return () => { dispatch(clearCoupon()) }
    }, [])

    useEffect(() => {
        if (addressStatus === 'fulfilled') reset()
        else if (addressStatus === 'rejected') alert('Error adding your address')
    }, [addressStatus])

    useEffect(() => {
        if (currentOrder && currentOrder?._id) {
            dispatch(resetCartByUserIdAsync(loggedInUser?._id))
            navigate(`/order-success/${currentOrder?._id}`)
        }
    }, [currentOrder])

    const handleAddAddress = (data) => {
        dispatch(addAddressAsync({ ...data, user: loggedInUser._id }))
    }

    // COD order
    const handleCODOrder = () => {
        if (!selectedAddress) {
            toast.error('Please select a delivery address')
            return
        }
        const order = {
            user: loggedInUser._id,
            item: cartItems,
            address: selectedAddress,
            paymentMode: 'COD',
            paymentStatus: 'unpaid',
            total: rawTotal,
            couponCode: appliedCoupon?.code,
            walletAmountUsed,
        }
        dispatch(createOrderAsync(order))
    }

    // Razorpay success
    const handleRazorpaySuccess = (paymentData) => {
        setPaymentError('')
        const order = {
            user: loggedInUser._id,
            item: cartItems,
            address: selectedAddress,
            paymentMode: 'CARD',
            paymentStatus: 'paid',
            stripePaymentIntentId: paymentData.razorpay_payment_id,
            total: rawTotal,
            couponCode: appliedCoupon?.code,
            walletAmountUsed,
        }
        dispatch(createOrderAsync(order))
        toast.success('Payment successful!')
    }

    return (
        <Stack
            flexDirection="row"
            p={2}
            rowGap={10}
            justifyContent="center"
            flexWrap="wrap"
            mb="5rem"
            mt={2}
            columnGap={4}
            alignItems="flex-start"
        >
            {/* ── LEFT ── */}
            <Stack rowGap={4}>

                {/* Heading */}
                <Stack flexDirection="row" columnGap={is480 ? 0.3 : 1} alignItems="center">
                    <motion.div whileHover={{ x: -5 }}>
                        <IconButton component={Link} to="/cart">
                            <ArrowBackIcon fontSize={is480 ? 'medium' : 'large'} />
                        </IconButton>
                    </motion.div>
                    <Typography variant="h4">Shipping Information</Typography>
                </Stack>

                {/* Address form */}
                <Stack component="form" noValidate rowGap={2} onSubmit={handleSubmit(handleAddAddress)}>
                    <Stack>
                        <Typography gutterBottom>Type</Typography>
                        <TextField placeholder="Eg. Home, Business" {...register('type', { required: true })} />
                    </Stack>
                    <Stack>
                        <Typography gutterBottom>Street</Typography>
                        <TextField {...register('street', { required: true })} />
                    </Stack>
                    <Stack>
                        <Typography gutterBottom>Country</Typography>
                        <TextField {...register('country', { required: true })} />
                    </Stack>
                    <Stack>
                        <Typography gutterBottom>Phone Number</Typography>
                        <TextField type="number" {...register('phoneNumber', { required: true })} />
                    </Stack>
                    <Stack flexDirection="row">
                        <Stack width="100%">
                            <Typography gutterBottom>City</Typography>
                            <TextField {...register('city', { required: true })} />
                        </Stack>
                        <Stack width="100%">
                            <Typography gutterBottom>State</Typography>
                            <TextField {...register('state', { required: true })} />
                        </Stack>
                        <Stack width="100%">
                            <Typography gutterBottom>Postal Code</Typography>
                            <TextField type="number" {...register('postalCode', { required: true })} />
                        </Stack>
                    </Stack>
                    <Stack flexDirection="row" alignSelf="flex-end" columnGap={1}>
                        <LoadingButton loading={addressStatus === 'pending'} type="submit" variant="contained">
                            Add
                        </LoadingButton>
                        <Button color="error" variant="outlined" onClick={() => reset()}>Reset</Button>
                    </Stack>
                </Stack>

                {/* Existing addresses */}
                <Stack rowGap={3}>
                    <Stack>
                        <Typography variant="h6">Address</Typography>
                        <Typography variant="body2" color="text.secondary">Choose from existing Addresses</Typography>
                    </Stack>

                    <Grid container gap={2} width={is900 ? 'auto' : '50rem'} justifyContent="flex-start" alignContent="flex-start">
                        {addresses.map((address, index) => (
                            <FormControl key={address._id}>
                                <Stack
                                    p={2}
                                    width={is480 ? '100%' : '20rem'}
                                    height={is480 ? 'auto' : '15rem'}
                                    rowGap={2}
                                    component={Paper}
                                    elevation={1}
                                >
                                    <Stack flexDirection="row" alignItems="center">
                                        <Radio
                                            checked={selectedAddress === address}
                                            name="addressRadioGroup"
                                            onChange={() => setSelectedAddress(addresses[index])}
                                        />
                                        <Typography>{address.type}</Typography>
                                    </Stack>
                                    <Stack>
                                        <Typography>{address.street}</Typography>
                                        <Typography>{address.state}, {address.city}, {address.country}, {address.postalCode}</Typography>
                                        <Typography>{address.phoneNumber}</Typography>
                                    </Stack>
                                </Stack>
                            </FormControl>
                        ))}
                    </Grid>
                </Stack>

                {/* Payment Methods */}
                <Stack rowGap={3}>
                    <Stack>
                        <Typography variant="h6">Payment Methods</Typography>
                        <Typography variant="body2" color="text.secondary">Please select a payment method</Typography>
                    </Stack>

                    <Stack rowGap={2}>
                        {/* COD */}
                        <Stack flexDirection="row" alignItems="center">
                            <Radio
                                name="paymentMethod"
                                checked={selectedPaymentMethod === 'COD'}
                                onChange={() => setSelectedPaymentMethod('COD')}
                            />
                            <Typography>Cash on Delivery</Typography>
                        </Stack>

                        {/* Online Payment */}
                        <Stack flexDirection="row" alignItems="center">
                            <Radio
                                name="paymentMethod"
                                checked={selectedPaymentMethod === 'CARD'}
                                onChange={() => setSelectedPaymentMethod('CARD')}
                            />
                            <Typography>Online Payment (UPI / Card / NetBanking)</Typography>
                        </Stack>
                    </Stack>

                    {/* Razorpay Button - sirf CARD select hone par dikhega */}
                    <Collapse in={selectedPaymentMethod === 'CARD'}>
                        <Box mt={1} p={2.5} component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
                            {paymentError && (
                                <Alert severity="error" sx={{ mb: 2 }}>{paymentError}</Alert>
                            )}
                            <RazorpayButton
                                total={grandTotal}
                                userEmail={loggedInUser?.email}
                                userName={loggedInUser?.name}
                                onSuccess={handleRazorpaySuccess}
                                onError={(msg) => setPaymentError(msg)}
                                disabled={!selectedAddress}
                            />
                            {!selectedAddress && (
                                <Typography variant="caption" color="error" mt={1} display="block">
                                    Pehle delivery address select karo
                                </Typography>
                            )}
                        </Box>
                    </Collapse>
                </Stack>
            </Stack>

            {/* ── RIGHT: Order Summary ── */}
            <Stack width={is900 ? '100%' : 'auto'} alignItems={is900 ? 'flex-start' : ''}>
                <Typography variant="h4">Order Summary</Typography>

                {/* Coupon code */}
                <Stack width="100%" my={2}>
                    {appliedCoupon ? (
                        <Stack flexDirection="row" justifyContent="space-between" alignItems="center" p={1.5} sx={{ bgcolor: '#eafaf1', borderRadius: 1 }}>
                            <Typography variant="body2" color="success.main">
                                "{appliedCoupon.code}" applied — saved {formatPrice(appliedCoupon.discountAmount)}
                            </Typography>
                            <Button size="small" onClick={handleRemoveCoupon}>Remove</Button>
                        </Stack>
                    ) : (
                        <Stack flexDirection="row" columnGap={1}>
                            <TextField
                                size="small"
                                fullWidth
                                placeholder="Have a coupon code?"
                                value={couponInput}
                                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                            />
                            <LoadingButton
                                loading={couponValidateStatus === 'pending'}
                                variant="outlined"
                                onClick={handleApplyCoupon}
                            >
                                Apply
                            </LoadingButton>
                        </Stack>
                    )}
                </Stack>

                {/* Wallet */}
                {walletBalance > 0 && (
                    <FormControlLabel
                        sx={{ alignSelf: 'flex-start', mb: 1 }}
                        control={<Checkbox checked={useWallet} onChange={(e) => setUseWallet(e.target.checked)} />}
                        label={`Use wallet balance (${formatPrice(walletBalance)} available)`}
                    />
                )}

                <Cart checkout={true} discountAmount={appliedCoupon?.discountAmount || 0} couponCode={appliedCoupon?.code || ''} walletAmountUsed={walletAmountUsed} />

                {selectedPaymentMethod === 'COD' && (
                    <LoadingButton
                        fullWidth
                        loading={orderStatus === 'pending'}
                        variant="contained"
                        onClick={handleCODOrder}
                        size="large"
                    >
                        Place Order (Cash on Delivery)
                    </LoadingButton>
                )}
            </Stack>
        </Stack>
    )
}
