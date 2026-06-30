import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { clearSelectedProduct, fetchProductByIdAsync, resetProductFetchStatus, selectProductFetchStatus, selectSelectedProduct } from '../ProductSlice'
import { Box, Checkbox, Rating, Stack, Typography, useMediaQuery, Button, Paper } from '@mui/material'
import { addToCartAsync, resetCartItemAddStatus, selectCartItemAddStatus, selectCartItems } from '../../cart/CartSlice'
import { selectLoggedInUser } from '../../auth/AuthSlice'
import { fetchReviewsByProductIdAsync, resetReviewFetchStatus, selectReviewFetchStatus, selectReviews, } from '../../review/ReviewSlice'
import { Reviews } from '../../review/components/Reviews'
import { toast } from 'react-toastify'
import { MotionConfig, motion } from 'framer-motion'
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CachedOutlinedIcon from '@mui/icons-material/CachedOutlined';
import Favorite from '@mui/icons-material/Favorite'
import { createWishlistItemAsync, deleteWishlistItemByIdAsync, resetWishlistItemAddStatus, resetWishlistItemDeleteStatus, selectWishlistItemAddStatus, selectWishlistItemDeleteStatus, selectWishlistItems } from '../../wishlist/WishlistSlice'
import { useTheme } from '@mui/material'
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';
import SwipeableViews from 'react-swipeable-views';
import { autoPlay } from 'react-swipeable-views-utils';
import MobileStepper from '@mui/material/MobileStepper';
import Lottie from 'lottie-react'
import { loadingAnimation } from '../../../assets'
import { formatPrice } from '../../../utils/formatPrice'
import { GuestCheckoutModal } from '../../auth/components/GuestCheckoutModal'
import { ProductRow } from './ProductRow'
import { axiosi } from '../../../config/axios'
import { addRecentlyViewed, getRecentlyViewed } from '../../../utils/recentlyViewed'

// ── Hardcoded fallbacks removed — variants now come from DB ──────────────────
const AutoPlaySwipeableViews = autoPlay(SwipeableViews);

