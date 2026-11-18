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
