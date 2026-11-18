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