export const ProductDetails = () => {
    const { id } = useParams()
    const product = useSelector(selectSelectedProduct)
    const loggedInUser = useSelector(selectLoggedInUser)
    const dispatch = useDispatch()
    const cartItems = useSelector(selectCartItems)
    const cartItemAddStatus = useSelector(selectCartItemAddStatus)
    const [quantity, setQuantity] = useState(1)
    const [selectedSize, setSelectedSize] = useState('')
    const [selectedColorIndex, setSelectedColorIndex] = useState(-1)
    const reviews = useSelector(selectReviews)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [guestModalOpen, setGuestModalOpen] = useState(false)
    const [recommendations, setRecommendations] = useState([])
    const [recentlyViewed, setRecentlyViewed] = useState([])
    const theme = useTheme()
    const is1420 = useMediaQuery(theme.breakpoints.down(1420))
    const is990 = useMediaQuery(theme.breakpoints.down(990))
    const is840 = useMediaQuery(theme.breakpoints.down(840))
    const is500 = useMediaQuery(theme.breakpoints.down(500))
    const is480 = useMediaQuery(theme.breakpoints.down(480))
    const is387 = useMediaQuery(theme.breakpoints.down(387))
    const is340 = useMediaQuery(theme.breakpoints.down(340))

    const wishlistItems = useSelector(selectWishlistItems)

    const isProductAlreadyInCart = cartItems.some((item) => item.product._id === id)
    const isProductAlreadyinWishlist = wishlistItems.some((item) => item.product._id === id)

    const productFetchStatus = useSelector(selectProductFetchStatus)
    const reviewFetchStatus = useSelector(selectReviewFetchStatus)

    const totalReviewRating = reviews.reduce((acc, review) => acc + review.rating, 0)
    const totalReviews = reviews.length
    const averageRating = parseInt(Math.ceil(totalReviewRating / totalReviews))

    const wishlistItemAddStatus = useSelector(selectWishlistItemAddStatus)
    const wishlistItemDeleteStatus = useSelector(selectWishlistItemDeleteStatus)

    // ── NEW: DB-driven variants ───────────────────────────────────────────
    // Derive unique sizes from product.variants (fallback: product.availableSizes)
    const availableSizes = product?.variants?.length
        ? [...new Set(product.variants.map(v => v.size).filter(Boolean))]
        : (product?.availableSizes ?? [])

    // Derive unique colors (label + hex) from product.variants
    const availableColors = product?.variants?.length
        ? (() => {
            const seen = new Set()
            return product.variants
                .filter(v => v.color)
                .reduce((acc, v) => {
                    if (!seen.has(v.color)) {
                        seen.add(v.color)
                        acc.push({ label: v.color, hex: v.colorHex || v.color })
                    }
                    return acc
                }, [])
        })()
        : (product?.availableColors ?? [])

    // Stock for a specific size+color combination
    const stockForVariant = (size, colorLabel) => {
        if (!product?.variants?.length) return product?.stockQuantity ?? 0
        const match = product.variants.find(v => v.size === size && v.color === colorLabel)
        return match ? match.stock : 0
    }

    const selectedColorLabel = availableColors[selectedColorIndex]?.label
    // ── END NEW ───────────────────────────────────────────────────────────

    const navigate = useNavigate()

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" })
    }, [])

    useEffect(() => {
        if (id) {
            dispatch(fetchProductByIdAsync(id))
            dispatch(fetchReviewsByProductIdAsync({ id, page: 1, limit: 5 }))

            axiosi.get(`/products/${id}/recommendations`).then(res => setRecommendations(res.data)).catch(() => setRecommendations([]))

            const otherViewedIds = getRecentlyViewed().filter(viewedId => viewedId !== id)
            Promise.all(otherViewedIds.map(viewedId => axiosi.get(`/products/${viewedId}`).then(res => res.data).catch(() => null)))
                .then(results => setRecentlyViewed(results.filter(Boolean)))

            addRecentlyViewed(id)
        }
    }, [id])

    useEffect(() => {
        if (cartItemAddStatus === 'fulfilled') {
            toast.success("Product added to cart")
        } else if (cartItemAddStatus === 'rejected') {
            toast.error('Error adding product to cart, please try again later')
        }
    }, [cartItemAddStatus])

    useEffect(() => {
        if (wishlistItemAddStatus === 'fulfilled') {
            toast.success("Product added to wishlist")
        } else if (wishlistItemAddStatus === 'rejected') {
            toast.error("Error adding product to wishlist, please try again later")
        }
    }, [wishlistItemAddStatus])

    useEffect(() => {
        if (wishlistItemDeleteStatus === 'fulfilled') {
            toast.success("Product removed from wishlist")
        } else if (wishlistItemDeleteStatus === 'rejected') {
            toast.error("Error removing product from wishlist, please try again later")
        }
    }, [wishlistItemDeleteStatus])

    useEffect(() => {
        if (productFetchStatus === 'rejected') {
            toast.error("Error fetching product details, please try again later")
        }
    }, [productFetchStatus])

    useEffect(() => {
        if (reviewFetchStatus === 'rejected') {
            toast.error("Error fetching product reviews, please try again later")
        }
    }, [reviewFetchStatus])

    useEffect(() => {
        return () => {
            dispatch(clearSelectedProduct())
            dispatch(resetProductFetchStatus())
            dispatch(resetReviewFetchStatus())
            dispatch(resetWishlistItemDeleteStatus())
            dispatch(resetWishlistItemAddStatus())
            dispatch(resetCartItemAddStatus())
        }
    }, [])

    const addToCart = (userId) => {
        dispatch(addToCartAsync({ user: userId, product: id, quantity }))
        setQuantity(1)
    }

    const handleAddToCart = () => {
        if (!loggedInUser?._id) {
            setGuestModalOpen(true)
            return
        }
        addToCart(loggedInUser._id)
    }

    const handleDecreaseQty = () => {
        if (quantity !== 1) { setQuantity(quantity - 1) }
    }

    const handleIncreaseQty = () => {
        if (quantity < 20 && quantity < product.stockQuantity) { setQuantity(quantity + 1) }
    }

    const handleSizeSelect = (size) => { setSelectedSize(size) }

    const handleAddRemoveFromWishlist = (e) => {
        if (e.target.checked) {
            dispatch(createWishlistItemAsync({ user: loggedInUser?._id, product: id }))
        } else {
            const index = wishlistItems.findIndex((item) => item.product._id === id)
            dispatch(deleteWishlistItemByIdAsync(wishlistItems[index]._id))
        }
    }

    const [activeStep, setActiveStep] = React.useState(0);
    const maxSteps = product?.images.length;
    const handleNext = () => setActiveStep((prev) => prev + 1);
    const handleBack = () => setActiveStep((prev) => prev - 1);
    const handleStepChange = (step) => setActiveStep(step);

    return (
        <>
            {!(productFetchStatus === 'rejected' && reviewFetchStatus === 'rejected') && <Stack sx={{ justifyContent: 'center', alignItems: 'center', mb: '2rem', rowGap: "2rem" }}>
                {
                    (productFetchStatus || reviewFetchStatus) === 'pending' ?
                        <Stack width={is500 ? "35vh" : '25rem'} height={'calc(100vh - 4rem)'} justifyContent={'center'} alignItems={'center'}>
                            <Lottie animationData={loadingAnimation} />
                        </Stack>
                        :
                        <Stack>

                            {/* product details */}
                            <Stack width={is480 ? "auto" : is1420 ? "auto" : '88rem'} p={is480 ? 2 : 0} height={is840 ? "auto" : "50rem"} rowGap={5} mt={is840 ? 0 : 5} justifyContent={'center'} mb={5} flexDirection={is840 ? "column" : "row"} columnGap={is990 ? "2rem" : "5rem"}>

                                {/* left stack (images) */}
                                <Stack sx={{ flexDirection: "row", columnGap: "2.5rem", alignSelf: "flex-start", height: "100%" }}>

                                    {/* image selection */}
                                    {!is1420 && <Stack sx={{ display: "flex", rowGap: '1.5rem', height: "100%", overflowY: "scroll" }}>
                                        {
                                            product && product.images.map((image, index) => (
                                                <motion.div key={index} whileHover={{ scale: 1.1 }} whileTap={{ scale: 1 }} style={{ width: "200px", cursor: "pointer" }} onClick={() => setSelectedImageIndex(index)}>
                                                    <img style={{ width: "100%", objectFit: "contain" }} src={image} alt={`${product.title} image`} />
                                                </motion.div>
                                            ))
                                        }
                                    </Stack>}

                                    {/* selected image */}
                                    <Stack mt={is480 ? "0rem" : '5rem'}>
                                        {
                                            is1420 ?
                                                <Stack width={is480 ? "100%" : is990 ? '400px' : "500px"} >
                                                    <AutoPlaySwipeableViews width={'100%'} height={'100%'} axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'} index={activeStep} onChangeIndex={handleStepChange} enableMouseEvents >
                                                        {
                                                            product?.images.map((image, index) => (
                                                                <div key={index} style={{ width: "100%", height: '100%' }}>
                                                                    {
                                                                        Math.abs(activeStep - index) <= 2
                                                                            ?
                                                                            <Box component="img" sx={{ width: '100%', objectFit: "contain", overflow: "hidden", aspectRatio: 1 / 1 }} src={image} alt={product?.title} />
                                                                            :
                                                                            null
                                                                    }
                                                                </div>
                                                            ))
                                                        }
                                                    </AutoPlaySwipeableViews>
                                                    <MobileStepper steps={maxSteps} position="static" activeStep={activeStep} nextButton={<Button size="small" onClick={handleNext} disabled={activeStep === maxSteps - 1} >Next{theme.direction === 'rtl' ? (<KeyboardArrowLeft />) : (<KeyboardArrowRight />)}</Button>} backButton={<Button size="small" onClick={handleBack} disabled={activeStep === 0}>{theme.direction === 'rtl' ? (<KeyboardArrowRight />) : (<KeyboardArrowLeft />)}Back</Button>} />
                                                </Stack>
                                                :
                                                <div style={{ width: "100%" }}>
                                                    <img style={{ width: "100%", objectFit: "contain", aspectRatio: 1 / 1 }} src={product?.images[selectedImageIndex]} alt={`${product?.title} image`} />
                                                </div>
                                        }
                                    </Stack>

                                </Stack>

                                {/* right stack - about product */}
                                <Stack rowGap={"1.5rem"} width={is480 ? "100%" : '25rem'}>

                                    {/* title rating price */}
                                    <Stack rowGap={".5rem"}>
                                        <Typography variant='h4' fontWeight={600}>{product?.title}</Typography>

                                        <Stack sx={{ flexDirection: "row", columnGap: is340 ? ".5rem" : "1rem", alignItems: "center", flexWrap: 'wrap', rowGap: '1rem' }}>
                                            <Rating value={averageRating} readOnly />
                                            <Typography>( {totalReviews === 0 ? "No reviews" : totalReviews === 1 ? `${totalReviews} Review` : `${totalReviews} Reviews`} )</Typography>
                                            <Typography color={product?.stockQuantity <= 10 ? "error" : product?.stockQuantity <= 20 ? "orange" : "green"}>{product?.stockQuantity <= 10 ? `Only ${product?.stockQuantity} left` : product?.stockQuantity <= 20 ? "Only few left" : "In Stock"}</Typography>
                                        </Stack>

                                        <Typography variant='h5'>{formatPrice(product?.price)}</Typography>
                                    </Stack>

                                    {/* description */}
                                    <Stack rowGap={".8rem"}>
                                        <Typography>{product?.description}</Typography>
                                        <hr />
                                    </Stack>

                                    {/* color, size and add-to-cart */}
                                    {
                                        !loggedInUser?.isAdmin &&

                                        <Stack sx={{ rowGap: "1.3rem" }} width={'fit-content'}>

                                            {/* ── NEW: DB-driven Colors ────────────────────────── */}
                                            {
                                                availableColors.length > 0 && (
                                                    <Stack flexDirection={'row'} alignItems={'center'} columnGap={is387 ? '5px' : '1rem'} width={'fit-content'}>
                                                        <Typography>Colors: </Typography>
                                                        <Stack flexDirection={'row'} columnGap={is387 ? ".5rem" : ".2rem"} flexWrap='wrap' rowGap={1}>
                                                            {
                                                                availableColors.map((colorObj, index) => (
                                                                    <div
                                                                        key={index}
                                                                        title={colorObj.label}
                                                                        style={{
                                                                            backgroundColor: "white",
                                                                            border: selectedColorIndex === index ? `1px solid ${theme.palette.primary.dark}` : "",
                                                                            width: is340 ? "40px" : "50px",
                                                                            height: is340 ? "40px" : "50px",
                                                                            display: "flex",
                                                                            justifyContent: "center",
                                                                            alignItems: "center",
                                                                            borderRadius: "100%",
                                                                            cursor: "pointer"
                                                                        }}
                                                                    >
                                                                        <div
                                                                            onClick={() => setSelectedColorIndex(index)}
                                                                            style={{
                                                                                width: "40px",
                                                                                height: "40px",
                                                                                border: colorObj.hex === '#F6F6F6' ? "1px solid grayText" : "",
                                                                                backgroundColor: colorObj.hex,
                                                                                borderRadius: "100%"
                                                                            }}
                                                                        />
                                                                    </div>
                                                                ))
                                                            }
                                                        </Stack>
                                                    </Stack>
                                                )
                                            }
                            
                                            {/* ── NEW: DB-driven Sizes ────────────────────────── */}
                                            {
                                                availableSizes.length > 0 && (
                                            <Stack flexDirection={'row'} alignItems={'center'} columnGap={is387 ? '5px' : '1rem'} width={'fit-content'}>
                                                <Typography>Size: </Typography>
                                                        <Stack flexDirection={'row'} columnGap={is387 ? ".5rem" : "1rem"} flexWrap='wrap' rowGap={1}>
                                                    {
                                                                availableSizes.map((size) => {
                                                                    // If a color is selected, check per-variant stock
                                                                    const variantStock = selectedColorLabel
                                                                        ? stockForVariant(size, selectedColorLabel)
                                                                        : (product?.stockQuantity ?? 1)
                                                                    const outOfStock = selectedColorLabel && variantStock === 0
                                                                    return (
                                                                        <motion.div
                                                                            key={size}
                                                                            onClick={() => !outOfStock && handleSizeSelect(size)}
                                                                            whileHover={!outOfStock ? { scale: 1.050 } : {}}
                                                                            whileTap={!outOfStock ? { scale: 1 } : {}}
                                                                            style={{
                                                                                border: selectedSize === size ? '' : '1px solid grayText',
                                                                                borderRadius: "8px",
                                                                                width: "30px",
                                                                                height: "30px",
                                                                                display: "flex",
                                                                                justifyContent: "center",
                                                                                alignItems: "center",
                                                                                cursor: outOfStock ? "not-allowed" : "pointer",
                                                                                padding: "1.2rem",
                                                                                backgroundColor: outOfStock ? "#f0f0f0" : selectedSize === size ? "#DB4444" : "whitesmoke",
                                                                                color: outOfStock ? "#aaa" : selectedSize === size ? "white" : "",
                                                                                opacity: outOfStock ? 0.5 : 1,
                                                                                textDecoration: outOfStock ? "line-through" : "none"
                                                                            }}
                                                                        >
                                                                <p>{size}</p>
                                                            </motion.div>
                                                                    )
                                                                })
                                                    }
                                                </Stack>
                                            </Stack>
                                                )
                                            }

                                            {/* quantity, add to cart and wishlist */}
                                            <Stack flexDirection={"row"} columnGap={is387 ? ".3rem" : "1.5rem"} width={'100%'}>

                                                {/* quantity */}
                                                <Stack flexDirection={'row'} alignItems={'center'} justifyContent={'space-between'}>
                                                    <MotionConfig whileHover={{ scale: 1.050 }} whileTap={{ scale: 1 }}>
                                                        <motion.button onClick={handleDecreaseQty} style={{ padding: "10px 15px", fontSize: "1.050rem", backgroundColor: "", color: "black", outline: "none", border: '1px solid black', borderRadius: "8px" }}>-</motion.button>
                                                        <p style={{ margin: "0 1rem", fontSize: "1.1rem", fontWeight: '400' }}>{quantity}</p>
                                                        <motion.button onClick={handleIncreaseQty} style={{ padding: "10px 15px", fontSize: "1.050rem", backgroundColor: "black", color: "white", outline: "none", border: 'none', borderRadius: "8px" }}>+</motion.button>
                                                    </MotionConfig>
                                                </Stack>

                                                {/* add to cart */}
                                                {
                                                    isProductAlreadyInCart ?
                                                        <button style={{ padding: "10px 15px", fontSize: "1.050rem", backgroundColor: "black", color: "white", outline: "none", border: 'none', borderRadius: "8px" }} onClick={() => navigate("/cart")}>In Cart</button>
                                                        : <motion.button whileHover={{ scale: 1.050 }} whileTap={{ scale: 1 }} onClick={handleAddToCart} style={{ padding: "10px 15px", fontSize: "1.050rem", backgroundColor: "black", color: "white", outline: "none", border: 'none', borderRadius: "8px" }}>Add To Cart</motion.button>
                                                }

                                                {/* wishlist */}
                                                <motion.div style={{ border: "1px solid grayText", borderRadius: "4px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                                                    <Checkbox checked={isProductAlreadyinWishlist} onChange={(e) => handleAddRemoveFromWishlist(e)} icon={<FavoriteBorder />} checkedIcon={<Favorite sx={{ color: 'red' }} />} />
                                                </motion.div>

                                            </Stack>

                                        </Stack>

                                    }

                                    {/* product perks */}
                                    <Stack mt={3} sx={{ justifyContent: "center", alignItems: 'center', border: "1px grayText solid", borderRadius: "7px" }}>
                                        <Stack p={2} flexDirection={'row'} alignItems={"center"} columnGap={'1rem'} width={'100%'} justifyContent={'flex-sart'}>
                                            <Box><LocalShippingOutlinedIcon /></Box>
                                            <Stack>
                                                <Typography>Free Delivery</Typography>
                                                <Typography>Enter your postal for delivery availabity</Typography>
                                            </Stack>
                                        </Stack>
                                        <hr style={{ width: "100%" }} />
                                        <Stack p={2} flexDirection={'row'} alignItems={"center"} width={'100%'} columnGap={'1rem'} justifyContent={'flex-start'}>
                                            <Box><CachedOutlinedIcon /></Box>
                                            <Stack>
                                                <Typography>Return Delivery</Typography>
                                                <Typography>Free 30 Days Delivery Returns</Typography>
                                            </Stack>
                                        </Stack>
                                    </Stack>

                                </Stack>

                            </Stack>

                            {/* reviews */}
                            <Stack width={is1420 ? "auto" : '88rem'} p={is480 ? 2 : 0}>
                                <Reviews productId={id} averageRating={averageRating} />
                            </Stack>

                            {/* recommendations + recently viewed */}
                            <Stack width={is1420 ? "auto" : '88rem'}>
                                <ProductRow title="You may also like" products={recommendations} />
                                <ProductRow title="Recently viewed" products={recentlyViewed} />
                            </Stack>

                        </Stack>
                }

            </Stack>
            }
            <GuestCheckoutModal
                open={guestModalOpen}
                onClose={() => setGuestModalOpen(false)}
                onGuestReady={(guestUser) => addToCart(guestUser._id)}
            />
        </>
    )
}
