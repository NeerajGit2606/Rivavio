import {
    Box, Chip, FormControl, Grid, IconButton, InputAdornment, InputLabel,
    MenuItem, Select, Slider, Stack, TextField, Typography,
    useMediaQuery, useTheme
} from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import {
    fetchProductsAsync, resetProductFetchStatus,
    selectProductFetchStatus, selectProductIsFilterOpen,
    selectProductTotalResults, selectProducts, toggleFilters,
    setSearchQuery, setPriceRange, selectSearchQuery, selectPriceRange
} from '../ProductSlice'
import { ProductCard } from './ProductCard'
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import AddIcon from '@mui/icons-material/Add';
import { selectBrands } from '../../brands/BrandSlice'
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import { selectCategories } from '../../categories/CategoriesSlice'
import Pagination from '@mui/material/Pagination';
import { ITEMS_PER_PAGE } from '../../../constants'
import {
    createWishlistItemAsync, deleteWishlistItemByIdAsync,
    resetWishlistItemAddStatus, resetWishlistItemDeleteStatus,
    selectWishlistItemAddStatus, selectWishlistItemDeleteStatus, selectWishlistItems
} from '../../wishlist/WishlistSlice'
import { selectLoggedInUser } from '../../auth/AuthSlice'
import { toast } from 'react-toastify'
import { loadingAnimation } from '../../../assets'
import { resetCartItemAddStatus, selectCartItemAddStatus } from '../../cart/CartSlice'
import { motion } from 'framer-motion'
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import Lottie from 'lottie-react'
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CachedOutlinedIcon from '@mui/icons-material/CachedOutlined';
import HeadsetMicOutlinedIcon from '@mui/icons-material/HeadsetMicOutlined';
import VerifiedOutlinedIcon from '@mui/icons-material/VerifiedOutlined';
import { formatPrice } from '../../../utils/formatPrice';

const sortOptions = [
    { name: "Price: low to high", sort: "price", order: "asc" },
    { name: "Price: high to low", sort: "price", order: "desc" },
    { name: "Rating: high to low", sort: "averageRating", order: "desc" },
]

const DEBOUNCE_MS = 400

const trustFeatures = [
    { icon: <LocalShippingOutlinedIcon />, title: 'Free Shipping', desc: 'On orders over ₹999' },
    { icon: <CachedOutlinedIcon />, title: 'Easy Returns', desc: '30-day return policy' },
    { icon: <HeadsetMicOutlinedIcon />, title: '24/7 Support', desc: 'Always here for you' },
    { icon: <VerifiedOutlinedIcon />, title: 'Secure Payment', desc: '100% protected' },
]

