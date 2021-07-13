const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const Customer = require('../models/CustomerModel');
const User = require('../models/UserModel').UserSchema;

const {sendCustomerConfirmationEmail} = require('../mailer');
const bcrypt = require('bcrypt');

const multer = require('multer');
const path = require('path');
router.use(express.static(__dirname + './public/'));
// router.use(express.static(__dirname+"./public/"));
if (typeof localStorage === 'undefined' || localStorage === null) {
  const LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}
const Storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
// eslint-disable-next-line no-unused-vars
const upload = multer({
  storage: Storage,
}).single('img');

// eslint-disable-next-line max-len
/** ********************************************************** CURD ************************************************************************* **/

// Get All Customers,Search by firstName and lastName
router.get('/', function(req, res, next) {
  const firstName = req.query.FirstName;
  const lastName = req.query.LastName;
  const condition = firstName ?
    {FirstName: {$regex: new RegExp(firstName), $options: 'i'}} :
    lastName ?
    {LastName: {$regex: new RegExp(lastName), $options: 'i'}} :
    {};
  Customer.find(condition, function(err, data) {
    if (err) throw err;
    res.json(data);
  }); /* .populate('Contarcts');*/
});

// Get customer By Id
router.get('/:id', function(req, res, next) {
  Customer.findById(req.params.id, function(err, data) {
    if (err) throw err;
    res.json(data);
  }).populate('Contarcts');
});

// Add Customer
router.post(
    '/Add',
    /* upload,*/ async function(req, res, next) {
      const obj = JSON.parse(JSON.stringify(req.body));
      console.log('Obj', obj);
      const hashedPassword = await bcrypt.hash(obj.Password, 10);
      const newCustomer = {
        Username: req.body.Username,
        Cin: req.body.Cin,
        FirstName: req.body.FirstName,
        LastName: req.body.LastName,
        Password: hashedPassword,
        Email: req.body.Email,
        PhoneNumber: req.body.PhoneNumber,
        Address: {
          Street: req.body.street,
          City: req.body.city,
          State: req.body.state,
          ZipCode: req.body.ZipCode,
        },
        Role: req.body.Role,
        img: req.body.img /* file.filename*/,
        Contracts: [],
      };
      const UserNameExist = await Customer.find({
        Username: newCustomer.Username,
      });
      const CINExist = await Customer.find({Cin: newCustomer.Cin});
      const EmailExist = await Customer.find({Email: newCustomer.Email});
      const UsernameUserExist = await User.find({
        Username: newCustomer.Username,
      });
      const EmailUserExist = await User.find({Email: newCustomer.Email});

      if (UserNameExist.length !== 0 || UsernameUserExist.length !== 0) {
        console.log('UserNameExist');
        res.send('UserNameExist');
      } else if (CINExist.length !== 0) {
        console.log('CIN Exist');
        res.send('CinExist');
      } else if (EmailExist.length !== 0 || EmailUserExist.length !== 0) {
        console.log('Email Exist');
        res.send('EmailExist');
      } else {
        Customer.create(newCustomer, function(err, customer) {
          if (err) throw err;
          sendCustomerConfirmationEmail(
              newCustomer.Email,
              newCustomer.Username,
              customer._id,
          );
          res.send(customer._id);
        });
      }
    },
);

// Activate Customer
router.get('/ActivateCustomer/:id', async function(req, res, next) {
  Customer.findById(req.params.id).then((c) => {
    User.create(
        {
          RefUser: c._id,
          Username: c.Username,
          Password: c.Password,
          Email: c.Email,
          Role: 'Customer',
          img: c.img,
        },
        function(err, user) {
          if (err) throw err;
          res.redirect(`${process.env.DOMAIN_REACT}/ActivatedAccount`);
          res.end();
        },
    );
  });
});

module.exports = router;
