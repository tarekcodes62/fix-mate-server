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
    if (booking.paymentStatus !== 'unpaid') {
      return res.status(400).send({
        success: false,
        message: 'This booking is not eligible for payment',
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

export const verifyPayment = async (req, res) => {
  try {
    const { session_id } = req.query;

    if (!session_id) {
      return res.status(400).send({
        success: false,
        message: 'Session ID is required',
      });
    }

    // Retrieve Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id);

    // Verify payment status
    if (session.payment_status !== 'paid') {
      return res.status(400).send({
        success: false,
        message: 'Payment is not completed',
      });
    }

    const bookingId = session.metadata?.bookingId;

    if (!ObjectId.isValid(bookingId)) {
      return res.status(400).send({
        success: false,
        message: 'Invalid booking ID',
      });
    }

    // Find booking
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

    // Verify booking status
    if (booking.status !== 'completed') {
      return res.status(400).send({
        success: false,
        message: 'Booking is not completed',
      });
    }

    // Verify payment amount
    const expectedAmount = Math.round(booking.finalAmount * 100);

    if (session.amount_total !== expectedAmount || session.currency !== 'usd') {
      return res.status(400).send({
        success: false,
        message: 'Payment amount verification failed',
      });
    }

    // Check existing payment
    const paymentsCollection = getDB().collection('payments');

    const existingPayment = await paymentsCollection.findOne({
      bookingId: booking._id.toString(),
    });

    if (existingPayment) {
      return res.send({
        success: true,
        message: 'Payment already verified',
        payment: existingPayment,
      });
    }

    // Save payment
    const paymentData = {
      bookingId: booking._id.toString(),
      serviceTitle: booking.serviceTitle,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      technicianName: booking.technicianName,
      technicianEmail: booking.technicianEmail,
      amount: booking.finalAmount,
      currency: 'usd',
      transactionId: String(session.payment_intent),
      stripeSessionId: session.id,
      paymentStatus: 'paid',
      paidAt: new Date(),
    };

    const result = await paymentsCollection.insertOne(paymentData);

    // Update booking payment status
    await bookingsCollection().updateOne(
      {
        _id: booking._id,
        customerEmail: req.user.email,
        paymentStatus: 'unpaid',
      },
      {
        $set: {
          paymentStatus: 'paid',
          updatedAt: new Date(),
        },
      },
    );

    res.send({
      success: true,
      message: 'Payment verified successfully',
      payment: {
        ...paymentData,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error('Payment verification error:', error);

    res.status(500).send({
      success: false,
      message: 'Failed to verify payment',
    });
  }
};

// get payments api
export const getMyPayments = async (req, res) => {
  try {
    const paymentsCollection = getDB().collection('payments');

    const payments = await paymentsCollection
      .find({
        customerEmail: req.user.email,
      })
      .sort({ paidAt: -1 })
      .toArray();

    res.send({
      success: true,
      payments,
    });
  } catch (error) {
    console.error('Get payments error:', error);

    res.status(500).send({
      success: false,
      message: 'Failed to fetch payment history',
    });
  }
};
