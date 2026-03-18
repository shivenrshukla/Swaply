import Request from '../models/Request.js';
import Match from '../models/Match.js';

// Create a new match
export const createMatch = async (req, res) => {
    const { requestId, duration, schedule, startDate } = req.body;

    if (!requestId || !duration || !schedule || !startDate) {
        return res.status(400).json({ message: 'All fields are required.' });
    }

    try {
        const originalRequest = await Request.findById(requestId)
            .populate('requester', 'name')
            .populate('recipient', 'name');

        if (!originalRequest) {
            return res.status(404).json({ message: 'Request not found.' });
        }

        const currentUserId  = req.user.id;
        const isParticipant = [originalRequest.requester._id.toString(), originalRequest.recipient._id.toString()].includes(currentUserId);

        if (!isParticipant) {
            return res.status(403).json({ message: 'You are not authorized to create a match for this request.' });
        }

        const endDate = new Date(startDate);
        const durationInMonths = parseInt(duration.split(' ')[0], 10);
        if (isNaN(durationInMonths)) {
            return res.status(400).json({ message: 'Invalid duration format.' });
        }
        endDate.setMonth(endDate.getMonth() + durationInMonths);

        const newMatch = new Match({
            originalRequest: requestId,
            duration,
            schedule,
            startDate: new Date(startDate),
            endDate,
            participants: [
                {
                    user: originalRequest.requester._id,
                    skillOffered: {
                        skillId: originalRequest.skillOffered.skillId || null,
                        skillName: originalRequest.skillOffered.skillName
                    },
                    skillRequested: {
                        skillId: originalRequest.skillRequested.skillId || null,
                        skillName: originalRequest.skillRequested.skillName
                    },
                },
                {
                    user: originalRequest.recipient._id,
                    skillOffered: {
                        skillId: originalRequest.skillRequested.skillId || null,
                        skillName: originalRequest.skillRequested.skillName
                    },
                    skillRequested: {
                        skillId: originalRequest.skillOffered.skillId || null,
                        skillName: originalRequest.skillOffered.skillName
                    },
                }
            ],
        });

        await newMatch.save();
        await Request.findByIdAndDelete(requestId);

        return res.status(201).json({ message: 'Match created successfully.', match: newMatch });
    } catch (error) {
        console.error('Error creating match:', error);
        return res.status(500).json({ message: 'Server error.', error: error.message });
    }
};

// Get matches for a user with optional status filter
export const getUserMatches = async (req, res) => {
    try {
        const status = req.query.status || 'all';
        const userId = req.user._id;

        const matches = await Match.getMatchesForUser(userId, status);

        return res.status(200).json({
            success: true,
            matches,
            count: matches.length
        });
    } catch (error) {
        console.error('Error fetching matches:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch matches',
            error: error.message
        });
    }
}

// Get count of active matches for user
export const activeCount = async (req, res) => {
    try { 
        const count = await Match.getActiveMatchesCount(req.user._id);

        return res.status(200).json({
            success: true,
            count
        });
    } catch (error) {
        console.error('Error fetching active matches count:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch active matches count',
            error: error.message
        });
    }
}

export const getMatchById = async (req, res) => {
    try { 
        const match = await Match.findById(req.params.id)
            .populate('participants.user', 'name email avatar')
            .populate('originalRequest');

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }

        const isParticipant = match.participants.some(p => 
            p.user._id.toString() === req.user.id
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You are not a participant in this match.'
            });
        }

        return res.status(200).json({
            success: true,
            match
        });
    } catch (error) {
        console.error('Error fetching match:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch match',
            error: error.message
        });
    }
}

