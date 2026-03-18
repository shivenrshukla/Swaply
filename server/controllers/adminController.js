import User from '../models/User.js';
import Request from '../models/Request.js';
import Rating from '../models/Rating.js';
import Message from '../models/Message.js';

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get users with pagination
        const users = await User.find({})
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({createdAt: -1});

        // Get total count for pagination
        const totalUsers = await User.countDocuments();
        const totalPages = Math.ceil(totalUsers / limit);

        return res.status(200).json({
            users: users,
            totalPages: totalPages,
            currentPage: page,
            total: totalUsers
        });
    } catch (error) {
        console.error('Error fetching users', error.message);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

export const banUser = async (req, res) => {
    try {
        const {banned, banReason} = req.body;
        const user = await User.findById(req.params.id);
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.isBanned = banned;
        user.banReason = banned ? banReason : null;
        await user.save();

        res.status(200).json({
            success: true,
            message: `User ${banned ? 'banned' : 'unbanned'} successfully`
        });
    } catch (error) {
        console.error(`Error ${banned ? 'banning' : 'unbanning'} user`);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Make a user admin
export const makeAdmin = async(req, res) => {
    try {
        const {isAdmin} = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.isAdmin = isAdmin;
        await user.save();

        return res.status(200).json({
            success: true,
            message: `${isAdmin ? 'User made admin' : 'Admin status revoked'} successfully`
        });
    } catch (error) {
        console.error(`Error ${isAdmin ? 'Making user admin' : 'Revoking admin status'}`);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Delete a user
export const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user');
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Get all skill requests for moderation
export const getAllSkillRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const users = await User.aggregate([
            {
                $project: {
                    name: 1,
                    email: 1,
                    skillsOffered: {
                        $filter: {
                            input: { $ifNull: ['$skillsOffered', []] },
                            as: 'skill',
                            cond: { $eq: ['$$skill.approved', false] }
                        }
                    },
                    skillsWanted: {
                        $filter: {
                            input: { $ifNull: ['$skillsWanted', []] },
                            as: 'skill',
                            cond: { $eq: ['$$skill.approved', false] }
                        }
                    }
                }
            },
            {
                $match: {
                    $or: [
                        { 'skillsOffered.0': { $exists: true} },
                        { 'skillsWanted.0': { $exists: true} },
                    ]
                }
            }, 
            { $sort: {updatedAt: -1} },
            { $skip: skip },
            { $limit: limit }
        ]);

        const countResult = await User.aggregate([
            {
                $project: {
                    skillsOffered: {
                        $filter: {
                            input: { $ifNull: ['$skillsOffered', []] },
                            as: 'skill',
                            cond: { $eq: ['$$skill.approved', false] }
                        }
                    },
                    skillsWanted: {
                        $filter: {
                            input: { $ifNull: ['$skillsWanted', []] },
                            as: 'skill',
                            cond: { $eq: ['$$skill.approved', false] }
                        }
                    }
                }
            }, 
            {
                $match: {
                    $or: [
                        { 'skillsOffered.0': { $exists: true } },
                        { 'skillsWanted.0': { $exists: true } },
                    ]
                }
            },
            { $count: 'total' }
        ]);

        const total = countResult[0] ? countResult[0].total : 0;

        return res.status(200).json({
            users,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Skill requests error: ', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Approve / Reject skills
export const approveOrReject = async (req, res) => {
    const { skillId, skillType, approved, rejectionReason } = req.body;
    try {
        const user = await User.findById(req.params.userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const skillArray = skillType === 'offered' ? user.skillsOffered: user.skillsWanted;
        const skill = skillArray.id(skillId);
        if (!skill) {
            return res.status(404).json({
                success: false,
                message: 'Skill not found'
            });
        }

        if (approved) {
            skill.approved = true;
            skill.rejectionReason = null;
        } else {
            skill.approved = false;
            skill.rejectionReason = rejectionReason;
        }

        await user.save();

        return res.status(200).json({
            success: true,
            message: `Skill ${approved ? 'approved' : 'rejected'}`
        });
    } catch (error) {
        console.error(`Skill ${approved ? 'approval' : 'rejection'} error`);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Get info about Requests that are still pending
export const getRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const status = req.query.status;

        let filter = {};
        if (status) {
            filter.status = status;
        }

        const requests = await Request.find(filter)
            .populate('requester', 'name email')
            .populate('recipient', 'name email')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 })

        const total = await Request.countDocuments(filter);

        return res.status(200).json({
            success: true,
            requests,
            totalPage: Math.ceil(total / limit),
            currentPage: page,
            total
        });
    } catch (error) {
        console.error('Error getting requests');
        return res.status(500).json({
            success: false,
            message: 'Internal sserver error'
        });
    }
}

// Broadcast a message
export const createAndSendBroadcast = async (req, res) => {
    try {
        const {title, content} = req.body;
        if (!title || !content) {
            return res.status(400).json({
                success: false,
                message: 'Title and content are required'
            });
        }

        const sendCount = await Message.sendBroadcast({
            senderId: req.user.id,
            title,
            content
        });

        return res.status(201).json({
            success: true,
            message: `Broadcast created and sent to ${sendCount} users successfully`
        });
    } catch (error) {
        console.error('Error sending broadcast message');
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

export const statistics = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const activeUsers = await User.countDocuments({ isBanned: false });
        const bannedUsers = await User.countDocuments({ isBanned: true });
        const adminUsers = await User.countDocuments({ isAdmin: true });

        const totalRequests = await Request.countDocuments();
        const pendingRequests = await Request.countDocuments({ status: 'pending' });
        const acceptedRequests = await Request.countDocuments({ status: 'accepted' });
        const cancelledRequests = await Request.countDocuments({ status: 'cancelled' });
        const completedRequests = await Request.countDocuments({ status: 'completed' });

        const totalRatings = await Rating.countDocuments();
        const averageRating = await Rating.aggregate([
            { $group: { _id: null, avgRating: { $avg: '$rating' } } }
        ]);

        const pendingSkills = await User.countDocuments({
            $or: [
                { 'skillsOffered.approved': false },
                { 'skillsWanted.approved': false }
            ]
        });

        return res.status(200).json({
            success:true,
            users: {
                total: totalUsers,
                active: activeUsers,
                banned: bannedUsers,
                admins: adminUsers
            },
            requests: {
                total: totalRequests,
                pending: pendingRequests,
                accepted: acceptedRequests,
                completed: completedRequests,
                cancelled: cancelledRequests
            },
            ratings: {
                total: totalRatings,
                average: averageRating[0]?.avgRating || 0
            },
            pendingSkills
        });
    } catch (error) {
        console.error('Error fetching statistics');
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

export const userActivityReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let filter = {};

        if (startDate && endDate) {
            filter.createdAt = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        }

        const users = await User.find(filter)
            .select('name email location skillsOffered skillsWanted averageRating isPublic isBanned createdAt')
            .sort({ createdAt: -1 })

        const report = users.map(user => ({
            name: user.name,
            email: user.email,
            location: user.location,
            skillsOfferedCount: user.skillsOffered.length,
            skillsWantedCount: user.skillsWanted.length,
            averageRating: user.averageRating,
            isPublic: user.isPublic,
            banned: user.banned,
            joinedDate: user.createdAt
        }));

        return res.status(200).json({
            success: true,
            report
        });
    } catch (error) {
        console.error('Error creating user activity report');
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
}

// Download feedback report
export const feedbackReport = async (req, res) => {
    try {
    const { startDate, endDate } = req.query;
    let filter = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const ratings = await Rating.find(filter)
      .populate('rater', 'name email')
      .populate('ratedUser', 'name email')
      .populate('request', 'skillOffered skillWanted')
      .sort({ createdAt: -1 });

    const report = ratings.map(rating => ({
      raterName: rating.rater.name,
      raterEmail: rating.rater.email,
      rateeName: rating.ratee.name,
      rateeEmail: rating.ratee.email,
      rating: rating.rating,
      feedback: rating.feedback,
      skillOffered: rating.request.skillOffered,
      skillWanted: rating.request.skillWanted,
      date: rating.createdAt
    }));

    return res.status(200).json({
        success: true,
        report
    });
  } catch (error) {
    console.error('Error creating feedback report');
    return res.status(500).json({
        message: 'Internal server error' 
    });
  }
}

export const swapStatistics = async(req, res) => {
    try {
    const { startDate, endDate } = req.query;
    let filter = {};

    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const requests = await Request.find(filter)
      .populate('requester', 'name email')
      .populate('recipient', 'name email')
      .sort({ createdAt: -1 });

    const report = requests.map(request => ({
      requesterName: request.requester.name,
      requesterEmail: request.requester.email,
      recipientName: request.recipient.name,
      recipientEmail: request.recipient.email,
      skillOffered: request.skillOffered,
      skillWanted: request.skillWanted,
      status: request.status,
      requestDate: request.createdAt,
      responseDate: request.updatedAt
    }));

    res.status(200).json({
        success: true,
        report
    });
  } catch (error) {
    console.error('Error creating swap report');
    return res.status(500).json({
        success: false,
        message: 'Internal server error' 
    });
  }
}