import { getDB } from '../config/db.js';
import { ObjectId } from 'mongodb';

const servicesCollection = () => getDB().collection('services');

// Get all approved and available services
export const getServices = async (req, res) => {
  try {
    const { search, category, serviceMode, sort } = req.query;

    const query = {
      approvalStatus: 'approved',
      isAvailable: true,
    };

    // Search by title or category
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by category
    if (category) {
      query.category = category;
    }

    // Filter by service mode
    if (serviceMode) {
      query.serviceMode = serviceMode;
    }

    // Sorting
    let sortOption = { createdAt: -1 };

    if (sort === 'price-low') {
      sortOption = { basePrice: 1 };
    } else if (sort === 'price-high') {
      sortOption = { basePrice: -1 };
    } else if (sort === 'newest') {
      sortOption = { createdAt: -1 };
    }

    const services = await servicesCollection()
      .find(query)
      .sort(sortOption)
      .toArray();

    res.status(200).json({
      success: true,
      message: 'Services fetched successfully',
      data: services,
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch services',
    });
  }
};

// Get single service by ID
export const getServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    // ২. আইডি সঠিক ফরম্যাটে আছে কিনা চেক করা
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format',
      });
    }

    const service = await servicesCollection().findOne({
      _id: new ObjectId(id),
      approvalStatus: 'approved',
      isAvailable: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found',
      });
    }

    res.status(200).json({
      success: true,
      data: service,
    });
  } catch (error) {
    console.error('Error fetching service by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch service',
    });
  }
};

// Create a new service
export const createService = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      image,
      basePrice,
      estimatedDuration,
      serviceMode,
      serviceArea,
    } = req.body;

    // Validate required fields
    if (
      !title ||
      !category ||
      !description ||
      !image ||
      !basePrice ||
      !estimatedDuration ||
      !serviceMode ||
      !serviceArea
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    if (Number(basePrice) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be greater than zero',
      });
    }

    const service = {
      title,
      category,
      description,
      image,
      basePrice: Number(basePrice),
      estimatedDuration,
      serviceMode,
      serviceArea,

      // Technician information from authenticated user
      technicianName: req.user.name,
      technicianEmail: req.user.email,

      // Default values
      approvalStatus: 'pending',
      isAvailable: true,
      createdAt: new Date(),
    };

    const result = await servicesCollection().insertOne(service);

    res.status(201).json({
      success: true,
      message: 'Service created successfully',
      data: {
        ...service,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error('Create service error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to create service',
    });
  }
};

// Update service
export const updateService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID',
      });
    }

    const allowedFields = [
      'title',
      'category',
      'description',
      'image',
      'basePrice',
      'estimatedDuration',
      'serviceMode',
      'serviceArea',
      'isAvailable',
    ];

    const updateData = {};

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (updateData.basePrice !== undefined) {
      updateData.basePrice = Number(updateData.basePrice);

      if (updateData.basePrice <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be greater than zero',
        });
      }
    }

    updateData.approvalStatus = 'pending';
    updateData.updatedAt = new Date();

    const result = await servicesCollection().updateOne(
      {
        _id: new ObjectId(id),
        technicianEmail: req.user.email,
      },
      {
        $set: updateData,
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or unauthorized',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service updated successfully. Waiting for approval.',
    });
  } catch (error) {
    console.error('Update service error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update service',
    });
  }
};

// Delete service
export const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID',
      });
    }

    const result = await servicesCollection().deleteOne({
      _id: new ObjectId(id),
      technicianEmail: req.user.email,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or unauthorized',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Service deleted successfully',
    });
  } catch (error) {
    console.error('Delete service error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to delete service',
    });
  }
};

// Get technician's own services
export const getMyServices = async (req, res) => {
  try {
    const services = await servicesCollection()
      .find({
        technicianEmail: req.user.email,
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error('Get my services error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch your services',
    });
  }
};

// Toggle service availability
export const toggleServiceAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { isAvailable } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID',
      });
    }

    if (typeof isAvailable !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'isAvailable must be a boolean',
      });
    }

    const result = await servicesCollection().updateOne(
      {
        _id: new ObjectId(id),
        technicianEmail: req.user.email,
      },
      {
        $set: {
          isAvailable,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Service not found or unauthorized',
      });
    }

    res.status(200).json({
      success: true,
      message: `Service ${isAvailable ? 'available' : 'unavailable'} successfully`,
    });
  } catch (error) {
    console.error('Toggle availability error:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to update availability',
    });
  }
};
