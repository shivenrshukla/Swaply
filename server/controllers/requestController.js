import User from '../models/User.js';
import Request from '../models/Request.js';

export const createRequest = async (req, res) => {
    try {
        const { recipientId, skillToOffer, skillToRequest, message, proposedDuration, proposedSchedule } = req.body;

        // Check if recipient exists and is not banned
        const recipient = await User.findById(recipientId);
        if (!recipient || recipient.isBanned) {
            return res.status(404).json({ 
                success: false,
                message: 'Recipient not found or banned' 
            });
        }

        // Check if user is trying to request from themselves
        if (recipientId === req.user._id.toString()) {
            return res.status(400).json({ 
                success: false,
                message: 'Cannot send request to yourself' 
            });
        }

        // Get requester
        const requester = await User.findById(req.user._id);

        // Create new request with skill names
        const newRequest = new Request({
            requester: requester._id,
            recipient: recipientId,
            skillOffered: {
                skillId: null, // We'll use skill names instead
                skillName: skillToOffer
            },
            skillRequested: {
                skillId: null, // We'll use skill names instead
                skillName: skillToRequest
            },
            message,
            proposedDuration,
            proposedSchedule
        });

        await newRequest.save();

        // Populate the request with user details
        await newRequest.populate([
            { path: 'requester', select: 'name profilePhoto' },
            { path: 'recipient', select: 'name profilePhoto' }
        ]);

        return res.status(201).json({ 
            success: true,
            message: 'Request sent successfully', 
            request: newRequest 
        });
  } catch (error) {
    console.error('Create request error:', error);
    return res.status(500).json({
        success: false, 
        message: 'Internal server error' 
    });
  }
}

export const getUsersSentRequest = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        let query = { requester: req.user._id };
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;
        const totalRequests = await Request.countDocuments(query);
        const totalPages = Math.ceil(totalRequests / limit);

        const requests = await Request.find(query)
            .populate('recipient', 'name profilePhoto')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({
            success: true,
            requests,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalRequests,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get sent requests error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
}

export const getUsersReceivedRequest = async (req, res) => {
    try {
        const { page = 1, limit = 10, status } = req.query;

        let query = { recipient: req.user._id };
        if (status) {
            query.status = status;
        }

        const skip = (page - 1) * limit;
        const totalRequests = await Request.countDocuments(query);
        const totalPages = Math.ceil(totalRequests / limit);

        const requests = await Request.find(query)
            .populate('requester', 'name profilePhoto averageRating')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit));

        return res.status(200).json({
            success: true,
            requests,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalRequests,
                hasNext: page < totalPages,
                hasPrev: page > 1
            }
        });
    } catch (error) {
        console.error('Get received requests error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
}

// get a specific request
export const getSpecificRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id)
            .populate('requester', 'name profilePhoto averageRating')
            .populate('recipient', 'name profilePhoto averageRating');

        if (!request) {
            return res.status(404).json({ 
                success: false,
                message: 'Request not found' 
            });
        }

        // Check if user is involved in this request
        if (request.requester._id.toString() !== req.user._id.toString() && 
            request.recipient._id.toString() !== req.user._id.toString()) {
                return res.status(403).json({ 
                    success: false,
                    message: 'Not authorized to view this request' 
                });
            }

        return res.status(200).json({
            success: true,
            request
        });
    } catch (error) {
        console.error('Get request error:', error);
        return res.status(500).json({
            success: false, 
            message: 'Internal server error' 
        });
    }
}

// Accept a request
export const acceptRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ 
                success: false,
                message: 'Request not found' 
            });
        }

        // Check if user is the recipient
        if (request.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized to accept this request' 
            });
        }

        // Check if request is still pending
        if (request.status !== 'pending') {
            return res.status(400).json({ 
                success: false,
                message: 'Request is no longer pending' 
            });
        }

        request.status = 'accepted';
        await request.save();

        await request.populate([
            { path: 'requester', select: 'name profilePhoto' },
            { path: 'recipient', select: 'name profilePhoto' }
        ]);

        return res.status(200).json({ 
            success: true,
            message: 'Request accepted successfully',
            request 
        });
    } catch (error) {
        console.error('Accept request error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
}

// Reject a request
export const rejectRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ 
                success: false,
                message: 'Request not found' 
            });
        }

        // Check if user is the recipient
        if (request.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized to reject this request' 
            });
        }

        // Check if request is still pending
        if (request.status !== 'pending') {
            return res.status(400).json({ 
                success: false,
                message: 'Request is no longer pending' 
            });
        }

        request.status = 'rejected';
        await request.save();

        return res.status(200).json({ 
            success: true,
            message: 'Request rejected successfully' 
        });
  } catch (error) {
    console.error('Reject request error:', error);
    return res.status(500).json({ 
        success: false,
        message: 'Internal server error' 
    });
  }
}

// Cancel request (by requester)
export const cancelRequest = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ 
                success: false,
                message: 'Request not found' 
            });
        }

        // Check if user is the requester
        if (request.requester.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized to cancel this request' 
            });
        }

        // Check if request can be cancelled
        if (request.status !== 'pending') {
            return res.status(400).json({ 
                success: false,
                message: 'Only pending requests can be cancelled' 
            });
        }

        request.status = 'cancelled';
        await request.save();

        return res.status(200).json({ 
            success: true,
            message: 'Request cancelled successfully' 
        });
    } catch (error) {
        console.error('Cancel request error:', error);
        return res.status(500).json({ 
            success: false,
            message: 'Internal server error' 
        });
    }
}

// Delete request (by requester, only if not yet approved)
export const deleteRequest = async (req, res) => {
    try {
        const request = await Request.findOneAndDelete({
            _id: req.params.id,
            requester: req.user._id,
            status: 'pending'
        });

        if (!request) {
            return res.status(404).json({ 
                success: false,
                message: 'Request not found or already approved' 
            });
        }

        return res.status(200).json({ 
            success: true,
            message: 'Request deleted successfully' 
        });
  } catch (error) {
    console.error('Delete request error:', error);
    res.status(500).json({ 
        success: false,
        message: 'Internal server error' 
    });
  }
}

// Mark request as completed
export const markAsCompleted = async (req, res) => {
    try {
        const request = await Request.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ 
                success: false,
                message: 'Request not found' 
            });
        }

        // Check if user is involved in this request
        if (request.requester.toString() !== req.user._id.toString() && 
            request.recipient.toString() !== req.user._id.toString()) {
            return res.status(403).json({ 
                success: false,
                message: 'Not authorized to complete this request' 
            });
        }

        // Check if request is accepted
        if (request.status !== 'accepted') {
            return res.status(400).json({ 
                success: false,
                message: 'Only accepted requests can be completed' 
            });
        }

        request.status = 'completed';
        request.completedAt = new Date();
        await request.save();

        return res.status(200).json({ 
            success: true,
            message: 'Request marked as completed', 
            request 
        });
  } catch (error) {
    console.error('Complete request error:', error);
    res.status(500).json({ 
        success: false,
        message: 'Internal server error' 
    });
  }
}