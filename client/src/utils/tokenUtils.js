// src/utils/tokenUtils.js

// Save JWT token to localStorage
export const saveToken = (token) => {
  localStorage.setItem('token', token)
}

// Get JWT token from localStorage
export const getToken = () => {
  return localStorage.getItem('token')
}

// Remove JWT token from localStorage
export const removeToken = () => {
  localStorage.removeItem('token')
}
