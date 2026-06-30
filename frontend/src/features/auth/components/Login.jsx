import { Box, Divider, FormHelperText, IconButton, InputAdornment, Stack, TextField, Typography } from '@mui/material'
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from "react-hook-form"
import { useDispatch, useSelector } from 'react-redux'
import { LoadingButton } from '@mui/lab';
import { selectLoggedInUser, loginAsync, selectLoginStatus, selectLoginError, clearLoginError, resetLoginStatus } from '../AuthSlice'
import { toast } from 'react-toastify'
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import VisibilityOffOutlinedIcon from '@mui/icons-material/VisibilityOffOutlined';

const inputStyle = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 0,
    bgcolor: '#fafafa',
    '& fieldset': { borderColor: '#e0e0e0' },
    '&:hover fieldset': { borderColor: '#1a1a1a' },
    '&.Mui-focused fieldset': { borderColor: '#1a1a1a', borderWidth: '1px' },
  },
  '& .MuiInputBase-input': { fontSize: '14px', py: 1.5 },
}

export const Login = () => {
  const dispatch = useDispatch()
  const status = useSelector(selectLoginStatus)
  const error = useSelector(selectLoginError)
  const loggedInUser = useSelector(selectLoggedInUser)
  const { register, handleSubmit, reset, formState: { errors } } = useForm()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (loggedInUser && loggedInUser?.isVerified) navigate("/")
    else if (loggedInUser && !loggedInUser?.isVerified) navigate("/verify-otp")
  }, [loggedInUser])

  useEffect(() => {
    if (error) toast.error(error.message)
  }, [error])

  useEffect(() => {
    if (status === 'fullfilled' && loggedInUser?.isVerified === true) {
      toast.success('Welcome back!')
      reset()
    }
    return () => {
      dispatch(clearLoginError())
      dispatch(resetLoginStatus())
    }
  }, [status])

  const handleLogin = (data) => {
    const cred = { ...data }
    delete cred.confirmPassword
    dispatch(loginAsync(cred))
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f2ee', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <Box sx={{
        bgcolor: '#f5f2ee',
        backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(201,169,110,0.08) 0%, transparent 60%)',
        py: 3, px: 4,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <Typography
          component={Link} to="/"
          sx={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontSize: '1.8rem', fontWeight: 400,
            letterSpacing: '8px', color: '#1a1a1a',
            textDecoration: 'none', textTransform: 'uppercase',
          }}
        >
          Rivavio
        </Typography>
      </Box>

      {/* Main */}
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', py: 6, px: 2 }}>
        <Box sx={{ width: '100%', maxWidth: 460 }}>

          {/* Page title — Luchiana style */}
          <Box sx={{
            bgcolor: 'rgba(201,169,110,0.08)',
            backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(201,169,110,0.04) 20px, rgba(201,169,110,0.04) 40px)',
            py: 4, textAlign: 'center', mb: 4,
          }}>
            <Typography sx={{ fontSize: '0.65rem', letterSpacing: '4px', color: '#C9A96E', textTransform: 'uppercase', mb: 1 }}>
              welcome back
            </Typography>
            <Typography sx={{ fontFamily: '"Playfair Display", Georgia, serif', fontSize: '2rem', fontWeight: 400, letterSpacing: '4px', color: '#1a1a1a', textTransform: 'uppercase' }}>
              My Account
            </Typography>
          </Box>

          {/* Form */}
          <Box sx={{ bgcolor: 'white', p: { xs: 3, sm: 4 }, boxShadow: '0 2px 20px rgba(0,0,0,0.06)' }}>
            <Stack
              spacing={2.5}
              component="form"
              noValidate
              onSubmit={handleSubmit(handleLogin)}
            >
              <Stack spacing={0.8}>
                <Typography sx={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#555' }}>
                  Email Address *
                </Typography>
                <TextField
                  fullWidth size="small"
                  sx={inputStyle}
                  placeholder="your@email.com"
                  {...register("email", {
                    required: "Email is required",
                    pattern: { value: /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g, message: "Enter a valid email" }
                  })}
                />
                {errors.email && <FormHelperText error sx={{ mt: 0 }}>{errors.email.message}</FormHelperText>}
              </Stack>

              <Stack spacing={0.8}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography sx={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#555' }}>
                    Password *
                  </Typography>
                  <Typography
                    component={Link} to="/forgot-password"
                    sx={{ fontSize: '11px', color: '#C9A96E', textDecoration: 'none', letterSpacing: '1px', '&:hover': { textDecoration: 'underline' } }}
                  >
                    Lost your password?
                  </Typography>
                </Stack>
                <TextField
                  fullWidth size="small"
                  type={showPassword ? 'text' : 'password'}
                  sx={inputStyle}
                  placeholder="••••••••"
                  {...register("password", { required: "Password is required" })}
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => setShowPassword(!showPassword)} edge="end">
                          {showPassword ? <VisibilityOffOutlinedIcon fontSize="small" /> : <VisibilityOutlinedIcon fontSize="small" />}
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
                {errors.password && <FormHelperText error sx={{ mt: 0 }}>{errors.password.message}</FormHelperText>}
              </Stack>

              <LoadingButton
                fullWidth
                type="submit"
                loading={status === 'pending'}
                sx={{
                  mt: 1,
                  py: 1.5,
                  bgcolor: '#1a1a1a', color: 'white',
                  borderRadius: 0,
                  fontSize: '11px', letterSpacing: '3px',
                  textTransform: 'uppercase', fontWeight: 500,
                  '&:hover': { bgcolor: '#333' },
                  '&.MuiLoadingButton-loading': { bgcolor: '#555' },
                }}
                variant="contained"
              >
                Log In
              </LoadingButton>

              {/* Google login */}
              <Box
                component="a"
                href={`${process.env.REACT_APP_BASE_URL}auth/google`}
                sx={{
                  border: '1px solid #e0e0e0', py: 1.5, display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: 1.5,
                  cursor: 'pointer', transition: 'all 0.2s', textDecoration: 'none',
                  '&:hover': { bgcolor: '#f8f8f8', borderColor: '#ccc' },
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <Typography sx={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#555' }}>
                  Continue with Google
                </Typography>
              </Box>

              <Divider sx={{ my: 0.5 }} />

              <Box sx={{ textAlign: 'center' }}>
                <Typography sx={{ fontSize: '12px', color: '#888', letterSpacing: '1px' }}>
                  Don't have an account?{' '}
                  <Typography
                    component={Link} to="/signup"
                    sx={{ color: '#C9A96E', textDecoration: 'none', fontWeight: 500, '&:hover': { textDecoration: 'underline' } }}
                  >
                    Register →
                  </Typography>
                </Typography>
              </Box>
            </Stack>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Box sx={{ py: 3, textAlign: 'center', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
        <Stack direction="row" justifyContent="center" spacing={3} mb={1}>
          {['Conditions of Use', 'Privacy Notice', 'Help'].map(item => (
            <Typography key={item} sx={{ fontSize: '11px', color: '#aaa', cursor: 'pointer', letterSpacing: '1px', '&:hover': { color: '#555' } }}>
              {item}
            </Typography>
          ))}
        </Stack>
        <Typography sx={{ fontSize: '11px', color: '#ccc', letterSpacing: '1px' }}>
          © {new Date().getFullYear()} Rivavio · Designed by Neeraj Verma
        </Typography>
      </Box>
    </Box>
  )
}
