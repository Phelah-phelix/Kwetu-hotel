const prisma = require('../utils/prisma');
const { stkPush, normalizePhone } = require('../services/mpesa');

// Maps what the frontend sends ("ROOM" etc.) to the right table + Payment column.
const PAYABLE_TYPES = {
  ROOM:       { model: 'booking',           field: 'bookingId',           amountKey: 'totalAmount' },
  SERVICE:    { model: 'serviceBooking',    field: 'serviceBookingId',    amountKey: 'amount' },
  CONFERENCE: { model: 'conferenceBooking', field: 'conferenceBookingId', amountKey: 'amount' },
};

// POST /api/payments/stk  (login required)
// body: { type: 'ROOM' | 'SERVICE' | 'CONFERENCE', bookingId, phone }
async function initiatePayment(req, res, next) {
  try {
    const { type, bookingId, phone } = req.body;

    const config = PAYABLE_TYPES[type];
    if (!config || !bookingId) {
      return res.status(400).json({ error: 'type (ROOM, SERVICE or CONFERENCE) and bookingId are required' });
    }

    const msisdn = normalizePhone(phone);
    if (!msisdn) {
      return res.status(400).json({ error: 'Enter a valid Safaricom number, e.g. 0712345678' });
    }

    const booking = await prisma[config.model].findUnique({ where: { id: bookingId } });

    // Same "not found" for missing AND someone else's booking — never confirm
    // that another customer's booking exists.
    if (!booking || booking.customerId !== req.user.id) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    if (booking.status === 'CANCELLED') {
      return res.status(400).json({ error: 'This booking was cancelled' });
    }

    const alreadyPaid = await prisma.payment.findFirst({
      where: { [config.field]: bookingId, status: 'COMPLETED' },
    });
    if (alreadyPaid) {
      return res.status(409).json({ error: 'This booking is already paid' });
    }

    // The amount ALWAYS comes from our database, never from the browser —
    // otherwise a customer could pay KES 1 for a suite.
    const amount = Number(booking[config.amountKey]);

    const result = await stkPush({
      phone: msisdn,
      amount,
      accountReference: 'KWETU',
      description: 'Kwetu Hotel',
    });

    if (result.ResponseCode !== '0') {
      console.error('STK push rejected:', result);
      return res.status(502).json({ error: result.errorMessage || result.ResponseDescription || 'M-Pesa rejected the request' });
    }

    const payment = await prisma.payment.create({
      data: {
        userId: req.user.id,
        [config.field]: bookingId,
        amount,
        method: 'MPESA',
        status: 'PENDING',
        phoneNumber: msisdn,
        checkoutRequestId: result.CheckoutRequestID,
      },
    });

    res.status(202).json({
      paymentId: payment.id,
      message: result.CustomerMessage || 'Check your phone and enter your M-Pesa PIN',
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/payments/callback/:secret  (called by SAFARICOM, not by our frontend)
// Safaricom posts the result here after the customer enters (or cancels) their PIN.
async function mpesaCallback(req, res) {
  // The secret in the URL is our proof that this really is Safaricom's callback
  // URL that we registered, not a stranger guessing the endpoint.
  if (req.params.secret !== process.env.MPESA_CALLBACK_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    const cb = req.body?.Body?.stkCallback;
    if (cb) {
      const payment = await prisma.payment.findUnique({
        where: { checkoutRequestId: cb.CheckoutRequestID },
      });

      // Ignore unknown payments, and ones we already settled (Safaricom may retry).
      if (payment && payment.status === 'PENDING') {
        if (cb.ResultCode === 0) {
          const items = cb.CallbackMetadata?.Item || [];
          const read = (name) => items.find((i) => i.Name === name)?.Value;
          const receipt = read('MpesaReceiptNumber');
          const paidAmount = Number(read('Amount'));

          if (paidAmount !== Math.ceil(Number(payment.amount))) {
            console.error('Amount mismatch on payment', payment.id, { paidAmount, expected: payment.amount });
            await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
          } else {
            const operations = [
              prisma.payment.update({
                where: { id: payment.id },
                data: { status: 'COMPLETED', mpesaReceiptNumber: receipt, paidAt: new Date() },
              }),
            ];
            // Paying confirms a still-pending booking automatically.
            if (payment.bookingId) {
              operations.push(prisma.booking.updateMany({
                where: { id: payment.bookingId, status: 'PENDING' }, data: { status: 'CONFIRMED' },
              }));
            }
            if (payment.serviceBookingId) {
              operations.push(prisma.serviceBooking.updateMany({
                where: { id: payment.serviceBookingId, status: 'PENDING' }, data: { status: 'CONFIRMED' },
              }));
            }
            await prisma.$transaction(operations);
          }
        } else {
          // Customer cancelled, wrong PIN, insufficient funds, timeout, etc.
          await prisma.payment.update({ where: { id: payment.id }, data: { status: 'FAILED' } });
        }
      }
    }
  } catch (err) {
    console.error('Callback processing error:', err);
  }

  // Always acknowledge, or Safaricom keeps retrying.
  res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}

// GET /api/payments/:id  (login required) — the frontend polls this
// to find out whether the customer has paid yet.
async function getPaymentStatus(req, res, next) {
  try {
    const payment = await prisma.payment.findUnique({ where: { id: req.params.id } });

    if (!payment || (payment.userId !== req.user.id && req.user.role !== 'ADMIN')) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    res.json({
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      mpesaReceiptNumber: payment.mpesaReceiptNumber,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { initiatePayment, mpesaCallback, getPaymentStatus };
