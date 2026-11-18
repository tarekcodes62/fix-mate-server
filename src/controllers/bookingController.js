import { ObjectId } from 'mongodb';
import { getDB } from '../config/db.js';

const bookingsCollection = () => getDB().collection('bookings');
const servicesCollection = () => getDB().collection('services');

// Create booking
export const createBooking = async (req, res) => {
  try {
    const {
      serviceId,
      customerPhone,
      address,
      preferredDate,
      problemDescription,
    } = req.body;

    if (
      !serviceId ||
      !customerPhone ||
      !address ||
      !preferredDate ||
      !problemDescription
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    if (!ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID',
      });
    }

    if (problemDescription.trim().length < 20) {
      return res.status(400).json({
        success: false,
        message: 'Problem description must be at least 20 characters',
      });
    }

    // Find approved and available service
    const service = await servicesCollection().findOne({
      _id: new ObjectId(serviceId),
      approvalStatus: 'approved',
      isAvailable: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service is unavailable',
      });
    }

    // Technician cannot book own service
    if (service.technicianEmail === req.user.email) {
      return res.status(403).json({
        success: false,
        message: 'You cannot book your own service',
      });
    }

    // Check duplicate active booking
    const activeBooking = await bookingsCollection().findOne({
      serviceId: serviceId,
      customerEmail: req.user.email,
      status: {
        $in: ['requested', 'accepted', 'in-progress'],
      },
    });

    if (activeBooking) {
      return res.status(409).json({
        success: false,
        message: 'You already have an active booking for this service',
      });
    }

    // Validate preferred date
    const selectedDate = new Date(`${preferredDate}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (Number.isNaN(selectedDate.getTime()) || selectedDate < today) {
      return res.status(400).json({
        success: false,
        message: 'Please select a valid future date',
      });
    }

    const booking = {
      serviceId: service._id.toString(),

      // Service information
      serviceTitle: service.title,
      serviceImage: service.image,
      category: service.category,
      basePrice: service.basePrice,

      // Technician information
      technicianName: service.technicianName,
      technicianEmail: service.technicianEmail,

      // Customer information from authenticated user
      customerName: req.user.name,
      customerEmail: req.user.email,
      customerPhone,
      address,
      preferredDate,
      problemDescription,

      // Booking status
      status: 'requested',
      finalAmount: service.basePrice,
      paymentStatus: 'unpaid',

      createdAt: new Date(),
    };

    const result = await bookingsCollection().insertOne(booking);

    res.status(201).json({
      success: true,
      message: 'Repair request submitted successfully',
      data: {
        ...booking,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error('Create booking error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create booking',
    });
  }
};

// Get customer's own bookings
export const getMyBookings = async (req, res) => {
  try {
    const bookings = await bookingsCollection()
      .find({
        customerEmail: req.user.email,
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error('Get my bookings error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch bookings',
    });
  }
};

// Cancel booking
export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID',
      });
    }

    const result = await bookingsCollection().updateOne(
      {
        _id: new ObjectId(id),
        customerEmail: req.user.email,
        status: 'requested',
      },
      {
        $set: {
          status: 'cancelled',
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found or cannot be cancelled',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Booking cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel booking error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking',
    });
  }
};

// Get technician's assigned bookings
export const getTechnicianBookings = async (req, res) => {
  try {
    const bookings = await bookingsCollection()
      .find({
        technicianEmail: req.user.email,
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      data: bookings,
    });
  } catch (error) {
    console.error('Get technician bookings error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch technician bookings',
    });
  }
};

// Update booking status
export const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, finalAmount } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking ID',
      });
    }

    const allowedStatuses = [
      'accepted',
      'rejected',
      'in-progress',
      'completed',
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid booking status',
      });
    }

    // Find booking owned by technician
    const booking = await bookingsCollection().findOne({
      _id: new ObjectId(id),
      technicianEmail: req.user.email,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Validate status transition
    const allowedTransitions = {
      requested: ['accepted', 'rejected'],
      accepted: ['in-progress'],
      'in-progress': ['completed'],
    };

    if (!allowedTransitions[booking.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change status from ${booking.status} to ${status}`,
      });
    }

    const updateData = {
      status,
      updatedAt: new Date(),
    };

    // Final amount required when completing booking
    if (status === 'completed') {
      const amount = Number(finalAmount);

      if (!Number.isFinite(amount) || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Final amount must be greater than zero',
        });
      }

      updateData.finalAmount = amount;
    }

    const result = await bookingsCollection().updateOne(
      {
        _id: new ObjectId(id),
        technicianEmail: req.user.email,
        status: booking.status,
      },
      {
        $set: updateData,
      },
    );

    if (result.modifiedCount === 0) {
      return res.status(409).json({
        success: false,
        message: 'Booking status has already changed',
      });
    }

    res.status(200).json({
      success: true,
      message: `Booking ${status} successfully`,
    });
  } catch (error) {
    console.error('Update booking status error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update booking status',
    });
  }
};
