import express from 'express';
const router = express.Router();

import auth from '../middleware/auth.js';
import { validateRating } from '../middleware/validators.js';
import { changeRating, createRating, deleteARating, getRatingForARequest, getRatings, givenRatingsByAUser } from '../controllers/ratingController.js';

// Create a rating
router.post('/', auth, validateRating, createRating);

// Get ratings for a user
router.get('/user/:userId', auth, getRatings);

// Get ratings given by a user
router.get('/given', auth, givenRatingsByAUser);

// Get rating for a specific request
router.get('/request/:requestId', auth, getRatingForARequest);

// Update a rating
router.put('/:id', auth, validateRating, changeRating);

// Delete a rating
router.delete('/:id', auth, deleteARating);

export default router;