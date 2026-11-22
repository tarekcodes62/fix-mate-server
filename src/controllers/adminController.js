import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

const servicesCollection = () => getDB().collection('services');

// Approve or reject service
export const updateServiceApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID',
      });
    }

    if (!['approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid approval status',
      });
    }

    const result = await servicesCollection().updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          approvalStatus,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Service ${approvalStatus} successfully`,
    });
  } catch (error) {
    console.error('Service approval error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update service approval',
    });
  }
};

// All trangections payment
export const getAllTransactions = async (req, res) => {
  try {
    const paymentsCollection = getDB().collection('payments');

    const transactions = await paymentsCollection
      .find()
      .sort({ paidAt: -1 })
      .toArray();

    res.send({
      success: true,
      transactions,
    });
  } catch (error) {
    console.error('Get transactions error:', error);

    res.status(500).send({
      success: false,
      message: 'Failed to fetch transactions',
    });
  }
};

// get all users
export const getAllUsers = async (req, res) => {
  try {
    const usersCollection = getDB().collection('user');

    const users = await usersCollection
      .find()
      .sort({ createdAt: -1 })
      .toArray();

    res.send({
      success: true,
      users,
    });
  } catch (error) {
    console.error('Get users error:', error);

    res.status(500).send({
      success: false,
      message: 'Failed to fetch users',
    });
  }
};

// update user role
export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const allowedRoles = ['customer', 'technician', 'admin'];

    if (!allowedRoles.includes(role)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid role',
      });
    }

    const usersCollection = getDB().collection('user');

    // Find user by MongoDB _id or Better Auth id
    const query = {
      $or: [{ _id: id }, { id: id }],
    };

    if (ObjectId.isValid(id)) {
      query.$or.push({ _id: new ObjectId(id) });
    }

    const user = await usersCollection.findOne(query);

    if (!user) {
      return res.status(404).send({
        success: false,
        message: 'User not found',
      });
    }

    // Prevent changing own role
    if (user.email === req.user.email) {
      return res.status(403).send({
        success: false,
        message: 'You cannot change your own role',
      });
    }

    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          role,
          updatedAt: new Date(),
        },
      },
    );

    res.send({
      success: true,
      message: 'User role updated successfully',
    });
  } catch (error) {
    console.error('Update user role error:', error);

    res.status(500).send({
      success: false,
      message: 'Failed to update user role',
    });
  }
};

// get all services
export const getAllServices = async (req, res) => {
  try {
    const servicesCollection = getDB().collection('services');

    const { approvalStatus } = req.query;

    const query = {};

    // Filter by approval status
    if (approvalStatus) {
      query.approvalStatus = approvalStatus;
    }

    const services = await servicesCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.send({
      success: true,
      services,
    });
  } catch (error) {
    console.error('Get all services error:', error);

    res.status(500).send({
      success: false,
      message: 'Failed to fetch services',
    });
  }
};

// get all bookings
export const getAllBookings = async (req, res) => {
  try {
    const bookingsCollection = getDB().collection('bookings');

    const { status, paymentStatus } = req.query;

    const query = {};

    // Filter by booking status
    if (status) {
      query.status = status;
    }

    // Filter by payment status
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    const bookings = await bookingsCollection
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();

    res.send({
      success: true,
      bookings,
    });
  } catch (error) {
    console.error('Get all bookings error:', error);

    res.status(500).send({
      success: false,
      message: 'Failed to fetch bookings',
    });
  }
};

// Get admin dashboard statistics
export const getAdminStats = async (req, res) => {
  try {
    const usersCollection = getDB().collection('user');
    const servicesCollection = getDB().collection('services');

    const [totalUsers, totalTechnicians, pendingServices] = await Promise.all([
      usersCollection.countDocuments(),
      usersCollection.countDocuments({ role: 'technician' }),
      servicesCollection.countDocuments({
        approvalStatus: 'pending',
      }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalTechnicians,
        pendingServices,
      },
    });
  } catch (error) {
    console.error('Get admin stats error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch admin statistics',
    });
  }
};
