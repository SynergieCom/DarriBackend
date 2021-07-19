const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const Payment = require('../models/PaymentModel');
const Architect = require('../models/ArchitectModel');
const Engineer = require('../models/EngineerModel');
const Promoter = require('../models/PromoterModel');

// Stripe Payment Config
const stripe = require('stripe')(
    // eslint-disable-next-line max-len
    'sk_test_51IfWBLCVTWqP5309JTjdorJKTRm2p4oXBBe746cv5gR9lVnMyAy4373gs2mcIm0ceEu35XuVoJbLOVg98asz0sgV00mQZFDbV4',
);

// SMS TWILIO Config
require('dotenv').config();
const Twilio = require('twilio');
const authToken = process.env.TWILIO_ACCOUNT_SID;
// eslint-disable-next-line no-unused-vars
const clientSMS = new Twilio('AC1c4a7e63a7c65e00cde37b7e422f4724', authToken);
const {paymentDetailsEmail} = require('../mailer');

// Search Payments By NameOnCard and PaymentMethod
router.get('/', function(req, res, next) {
  const nameOnCard = req.query.NameOnCard;
  const paymentMethod = req.query.paymentMethod;
  const condition = nameOnCard ?
    {NameOnCard: {$regex: new RegExp(nameOnCard), $options: 'i'}} :
    paymentMethod ?
    {PaymentMethod: {$regex: new RegExp(paymentMethod), $options: 'i'}} :
    {};
  Payment.find(condition, function(err, data) {
    if (err) throw err;
    res.json(data);
  });
});

// Get Payment By Id
router.get('/:id', function(req, res, next) {
  Payment.findById(req.params.id, function(err, data) {
    if (err) throw err;
    res.json(data);
  });
});

// Pay (Architect,Engineer,Promoter)
router.post('/addPayment/:id', async function(req, res, next) {
  // const obj = JSON.parse(JSON.stringify(req.body));
  // const amount = req.query.amount;
  const role = req.body.Role;
  const newPayment = {
    PaymentMethod: req.body.PaymentMethod,
    NameOnCard: req.body.NameOnCard,
    Email: req.body.Email,
    Address: {
      Street: req.body.Address.Street,
      City: req.body.Address.City,
      State: req.body.Address.State,
      ZipCode: req.body.Address.ZipCode,
    },
    creditCard: req.body.creditCard,
    CardType: req.body.CardType,
    SecurityCode: req.body.SecurityCode,
    ExpirationDate: req.body.ExpirationDate,
    Country: req.body.Country,
    Amount: req.body.Amount,
    CreationDate: new Date(),
  };

  try {
    Payment.create(newPayment).then((p) => {
      if (role === 'Architect') {
        Architect.findByIdAndUpdate(
            req.params.id,
            {
              $push: {Payments: p._id},
              Subscribed: true,
            },
            {new: true, useFindAndModify: false},
            async function(err, architect) {
              if (err) {
                console.log(err);
              } else {
                await paymentDetailsEmail(
                    architect.Email,
                    architect.Username,
                    req.body.Amount,
                    req.body.NameOnCard,
                    req.body.creditCard,
                );
                // Send Sms
                // clientSMS.messages
                //   .create({
                // eslint-disable-next-line max-len
                // eslint-disable-next-line max-len
                //   body: `Congrats! ${architect.Username} your payed ${req.body.Amount}`,
                // to: '+21620566666', // Text this number
                //  from: '+14079179267', // From a valid Twilio number
                // })
                //  .then((message) => console.log(message.sid));
                console.log('add Architect Payment');
              }
            },
        );
      } else if (role === 'Engineer') {
        Engineer.findByIdAndUpdate(
            req.params.id,
            {
              $push: {Payments: p._id},
              Subscribed: true,
            },
            {new: true, useFindAndModify: false},
            async function(err, engineer) {
              if (err) {
                console.log(err);
              } else {
                await paymentDetailsEmail(
                    engineer.Email,
                    engineer.Username,
                    req.body.Amount,
                    req.body.NameOnCard,
                    req.body.creditCard,
                );
                // Send Sms
                // clientSMS.messages
                //    .create({
                //      // eslint-disable-next-line max-len
                // eslint-disable-next-line max-len
                //      body: `Congrats! ${architect.Username} your payed ${amount}`,
                //      to: '+21620566666', // Text this number
                //      from: '+14079179267', // From a valid Twilio number
                //    })
                //    .then((message) => console.log(message.sid));
                console.log('add Engineer Payment');
              }
            },
        );
      } else {
        Promoter.findByIdAndUpdate(
            req.params.id,
            {
              $push: {Payments: p._id},
              Subscribed: true,
            },
            {new: true, useFindAndModify: false},
            async function(err, promoter) {
              if (err) {
                console.log(err);
              } else {
                await paymentDetailsEmail(
                    promoter.Email,
                    promoter.Denomination,
                    req.body.Amount,
                    req.body.NameOnCard,
                    req.body.creditCard,
                );
                // Send Sms
                // clientSMS.messages
                //    .create({
                //      // eslint-disable-next-line max-len
                // eslint-disable-next-line max-len
                //      body: `Congrats! ${architect.Username} your payed ${amount}`,
                //      to: '+21620566666', // Text this number
                //      from: '+14079179267', // From a valid Twilio number
                //    })
                //    .then((message) => console.log(message.sid));
                console.log('add Promoter Payment');
              }
            },
        );
      }
    });
    res.send('Ajout Payment Successfully ');
  } catch (error) {
    res.send(error);
  }
});

// AddPayment Stripe
router.post('/stripePayment', async (req, res) => {
  // Create a PaymentIntent with the order amount and currency
  const {amount, id} = req.body;
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency: 'USD',
    description: 'DARRI',
    payment_method: id,
    confirm: true,
  });
  res.send({
    clientSecret: paymentIntent.client_secret,
    id: paymentIntent.id,
    success: true,
  });
});

// Delete Payment By id
router.delete('/remove/:id', function(req, res, next) {
  Payment.findByIdAndRemove(req.params.id, req.body, function(err, data) {
    if (err) throw err;
    console.log('DELETED');
    res.send('DELETED OK');
  });
});

// Delete All Payments
router.delete('/remove', function(req, res, next) {
  Payment.deleteMany({})
      .then((data) => {
        res.send({
          message: `${data.deletedCount} Payment were deleted successfully!`,
        });
      })
      .catch((err) => {
        res.status(500).send({
          message:
          err.message || 'Some error occurred while removing all tutorials.',
        });
      });
});

module.exports = router;
