import {
    FormControl, Grid, IconButton, InputLabel, MenuItem,
    Select, Slider, Stack, TextField, Typography,
    useMediaQuery, useTheme, InputAdornment
} from '@mui/material'
import React, { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
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
import { banner1, banner2, banner3, banner4, loadingAnimation } from '../../../assets'
import { resetCartItemAddStatus, selectCartItemAddStatus } from '../../cart/CartSlice'
import { motion } from 'framer-motion'
import { ProductBanner } from './ProductBanner'
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import Lottie from 'lottie-react'

const sortOptions = [
    { name: "Price: low to high", sort: "price", order: "asc" },
    { name: "Price: high to low", sort: "price", order: "desc" },
    { name: "Rating: high to low", sort: "averageRating", order: "desc" },
]

const bannerImages = [banner1, banner3, banner2, banner4]
const DEBOUNCE_MS = 400

export const ProductList = () => {
    const [filters, setFilters] = useState({})
    const [page, setPage] = useState(1)
    const [sort, setSort] = useState(null)
    const theme = useTheme()

    const searchQuery = useSelector(selectSearchQuery)
    const priceRange = useSelector(selectPriceRange)
    const [searchInput, setSearchInput] = useState(searchQuery)
    const debounceTimer = useRef(null)

    const is1200 = useMediaQuery(theme.breakpoints.down(1200))
    const is800 = useMediaQuery(theme.breakpoints.down(800))
    const is700 = useMediaQuery(theme.breakpoints.down(700))
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
    // BUG FIX: was inside loading branch — now always at top level so sidebar
    // is always mounted and animation never resets mid-flight
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

    // Commit price range only on mouse-up so we don't spam API on every px
    const handlePriceRangeCommit = (e, newValue) => {
        dispatch(setPriceRange(newValue))
        setPage(1)
    }

    const handleFilterClose = () => { dispatch(toggleFilters()) }

    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "instant" })
    }, [])

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
        if (wishlistItemAddStatus === 'fulfilled') toast.success("Product added to wishlist")
        else if (wishlistItemAddStatus === 'rejected') toast.error("Error adding product to wishlist, please try again later")
    }, [wishlistItemAddStatus])

    useEffect(() => {
        if (wishlistItemDeleteStatus === 'fulfilled') toast.success("Product removed from wishlist")
        else if (wishlistItemDeleteStatus === 'rejected') toast.error("Error removing product from wishlist, please try again later")
    }, [wishlistItemDeleteStatus])

    useEffect(() => {
        if (cartItemAddStatus === 'fulfilled') toast.success("Product added to cart")
        else if (cartItemAddStatus === 'rejected') toast.error("Error adding product to cart, please try again later")
    }, [cartItemAddStatus])

    useEffect(() => {
        if (productFetchStatus === 'rejected') toast.error("Error fetching products, please try again later")
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
            {/* ── Filter sidebar — OUTSIDE loading check so it's always mounted ── */}
                        <motion.div
                style={{
                    position: "fixed",
                    backgroundColor: "white",
                    height: "100vh",
                    padding: '1rem',
                    overflowY: "scroll",
                    width: is500 ? "100vw" : "30rem",
                    zIndex: 500,
                    top: 0,
                }}
                variants={{ show: { left: 0 }, hide: { left: -600 } }}
                            initial={'hide'}
                transition={{ ease: "easeInOut", duration: 0.7, type: "spring" }}
                animate={isProductFilterOpen ? "show" : "hide"}
                        >
                <Stack mb={'5rem'}>
                                <Typography variant='h4'>Filters</Typography>

                                <IconButton onClick={handleFilterClose} style={{ position: "absolute", top: 15, right: 15 }}>
                                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                                        <ClearIcon fontSize='medium' />
                                    </motion.div>
                                </IconButton>

                    {/* Price range */}
                                <Stack mt={3}>
                                    <Accordion defaultExpanded>
                                        <AccordionSummary expandIcon={<AddIcon />}>
                                            <Typography>Price Range</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails>
                                            <Stack px={2}>
                                                <Slider
                                                    value={priceRange}
                                        onChange={(e, v) => dispatch(setPriceRange(v))}
                                        onChangeCommitted={handlePriceRangeCommit}
                                                    valueLabelDisplay="auto"
                                                    min={0}
                                                    max={10000}
                                                    step={50}
                                                />
                                                <Stack flexDirection='row' justifyContent='space-between'>
                                                    <Typography variant='body2'>${priceRange[0]}</Typography>
                                                    <Typography variant='body2'>${priceRange[1]}</Typography>
                                                </Stack>
                                            </Stack>
                                        </AccordionDetails>
                                    </Accordion>
                                </Stack>

                    {/* Brand filters */}
                                <Stack mt={2}>
                                    <Accordion>
                            <AccordionSummary expandIcon={<AddIcon />}>
                                            <Typography>Brands</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ p: 0 }}>
                                            <FormGroup onChange={handleBrandFilters}>
                                    {brands?.map((brand) => (
                                                        <motion.div key={brand._id} style={{ width: "fit-content" }} whileHover={{ x: 5 }} whileTap={{ scale: 0.9 }}>
                                                            <FormControlLabel sx={{ ml: 1 }} control={<Checkbox />} label={brand.name} value={brand._id} />
                                                        </motion.div>
                                    ))}
                                            </FormGroup>
                                        </AccordionDetails>
                                    </Accordion>
                                </Stack>

                    {/* Category filters */}
                                <Stack mt={2}>
                                    <Accordion>
                            <AccordionSummary expandIcon={<AddIcon />}>
                                            <Typography>Category</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ p: 0 }}>
                                            <FormGroup onChange={handleCategoryFilters}>
                                    {categories?.map((category) => (
                                                        <motion.div key={category._id} style={{ width: "fit-content" }} whileHover={{ x: 5 }} whileTap={{ scale: 0.9 }}>
                                                            <FormControlLabel sx={{ ml: 1 }} control={<Checkbox />} label={category.name} value={category._id} />
                                                        </motion.div>
                                    ))}
                                            </FormGroup>
                                        </AccordionDetails>
                                    </Accordion>
                                </Stack>

                            </Stack>
                        </motion.div>

            {/* ── Main content ─────────────────────────────────────────────── */}
            {
                productFetchStatus === 'pending' ?
                    <Stack width={is500 ? "35vh" : '25rem'} height={'calc(100vh - 4rem)'} justifyContent={'center'} marginRight={'auto'} marginLeft={'auto'}>
                        <Lottie animationData={loadingAnimation} />
                    </Stack>
                    :
                        <Stack mb={'3rem'}>
                        {/* Banners */}
                        {!is600 &&
                                <Stack sx={{ width: "100%", height: is800 ? "300px" : is1200 ? "400px" : "500px" }}>
                                    <ProductBanner images={bannerImages} />
                                </Stack>
                            }

                            <Stack rowGap={5} mt={is600 ? 2 : 0}>

                            {/* Search + Sort row */}
                                <Stack
                                    flexDirection={is600 ? 'column' : 'row'}
                                    mx={'2rem'}
                                    justifyContent={'space-between'}
                                    alignItems={is600 ? 'stretch' : 'center'}
                                    columnGap={3}
                                    rowGap={2}
                                >
                                    <TextField
                                        value={searchInput}
                                        onChange={handleSearchChange}
                                        placeholder="Search products..."
                                        variant="outlined"
                                        size="small"
                                        sx={{ flex: 1, maxWidth: is600 ? '100%' : '400px' }}
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <SearchIcon fontSize="small" />
                                                </InputAdornment>
                                            ),
                                            endAdornment: searchInput ? (
                                                <InputAdornment position="end">
                                                    <IconButton size="small" onClick={handleClearSearch}>
                                                        <ClearIcon fontSize="small" />
                                                    </IconButton>
                                                </InputAdornment>
                                            ) : null
                                        }}
                                    />

                                    <Stack width={'12rem'} alignSelf={is600 ? 'flex-end' : 'center'}>
                                        <FormControl fullWidth>
                                            <InputLabel id="sort-dropdown">Sort</InputLabel>
                                            <Select
                                                variant='standard'
                                                labelId="sort-dropdown"
                                                label="Sort"
                                                onChange={(e) => setSort(e.target.value)}
                                                value={sort}
                                            >
                                                <MenuItem value={null}>Reset</MenuItem>
                                            {sortOptions.map((option) => (
                                                        <MenuItem key={option.name} value={option}>{option.name}</MenuItem>
                                            ))}
                                            </Select>
                                        </FormControl>
                                    </Stack>
                                </Stack>

                                {/* Product grid */}
                                <Grid gap={is700 ? 1 : 2} container justifyContent={'center'} alignContent={'center'}>
                                {products.map((product) => (
                                            <ProductCard
                                                key={product._id}
                                                id={product._id}
                                                title={product.title}
                                                thumbnail={product.thumbnail}
                                                brand={product.brand.name}
                                                price={product.price}
                                                handleAddRemoveFromWishlist={handleAddRemoveFromWishlist}
                                            />
                                ))}
                                </Grid>

                                {/* Pagination */}
                                <Stack alignSelf={is488 ? 'center' : 'flex-end'} mr={is488 ? 0 : 5} rowGap={2} p={is488 ? 1 : 0}>
                                    <Pagination
                                        size={is488 ? 'medium' : 'large'}
                                        page={page}
                                        onChange={(e, page) => setPage(page)}
                                        count={Math.ceil(totalResults / ITEMS_PER_PAGE)}
                                        variant="outlined"
                                        shape="rounded"
                                    />
                                    <Typography textAlign={'center'}>
                                    Showing {(page - 1) * ITEMS_PER_PAGE + 1} to {Math.min(page * ITEMS_PER_PAGE, totalResults)} of {totalResults} results
                                    </Typography>
                                </Stack>

                            </Stack>
                        </Stack>
            }
        </>
    )
}