// Mark match as completed
export const markMatchAsCompleted = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }
    
        // Check if user is participant in this match
        const isParticipant = match.participants.some(p => 
            p.user.toString() === req.user.id
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You are not a participant in this match.'
            });
        }

        if (match.status !== 'active') {
            return res.status(400).json({
                success: false,
                message: 'Only active matches can be marked as completed'
            });
        }

        await match.markCompleted();

        return res.status(201).json({
            success: true,
            message: 'Match marked as completed successfully',
            match
        });
    } catch (error) {
        console.error('Error marking match as completed:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to mark match as completed',
            error: error.message
        });
    }
}

// Cancel a match
export const cancelMatch = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }

        const isParticipant = match.participants.some(p =>
            p.user.toString() === req.user.id
        );


        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You are not a participant in this match.'
            });
        }

        if (!match.canBeCancelled()) {
            return res.status(400).json({
                success: false,
                message: 'This match cannot be cancelled'
            });
        }

        match.status = 'cancelled';
        await match.save();

        return res.status(200).json({
            success: true,
            message: 'Match cancelled successfully',
            match
        });
    } catch (error) {
        console.error('Error cancelling match:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to cancel match',
            error: error.message
        });
    }
}

export const addSessionToMatch = async (req, res) => {
    try {
        const { date, topic, duration, notes } = req.body;
        
        if (!date || !topic) {
            return res.status(400).json({
                success: false,
                message: 'Date and topic are required'
            });
        }

        const match = await Match.findById(req.params.id);

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }
         
        // Check if user is participant in this match
        const isParticipant = match.participants.some(p => 
            p.user.toString() === req.user.id
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You are not a participant in this match.'
            });
        }

        const sessionData = {
            date: new Date(date),
            topic,
            duration: duration || 60,
            notes: notes || '',
            completed: false
        }

        await match.addSession(sessionData);

        return res.status(201).json({
            success: true,
            message: 'Session added successfully',
            match
        });
    } catch (error) {
        console.error('Error adding session:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add session',
            error: error.message
        });
    }
};

// Mark session as completed
export const markSessionAsCompleted = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id);

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            });
        }

        // Check if user is participant in this match
        const isParticipant = match.participants.some(p => 
            p.user.toString() === req.user.id
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You are not a participant in this match.'
            });
        }

        await match.completeSession(req.params.sessionId);

        return res.status(200).json({
            success: true,
            message: 'Session marked as completed successfully',
            match
        });
    } catch (error) {
        console.error('Error markking session as completed:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to mark session as completed',
            error: error.message
        });
    }
}

// Add rating and feedback to a match
export const addRatingAndFeedBack = async (req, res) => {
    try {
        const {rating, feedback} = req.body;

        if (!rating || rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        const match = await Match.findById(req.params.id);

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found',
            });
        }

        // Check if user is participant in this match
        const isParticipant = match.participants.some(p =>
            p.user.toString() === req.user.id
        )

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You are not a participant in this match.',
            });
        }

        const userParticipant = match.getCurrentUserParticipant(req.user.id);

        userParticipant.rating = rating;
        userParticipant.feedback = feedback || '';

        await match.save();

        return res.status(200).json({
            success: true,
            message: 'Rating and feedback added successfully',
            match
        });
    } catch (error) {
        console.error('Error adding rating:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to add rating',
            error: error.message
        });
    }
}

// Get other participants details
export const getOtherParticipant = async (req, res) => {
    try {
        const match = await Match.findById(req.params.id)
            .populate('participants.user', 'name email avatar');

        if (!match) {
            return res.status(404).json({
                success: false,
                message: 'Match not found'
            })
        }

        // Check if user is participant in this match
        const isParticipant = match.participants.some(p => 
            p.user._id.toString() === req.user.id
        );
    
        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: 'Access denied. You are not a participant in this match.'
            });
        }

        const otherParticipant = match.getOtherParticipant(req.user.id);

        return res.status(200).json({
            success: true,
            participant: otherParticipant
        });
    } catch (error) {
        console.error('Error fetching details of other participant');
        return res.status(500).json({
            success: false,
            message: 'Failed to fetch other participant',
            error: error.message
        });
    }
} 