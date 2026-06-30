import { Box, Chip, Stack, Typography, useMediaQuery, useTheme } from '@mui/material'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import FavoriteBorder from '@mui/icons-material/FavoriteBorder';
import Favorite from '@mui/icons-material/Favorite';
import Checkbox from '@mui/material/Checkbox';
import { useDispatch, useSelector } from 'react-redux';
import { selectWishlistItems } from '../../wishlist/WishlistSlice';
import { selectLoggedInUser } from '../../auth/AuthSlice';
import { addToCartAsync, selectCartItems } from '../../cart/CartSlice';
import { motion } from 'framer-motion'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import { formatPrice } from '../../../utils/formatPrice';
import { GuestCheckoutModal } from '../../auth/components/GuestCheckoutModal';
import { isInCompare, toggleCompare } from '../../../utils/compareStorage';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import { toast } from 'react-toastify';

export const ProductCard = ({ id, title, price, thumbnail, brand, stockQuantity, handleAddRemoveFromWishlist, isWishlistCard, isAdminCard }) => {

    const navigate = useNavigate()
    const wishlistItems = useSelector(selectWishlistItems)
    const loggedInUser = useSelector(selectLoggedInUser)
    const cartItems = useSelector(selectCartItems)
    const dispatch = useDispatch()
    const theme = useTheme()
    const is600 = useMediaQuery(theme.breakpoints.down(600))

    const [guestModalOpen, setGuestModalOpen] = useState(false)
    const [inCompare, setInCompare] = useState(isInCompare(id))

    const isProductAlreadyinWishlist = wishlistItems.some((item) => item.product._id === id)
    const isProductAlreadyInCart = cartItems.some((item) => item.product._id === id)

    const handleToggleCompare = (e) => {
        e.stopPropagation()
        const { list, limitReached } = toggleCompare(id)
        if (limitReached) {
            toast.error('You can compare up to 4 products at a time')
            return
        }
        setInCompare(list.includes(id))
    }

    const addToCart = (userId) => {
        dispatch(addToCartAsync({ user: userId, product: id }))
    }

    const handleAddToCart = (e) => {
        e.stopPropagation()
        if (!loggedInUser?._id) {
            setGuestModalOpen(true)
            return
        }
        addToCart(loggedInUser._id)
    }

    return (
        <motion.div
            whileHover={{ y: -6 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            style={{ width: is600 ? '160px' : '220px' }}
        >
            <Box
                onClick={() => navigate(`/product-details/${id}`)}
                sx={{
                    cursor: 'pointer',
                    bgcolor: 'white',
                    borderRadius: '2px',
                    overflow: 'hidden',
                    border: '1px solid #E8E8E1',
                    transition: 'box-shadow 0.25s',
                    '&:hover': { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' },
                    position: 'relative',
                }}
            >
                {/* Stock badge */}
                {stockQuantity <= 20 && stockQuantity > 0 && (
                    <Chip
                        label={stockQuantity === 1 ? 'Last 1!' : 'Low Stock'}
                        size="small"
                        sx={{
                            position: 'absolute', top: 10, left: 10, zIndex: 2,
                            bgcolor: '#B12704', color: 'white', fontSize: '11px', fontWeight: 600, borderRadius: '2px'
                        }}
                    />
                )}

                {/* Wishlist + Compare buttons */}
                {!isAdminCard && (
                    <Stack sx={{ position: 'absolute', top: 6, right: 6, zIndex: 2 }} rowGap={0.5}>
                        <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                            <Checkbox
                                onClick={(e) => e.stopPropagation()}
                                checked={isProductAlreadyinWishlist}
                                onChange={(e) => handleAddRemoveFromWishlist(e, id)}
                                icon={<FavoriteBorder sx={{ fontSize: 20, color: '#666' }} />}
                                checkedIcon={<Favorite sx={{ fontSize: 20, color: '#C45500' }} />}
                                sx={{ p: 0.5, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: '50%' }}
                            />
                        </motion.div>
                        <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}>
                            <Checkbox
                                onClick={handleToggleCompare}
                                checked={inCompare}
                                onChange={() => {}}
                                icon={<CompareArrowsIcon sx={{ fontSize: 20, color: '#666' }} />}
                                checkedIcon={<CompareArrowsIcon sx={{ fontSize: 20, color: '#1565C0' }} />}
                                sx={{ p: 0.5, bgcolor: 'rgba(255,255,255,0.9)', borderRadius: '50%' }}
                            />
                        </motion.div>
                    </Stack>
                )}

                {/* Product image */}
                <Box sx={{ bgcolor: '#F7F7F7', overflow: 'hidden', height: is600 ? '160px' : '200px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img
                        src={thumbnail}
                        alt={title}
                        style={{ width: '100%', height: '100%', objectFit: 'contain', transition: 'transform 0.4s ease' }}
                        onMouseEnter={e => e.target.style.transform = 'scale(1.06)'}
                        onMouseLeave={e => e.target.style.transform = 'scale(1)'}
                    />
                </Box>

                {/* Product info */}
                <Stack spacing={0.5} sx={{ p: is600 ? 1.5 : 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {brand}
                    </Typography>
                    <Typography
                        variant="body1"
                        fontWeight={500}
                        color="#0F1111"
                        sx={{
                            fontSize: is600 ? '13px' : '14px',
                            lineHeight: 1.4,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: '2.8em'
                        }}
                    >
                        {title}
                    </Typography>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" mt={0.5}>
                        <Typography fontWeight={700} color="#B12704" fontSize={is600 ? '15px' : '17px'}>
                            {formatPrice(price)}
                        </Typography>

                        {!isWishlistCard && !isAdminCard && (
                            isProductAlreadyInCart ? (
                                <Typography variant="body2" color="success.main" fontWeight={600} fontSize="12px">
                                    ✓ In Cart
                                </Typography>
                            ) : (
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Box
                                        onClick={handleAddToCart}
                                        sx={{
                                            display: 'flex', alignItems: 'center', gap: 0.5,
                                            bgcolor: '#0F1111', color: 'white',
                                            px: 1.5, py: 0.8, borderRadius: '2px',
                                            fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                                            '&:hover': { bgcolor: '#333' }
                                        }}
                                    >
                                        <ShoppingBagOutlinedIcon sx={{ fontSize: 14 }} />
                                        {!is600 && 'Add'}
                                    </Box>
                                </motion.div>
                            )
                        )}
                    </Stack>
                </Stack>
            </Box>
            <GuestCheckoutModal
                open={guestModalOpen}
                onClose={() => setGuestModalOpen(false)}
                onGuestReady={(guestUser) => addToCart(guestUser._id)}
            />
        </motion.div>
    )
}
