import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Badge, Box, Drawer, IconButton, Stack, Typography, useMediaQuery, useTheme } from '@mui/material';
import { selectUserInfo } from '../../user/UserSlice';
import { selectCartItems } from '../../cart/CartSlice';
import { selectLoggedInUser } from '../../auth/AuthSlice';
import { selectWishlistItems } from '../../wishlist/WishlistSlice';
import { selectCategories } from '../../categories/CategoriesSlice';
import { selectProductIsFilterOpen, toggleFilters } from '../../products/ProductSlice';
import SearchIcon from '@mui/icons-material/Search';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import TuneIcon from '@mui/icons-material/Tune';

export const Navbar = ({ isProductList = false }) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userInfo = useSelector(selectUserInfo);
  const cartItems = useSelector(selectCartItems);
  const loggedInUser = useSelector(selectLoggedInUser);
  const wishlistItems = useSelector(selectWishlistItems);
  const categories = useSelector(selectCategories);
  const isProductFilterOpen = useSelector(selectProductIsFilterOpen);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down(900));

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'HOME', to: '/' },
    { label: 'SHOP', to: '/products' },
    ...(categories?.slice(0, 4).map(c => ({ label: c.name?.toUpperCase(), to: `/products?category=${c._id}` })) || []),
    { label: 'CONTACT', to: '/contact' },
  ];

  const userLinks = loggedInUser?.isAdmin ? [
    { label: 'Dashboard', to: '/admin/dashboard' },
    { label: 'Add Product', to: '/admin/add-product' },
    { label: 'Bulk Upload', to: '/admin/bulk-upload' },
    { label: 'Orders', to: '/admin/orders' },
    { label: 'Analytics', to: '/admin/analytics' },
    { label: 'Coupons', to: '/admin/coupons' },
    { label: 'Logout', to: '/logout' },
  ] : [
    { label: 'My Account', to: '/profile' },
    { label: 'My Orders', to: '/orders' },
    { label: 'Wishlist', to: '/wishlist' },
    { label: 'Compare', to: '/compare' },
    { label: 'Logout', to: '/logout' },
  ];

  return (
    <>
      <Box
        component="header"
        sx={{
          position: 'sticky', top: 0, zIndex: 1000,
          bgcolor: 'white',
          borderBottom: '1px solid #eee',
          boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,0.06)' : 'none',
          transition: 'box-shadow 0.3s',
        }}
      >
        {/* Top bar */}
        <Box sx={{ bgcolor: '#1a1a1a', py: 0.6, textAlign: 'center' }}>
          <Typography sx={{ fontSize: '11px', letterSpacing: '2px', color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>
            Free shipping on orders over $50 · New collection available now
          </Typography>
        </Box>

        {/* Main navbar */}
        <Box sx={{ px: { xs: 2, md: 5 }, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>

          {/* Mobile menu */}
          {isMobile && (
            <IconButton onClick={() => setMobileOpen(true)} size="small">
              <MenuIcon />
            </IconButton>
          )}

          {/* Logo */}
          <Typography
            component={Link} to="/"
            sx={{
              fontFamily: '"Playfair Display", "Georgia", serif',
              fontSize: isMobile ? '1.3rem' : '1.6rem',
              fontWeight: 400,
              letterSpacing: '6px',
              color: '#1a1a1a',
              textDecoration: 'none',
              textTransform: 'uppercase',
            }}
          >
            Rivavio
          </Typography>

          {/* Desktop nav links */}
          {!isMobile && (
            <Stack direction="row" spacing={4} alignItems="center">
              {navLinks.map((link) => (
                <Typography
                  key={link.label}
                  component={Link}
                  to={link.to}
                  sx={{
                    fontSize: '12px', fontWeight: 500,
                    letterSpacing: '2px', color: '#1a1a1a',
                    textDecoration: 'none', textTransform: 'uppercase',
                    position: 'relative',
                    '&::after': {
                      content: '""', position: 'absolute', bottom: -4, left: 0,
                      width: 0, height: '1px', bgcolor: '#1a1a1a',
                      transition: 'width 0.3s ease',
                    },
                    '&:hover::after': { width: '100%' },
                    '&:hover': { color: '#555' },
                  }}
                >
                  {link.label}
                </Typography>
              ))}
            </Stack>
          )}

          {/* Icons */}
          <Stack direction="row" spacing={isMobile ? 0.5 : 2} alignItems="center">
            <IconButton size="small" onClick={() => navigate('/products')} sx={{ color: '#1a1a1a' }}>
              <SearchIcon fontSize="small" />
            </IconButton>

            {/* User */}
            <Box sx={{ position: 'relative' }}>
              <IconButton
                size="small"
                sx={{ color: '#1a1a1a' }}
                onClick={() => loggedInUser ? setUserMenuOpen(!userMenuOpen) : navigate('/login')}
              >
                <PersonOutlineIcon fontSize="small" />
              </IconButton>
              {userMenuOpen && loggedInUser && (
                <Box
                  sx={{
                    position: 'absolute', top: '110%', right: 0,
                    bgcolor: 'white', border: '1px solid #eee',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.1)',
                    minWidth: 180, zIndex: 100, py: 1,
                  }}
                  onMouseLeave={() => setUserMenuOpen(false)}
                >
                  <Box sx={{ px: 2, py: 1, borderBottom: '1px solid #f0f0f0', mb: 0.5 }}>
                    <Typography sx={{ fontSize: '12px', color: '#888', letterSpacing: '1px' }}>
                      Hello, {userInfo?.name?.split(' ')[0]}
                    </Typography>
                  </Box>
                  {userLinks.map((link) => (
                    <Typography
                      key={link.label}
                      component={Link}
                      to={link.to}
                      onClick={() => setUserMenuOpen(false)}
                      sx={{
                        display: 'block', px: 2, py: 1,
                        fontSize: '13px', color: '#1a1a1a',
                        textDecoration: 'none', letterSpacing: '1px',
                        '&:hover': { bgcolor: '#f8f8f8', color: '#C9A96E' },
                      }}
                    >
                      {link.label}
                    </Typography>
                  ))}
                </Box>
              )}
            </Box>

            {/* Wishlist */}
            {!loggedInUser?.isAdmin && (
              <Badge
                badgeContent={wishlistItems?.length || 0}
                sx={{ '& .MuiBadge-badge': { bgcolor: '#1a1a1a', color: 'white', fontSize: '10px', minWidth: 16, height: 16 } }}
              >
                <IconButton size="small" component={Link} to="/wishlist" sx={{ color: '#1a1a1a' }}>
                  <FavoriteBorderIcon fontSize="small" />
                </IconButton>
              </Badge>
            )}

            {/* Cart */}
            <Badge
              badgeContent={cartItems?.length || 0}
              sx={{ '& .MuiBadge-badge': { bgcolor: '#1a1a1a', color: 'white', fontSize: '10px', minWidth: 16, height: 16 } }}
            >
              <IconButton size="small" onClick={() => navigate('/cart')} sx={{ color: '#1a1a1a' }}>
                <ShoppingBagOutlinedIcon fontSize="small" />
              </IconButton>
            </Badge>

            {isProductList && (
              <IconButton size="small" onClick={() => dispatch(toggleFilters())} sx={{ color: isProductFilterOpen ? '#C9A96E' : '#1a1a1a' }}>
                <TuneIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        </Box>
      </Box>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={mobileOpen} onClose={() => setMobileOpen(false)}>
        <Box sx={{ width: 280, p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography sx={{ fontSize: '1.2rem', letterSpacing: '4px', fontFamily: '"Playfair Display", serif' }}>
              RIVAVIO
            </Typography>
            <IconButton onClick={() => setMobileOpen(false)}><CloseIcon /></IconButton>
          </Box>
          <Stack spacing={2}>
            {navLinks.map((link) => (
              <Typography
                key={link.label}
                component={Link}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                sx={{ fontSize: '13px', letterSpacing: '2px', color: '#1a1a1a', textDecoration: 'none', textTransform: 'uppercase', borderBottom: '1px solid #f0f0f0', pb: 1.5 }}
              >
                {link.label}
              </Typography>
            ))}
            {loggedInUser && userLinks.map((link) => (
              <Typography
                key={link.label}
                component={Link}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                sx={{ fontSize: '13px', letterSpacing: '2px', color: '#888', textDecoration: 'none', textTransform: 'uppercase' }}
              >
                {link.label}
              </Typography>
            ))}
            {!loggedInUser && (
              <Typography component={Link} to="/login" onClick={() => setMobileOpen(false)} sx={{ fontSize: '13px', letterSpacing: '2px', color: '#C9A96E', textDecoration: 'none', textTransform: 'uppercase' }}>
                LOGIN / REGISTER
              </Typography>
            )}
          </Stack>
        </Box>
      </Drawer>
    </>
  );
};
