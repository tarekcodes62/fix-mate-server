import { getDB } from '../config/db.js';

const usersCollection = () => getDB().collection('user');

export const getMyProfile = async (req, res) => {
  try {
    const user = await usersCollection().findOne(
      { email: req.user.email },
      {
        projection: {
          name: 1,
          email: 1,
          image: 1,
          role: 1,
          phone: 1,
          area: 1,
          bio: 1,
        },
      },
    );

    if (!user) {
      return res.status(404).send({
        success: false,
        message: 'User not found',
      });
    }

    res.send({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Get profile error:', error);

    res.status(500).send({
      success: false,
      message: 'Failed to fetch profile',
    });
  }
};

// update profile
export const updateMyProfile = async (req, res) => {
  try {
    const { name, phone, area, bio, image } = req.body;

    const updatedData = {
      updatedAt: new Date(),
    };

    // Only allow these fields to be updated
    if (name !== undefined) updatedData.name = name;
    if (phone !== undefined) updatedData.phone = phone;
    if (area !== undefined) updatedData.area = area;
    if (bio !== undefined) updatedData.bio = bio;
    if (image !== undefined) updatedData.image = image;

    const result = await usersCollection().updateOne(
      { email: req.user.email },
      {
        $set: updatedData,
      },
    );

    if (result.matchedCount === 0) {
      return res.status(404).send({
        success: false,
        message: 'User not found',
      });
    }

    const updatedUser = await usersCollection().findOne(
      { email: req.user.email },
      {
        projection: {
          name: 1,
          email: 1,
          image: 1,
          role: 1,
          phone: 1,
          area: 1,
          bio: 1,
        },
      },
    );

    res.send({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update profile error:', error);

    res.status(500).send({
      success: false,
      message: 'Failed to update profile',
    });
  }
};
