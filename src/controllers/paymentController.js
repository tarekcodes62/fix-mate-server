import { ObjectId } from 'mongodb';
import stripe from '../config/stripe.js';
import { getDB } from '../config/db.js';

const bookingsCollection = () => getDB().collection('bookings');

export const createCheckoutSession = async (req, res) => {
  try {
    const { bookingId } = req.body;

    // Validate booking ID
    if (!ObjectId.isValid(bookingId)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid booking ID',
      });
    }

    // Find booking belonging to the customer
    const booking = await bookingsCollection().findOne({
      _id: new ObjectId(bookingId),
      customerEmail: req.user.email,
    });

    if (!booking) {
      return res.status(404).send({
        success: false,
        message: 'Booking not found',
      });
    }

    // Payment only allowed for completed bookings
    if (booking.status !== 'completed') {
      return res.status(400).send({
        success: false,
        message: 'Payment is only allowed for completed bookings',
      });
    }

    // Prevent duplicate payment
    if (booking.paymentStatus === 'paid') {
      return res.status(400).send({
        success: false,
        message: 'This booking has already been paid',
      });
    }

    // Validate final amount
    if (!booking.finalAmount || booking.finalAmount <= 0) {
      return res.status(400).send({
        success: false,
        message: 'Invalid payment amount',
      });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',

      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: booking.serviceTitle,
            },
            unit_amount: Math.round(booking.finalAmount * 100),
          },
          quantity: 1,
        },
      ],

      success_url: `${process.env.CLIENT_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${process.env.CLIENT_URL}/payment/cancel`,

      metadata: {
        bookingId: booking._id.toString(),
        customerEmail: booking.customerEmail,
      },
    });

    res.send({
      success: true,
      checkoutUrl: session.url,
    });
  } catch (error) {
    console.error('Checkout session error:', error);

    res.status(500).send({
      success: false,
      message: 'Failed to create checkout session',
    });
  }
};