export const ProductList = () => {
    const [searchParams] = useSearchParams()
    const [filters, setFilters] = useState(() => {
        const initial = {}
        const brandParam = searchParams.get('brand')
        const categoryParam = searchParams.get('category')
        if (brandParam) initial.brand = [brandParam]
        if (categoryParam) initial.category = [categoryParam]
        return initial
    })

    // Sync filters when URL params change (e.g. navbar category click)
    useEffect(() => {
        const categoryParam = searchParams.get('category')
        const brandParam = searchParams.get('brand')
        setFilters(prev => {
            const next = { ...prev }
            if (categoryParam) next.category = [categoryParam]
            else delete next.category
            if (brandParam) next.brand = [brandParam]
            else delete next.brand
            return next
        })
        setPage(1)
    }, [searchParams])
    const [page, setPage] = useState(1)
    const [sort, setSort] = useState(null)
    const theme = useTheme()

    const searchQuery = useSelector(selectSearchQuery)
    const priceRange = useSelector(selectPriceRange)
    const [searchInput, setSearchInput] = useState(searchQuery)
    const debounceTimer = useRef(null)

    const is600 = useMediaQuery(theme.breakpoints.down(600))
    const is500 = useMediaQuery(theme.breakpoints.down(500))
    const is488 = useMediaQuery(theme.breakpoints.down(488))

    const brands = useSelector(selectBrands)
    const categories = useSelector(selectCategories)
    const products = useSelector(selectProducts)
    const totalResults = useSelector(selectProductTotalResults)
    const loggedInUser = useSelector(selectLoggedInUser)
    const productFetchStatus = useSelector(selectProductFetchStatus)
    const wishlistItems = useSelector(selectWishlistItems)
    const wishlistItemAddStatus = useSelector(selectWishlistItemAddStatus)
    const wishlistItemDeleteStatus = useSelector(selectWishlistItemDeleteStatus)
    const cartItemAddStatus = useSelector(selectCartItemAddStatus)
    const isProductFilterOpen = useSelector(selectProductIsFilterOpen)
    const dispatch = useDispatch()

    const handleBrandFilters = (e) => {
        const filterSet = new Set(filters.brand)
        if (e.target.checked) filterSet.add(e.target.value)
        else filterSet.delete(e.target.value)
        setFilters({ ...filters, brand: Array.from(filterSet) })
    }

    const handleCategoryFilters = (e) => {
        const filterSet = new Set(filters.category)
        if (e.target.checked) filterSet.add(e.target.value)
        else filterSet.delete(e.target.value)
        setFilters({ ...filters, category: Array.from(filterSet) })
    }

    const handleSearchChange = (e) => {
        const val = e.target.value
        setSearchInput(val)
        clearTimeout(debounceTimer.current)
        debounceTimer.current = setTimeout(() => {
            dispatch(setSearchQuery(val))
            setPage(1)
        }, DEBOUNCE_MS)
    }

    const handleClearSearch = () => {
        setSearchInput('')
        dispatch(setSearchQuery(''))
        setPage(1)
    }

    const handlePriceRangeCommit = (e, newValue) => {
        dispatch(setPriceRange(newValue))
        setPage(1)
    }

    const handleFilterClose = () => { dispatch(toggleFilters()) }

    useEffect(() => { window.scrollTo({ top: 0, behavior: "instant" }) }, [])
    useEffect(() => { setPage(1) }, [totalResults])

    useEffect(() => {
        const finalFilters = { ...filters }
        finalFilters['pagination'] = { page, limit: ITEMS_PER_PAGE }
        finalFilters['sort'] = sort
        finalFilters['search'] = searchQuery
        finalFilters['priceRange'] = priceRange
        if (!loggedInUser?.isAdmin) finalFilters['user'] = true
        dispatch(fetchProductsAsync(finalFilters))
    }, [filters, page, sort, searchQuery, priceRange])

    useEffect(() => {
        if (wishlistItemAddStatus === 'fulfilled') toast.success("Added to wishlist")
        else if (wishlistItemAddStatus === 'rejected') toast.error("Error adding to wishlist")
    }, [wishlistItemAddStatus])

    useEffect(() => {
        if (wishlistItemDeleteStatus === 'fulfilled') toast.success("Removed from wishlist")
        else if (wishlistItemDeleteStatus === 'rejected') toast.error("Error removing from wishlist")
    }, [wishlistItemDeleteStatus])

    useEffect(() => {
        if (cartItemAddStatus === 'fulfilled') toast.success("Added to cart")
        else if (cartItemAddStatus === 'rejected') toast.error("Error adding to cart")
    }, [cartItemAddStatus])

    useEffect(() => {
        if (productFetchStatus === 'rejected') toast.error("Error fetching products")
    }, [productFetchStatus])

    useEffect(() => {
        return () => {
            dispatch(resetProductFetchStatus())
            dispatch(resetWishlistItemAddStatus())
            dispatch(resetWishlistItemDeleteStatus())
            dispatch(resetCartItemAddStatus())
        }
    }, [])

    const handleAddRemoveFromWishlist = (e, productId) => {
        if (e.target.checked) {
            dispatch(createWishlistItemAsync({ user: loggedInUser?._id, product: productId }))
        } else {
            const index = wishlistItems.findIndex((item) => item.product._id === productId)
            dispatch(deleteWishlistItemByIdAsync(wishlistItems[index]._id))
        }
    }

    return (
        <>
            {/* Filter Sidebar */}
            <motion.div
                style={{
                    position: "fixed", backgroundColor: "white",
                    height: "100vh", padding: '1.5rem',
                    overflowY: "scroll", width: is500 ? "100vw" : "22rem",
                    zIndex: 500, top: 0, boxShadow: '4px 0 20px rgba(0,0,0,0.1)'
                }}
                variants={{ show: { left: 0 }, hide: { left: -600 } }}
                initial={'hide'}
                transition={{ ease: "easeInOut", duration: 0.4, type: "spring" }}
                animate={isProductFilterOpen ? "show" : "hide"}
            >
                <Stack mb={'5rem'}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography variant='h6' fontWeight={700}>Filters</Typography>
                        <IconButton onClick={handleFilterClose} size="small">
                            <ClearIcon />
                        </IconButton>
                    </Stack>

                    {/* Price */}
                    <Accordion defaultExpanded sx={{ boxShadow: 'none', border: '1px solid #E8E8E1', '&:before': { display: 'none' } }}>
                        <AccordionSummary expandIcon={<AddIcon />}>
                            <Typography fontWeight={600} fontSize="14px">Price Range</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Stack px={1}>
                                <Slider
                                    value={priceRange}
                                    onChange={(e, v) => dispatch(setPriceRange(v))}
                                    onChangeCommitted={handlePriceRangeCommit}
                                    valueLabelDisplay="auto"
                                    min={0} max={10000} step={50}
                                    sx={{ color: '#0F1111' }}
                                />
                                <Stack direction='row' justifyContent='space-between'>
                                    <Typography variant='body2' fontWeight={600}>{formatPrice(priceRange[0])}</Typography>
                                    <Typography variant='body2' fontWeight={600}>{formatPrice(priceRange[1])}</Typography>
                                </Stack>
                            </Stack>
                        </AccordionDetails>
                    </Accordion>

                    {/* Brands */}
                    <Accordion sx={{ mt: 1, boxShadow: 'none', border: '1px solid #E8E8E1', '&:before': { display: 'none' } }}>
                        <AccordionSummary expandIcon={<AddIcon />}>
                            <Typography fontWeight={600} fontSize="14px">Brands</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0, pb: 1 }}>
                            <FormGroup onChange={handleBrandFilters}>
                                {brands?.map((brand) => (
                                    <motion.div key={brand._id} style={{ width: "fit-content" }} whileHover={{ x: 4 }}>
                                        <FormControlLabel sx={{ ml: 1, '& .MuiFormControlLabel-label': { fontSize: '14px' } }} control={<Checkbox size="small" sx={{ color: '#666', '&.Mui-checked': { color: '#0F1111' } }} />} label={brand.name} value={brand._id} />
                                    </motion.div>
                                ))}
                            </FormGroup>
                        </AccordionDetails>
                    </Accordion>

                    {/* Categories */}
                    <Accordion sx={{ mt: 1, boxShadow: 'none', border: '1px solid #E8E8E1', '&:before': { display: 'none' } }}>
                        <AccordionSummary expandIcon={<AddIcon />}>
                            <Typography fontWeight={600} fontSize="14px">Category</Typography>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 0, pb: 1 }}>
                            <FormGroup onChange={handleCategoryFilters}>
                                {categories?.map((category) => (
                                    <motion.div key={category._id} style={{ width: "fit-content" }} whileHover={{ x: 4 }}>
                                        <FormControlLabel sx={{ ml: 1, '& .MuiFormControlLabel-label': { fontSize: '14px' } }} control={<Checkbox size="small" sx={{ color: '#666', '&.Mui-checked': { color: '#0F1111' } }} />} label={category.name} value={category._id} />
                                    </motion.div>
                                ))}
                            </FormGroup>
                        </AccordionDetails>
                    </Accordion>
                </Stack>
            </motion.div>

            {/* Main content */}
            {productFetchStatus === 'pending' ? (
                <Stack width={is500 ? "35vh" : '25rem'} height={'calc(100vh - 4rem)'} justifyContent={'center'} mx="auto">
                    <Lottie animationData={loadingAnimation} />
                </Stack>
            ) : (
                <Box>
                    {/* Trust Features Strip */}
                    <Box sx={{ bgcolor: '#F7F7F7', borderTop: '1px solid #E8E8E1', borderBottom: '1px solid #E8E8E1', py: 2.5 }}>
                        <Stack
                            direction="row"
                            justifyContent="center"
                            flexWrap="wrap"
                            gap={is600 ? 2 : 6}
                            maxWidth={1200}
                            mx="auto"
                            px={2}
                        >
                            {trustFeatures.map((f, i) => (
                                <Stack key={i} direction="row" alignItems="center" gap={1.5}>
                                    <Box sx={{ color: '#0F1111' }}>{f.icon}</Box>
                                    <Stack>
                                        <Typography variant="body2" fontWeight={700} fontSize="13px" color="#0F1111">{f.title}</Typography>
                                        <Typography variant="body2" color="text.secondary" fontSize="12px">{f.desc}</Typography>
                                    </Stack>
                                </Stack>
                            ))}
                        </Stack>
                    </Box>

                    <Box px={is600 ? 2 : 4} py={4} maxWidth={1400} mx="auto">

                        {/* Search + Sort */}
                        <Stack
                            direction={is600 ? 'column' : 'row'}
                            justifyContent="space-between"
                            alignItems={is600 ? 'stretch' : 'center'}
                            gap={2}
                            mb={4}
                        >
                            <Stack direction="row" alignItems="center" gap={1}>
                                <Typography variant="h6" fontWeight={700} color="#0F1111">
                                    All Products
                                </Typography>
                                <Chip label={`${totalResults} items`} size="small" sx={{ bgcolor: '#F0F0F0', fontSize: '12px' }} />
                            </Stack>

                            <Stack direction={is600 ? 'column' : 'row'} gap={2} alignItems={is600 ? 'stretch' : 'center'}>
                                <TextField
                                    value={searchInput}
                                    onChange={handleSearchChange}
                                    placeholder="Search products..."
                                    size="small"
                                    sx={{
                                        width: is600 ? '100%' : '280px',
                                        '& .MuiOutlinedInput-root': {
                                            borderRadius: '2px',
                                            '&:hover fieldset': { borderColor: '#0F1111' },
                                            '&.Mui-focused fieldset': { borderColor: '#0F1111', borderWidth: '1px' },
                                        }
                                    }}
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: '#666' }} /></InputAdornment>,
                                        endAdornment: searchInput ? (
                                            <InputAdornment position="end">
                                                <IconButton size="small" onClick={handleClearSearch}><ClearIcon fontSize="small" /></IconButton>
                                            </InputAdornment>
                                        ) : null
                                    }}
                                />
                                <FormControl size="small" sx={{ width: is600 ? '100%' : '180px' }}>
                                    <InputLabel>Sort by</InputLabel>
                                    <Select
                                        label="Sort by"
                                        onChange={(e) => setSort(e.target.value)}
                                        value={sort}
                                        sx={{ borderRadius: '2px' }}
                                    >
                                        <MenuItem value={null}>Default</MenuItem>
                                        {sortOptions.map((option) => (
                                            <MenuItem key={option.name} value={option}>{option.name}</MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Stack>
                        </Stack>

                        {/* Product Grid */}
                        <Grid container spacing={is600 ? 1.5 : 2.5} justifyContent="flex-start">
                            {products.map((product) => (
                                <Grid item key={product._id}>
                                    <ProductCard
                                        id={product._id}
                                        title={product.title}
                                        thumbnail={product.thumbnail}
                                        brand={product.brand.name}
                                        price={product.price}
                                        stockQuantity={product.stockQuantity}
                                        handleAddRemoveFromWishlist={handleAddRemoveFromWishlist}
                                    />
                                </Grid>
                            ))}
                        </Grid>

                        {/* Pagination */}
                        <Stack alignItems="center" mt={6} gap={1}>
                            <Pagination
                                size={is488 ? 'medium' : 'large'}
                                page={page}
                                onChange={(e, page) => setPage(page)}
                                count={Math.ceil(totalResults / ITEMS_PER_PAGE)}
                                variant="outlined"
                                shape="rounded"
                                sx={{
                                    '& .MuiPaginationItem-root': { borderRadius: '2px' },
                                    '& .Mui-selected': { bgcolor: '#0F1111 !important', color: 'white', borderColor: '#0F1111' }
                                }}
                            />
                            <Typography variant="body2" color="text.secondary" fontSize="13px">
                                Showing {(page - 1) * ITEMS_PER_PAGE + 1}–{Math.min(page * ITEMS_PER_PAGE, totalResults)} of {totalResults} results
                            </Typography>
                        </Stack>
                    </Box>
                </Box>
            )}
        </>
    )
}
