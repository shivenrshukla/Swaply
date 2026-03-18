import Request from '../models/Request.js'; 
import Rating from '../models/Rating.js';
import User from '../models/User.js';

// Create a rating
export const createRating = async (req, res) => {
    try {
        const { requestId, rating, feedback } = req.body;

        // Check if request exists and is completed
        const request = await Request.findById(requestId);
        if (!request) {
          return res.status(404).json({ message: 'Request not found' });
        }
        
        if (request.status !== 'completed') {
            return res.status(400).json({ 
                success: false,
                message: 'Can only rate completed requests' 
            });
        }

        // Check if user is involved in this request
        if (request.requester.toString() !== req.user._id.toString() && 
            request.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized to rate this request' 
            });
        }

        // Determine who is being rated
        const ratedUserId = request.requester.toString() === req.user._id.toString()
            ? request.recipient
            : request.requester;

        // Check if user has already rated this request
        const existingRating = await Rating.findOne({
            rater: req.user._id,
            request: requestId
        });

        if (existingRating) {
            return res.status(400).json({ 
                success: false,
                message: 'You have already rated this request' 
            });
        }

        // Create new rating
        const newRating = new Rating({
            rater: req.user._id,
            ratedUser: ratedUserId,
            request: requestId,
            rating,
            feedback
        });

        await newRating.save();

        // Update user's average rating
        const ratedUser = await User.findById(ratedUserId);
        await ratedUser.updateAverageRating();

        await newRating.populate([
            { path: 'rater', select: 'name profilePhoto' },
            { path: 'ratedUser', select: 'name profilePhoto' }
        ]);
        res.status(201).json({ 
            success: true,
            message: 'Rating submitted successfully', 
            rating: newRating 
        });

    } catch (error) {
        console.error('Error creating rating');
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Get ratings for a user
export const getRatings = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        // Check if user exists
       const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        const skip = (page - 1) * limit;
        const totalRatings = await Rating.countDocuments({ ratedUser: req.params.userId });
        const totalPages = Math.ceil(totalRatings / limit);

        const ratings = await Rating.find({ ratedUser: req.params.userId })
            .populate('rater', 'name profilePhoto')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({
            success: true,
            ratings,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalRatings,
                hasNext: page < totalPages,
                hasPrev: page > 1
            },
            userStats: {
                averageRating: user.averageRating,
                totalRatings: user.totalRatings
            }
        });
    } catch (error) {
        console.error('Error fetching ratings');
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Get ratings given by a user
export const givenRatingsByAUser = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const skip = (page - 1) * limit;
        const totalRatings = await Rating.countDocuments({ rater: req.user._id });
        const totalPages = Math.ceil(totalRatings / limit);

        const ratings = await Rating.find({ rater: req.user._id })
            .populate('ratedUser', 'name profilePhoto')
            .populate('request', 'skillOffered.skillName skillRequested.skillName')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({
            success: true,
            ratings,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalRatings,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Error fetching ratings given by a user');
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Delete a rating
export const deleteARating = async (req, res) => {
  try {
    const rating = await Rating.findById(req.params.id);
    if (!rating) {
      return res.status(404).json({ 
        success: false,
        message: 'Rating not found' });
    }

    // Check if user is the rater
    if (rating.rater.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to delete this rating' });
    }

    // Check if rating is less than 24 hours old
    const twentyFourHours = 24 * 60 * 60 * 1000;
    if (Date.now() - rating.createdAt > twentyFourHours) {
        return res.status(400).json({ 
            success: false,
            message: 'Can only delete ratings within 24 hours' 
        });
    }

    const ratedUserId = rating.ratedUser;
    await Rating.findByIdAndDelete(req.params.id);

    // Update user's average rating
    const ratedUser = await User.findById(ratedUserId);
    await ratedUser.updateAverageRating();

    return res.status(200).json({ 
        success: true,
        message: 'Rating deleted successfully' 
    });
  } catch (error) {
    console.error('Delete rating error:', error);
    res.status(500).json({
        success: false, 
        message: 'Internal server error' 
    });
  }
}

// Get rating for a specific request
export const getRatingForARequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.requestId);
        if (!request) {
            return res.status(404).json({ 
                success: false,
                message: 'Request not found' 
            });
        }

        // Check if the user is involved in this request
        if (request.requester.toString() !== req.user._id.toString() &&
            request.recipient.toString() !== req.user._id.toString()) {
                return res.status(403).json({
                    success: false,
                    message: 'You are not authorized to view ratings for this request'
                });
            }

        const ratings = await Rating.find({ request: req.params.requestId })
            .populate('rater', 'name profilePhoto')
            .populate('ratedUser', 'name profilePhoto');

        return res.status(200).json({ 
            success: true,
            ratings
        });
    } catch (error) {
        console.error('Get request ratings error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
}

// Change Rating
export const changeRating = async (req, res) => {
    try {
        const { rating, feedback } = req.body;

        const existingRating = await Rating.findById(req.params.id);
        if (!existingRating) {
            return res.status(404).json({ message: 'Rating not found' });
        }

        // Check if user is the rater
        if (existingRating.rater.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized to update this rating' });
        }

        // Check if rating is less than 24 hours old
        const twentyFourHours = 24 * 60 * 60 * 1000;
        if (Date.now() - existingRating.createdAt > twentyFourHours) {
            return res.status(400).json({ 
                success: false,
                message: 'Can only update ratings within 24 hours' 
            });
        }

        existingRating.rating = rating;
        existingRating.feedback = feedback;
        await existingRating.save();

        // Update user's average rating
        const ratedUser = await User.findById(existingRating.ratedUser);
        await ratedUser.updateAverageRating();

        await existingRating.populate([
            { path: 'rater', select: 'name profilePhoto' },
            { path: 'ratedUser', select: 'name profilePhoto' }
        ]);

        return res.status(200).json({
            success: true,
            message: 'Rating updated successfully',
            rating: existingRating 
        });
    } catch (error) {
        console.error('Error updating ratings');
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}