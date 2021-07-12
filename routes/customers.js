const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const Customer = require('../models/CustomerModel');
const User = require('../models/UserModel');

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
const upload = multer({
  storage: Storage,
}).single('img');

// eslint-disable-next-line max-len
/** ********************************************************** CURD ************************************************************************* **/

// Get All Customers,Search by firstName and lastName
router.get('/', function(req, res, next) {
  const firstName = req.query.firstName;
  const lastName = req.query.lastName;
  const condition = firstName ?
    {FirstName: {$regex: new RegExp(firstName), $options: 'i'}} :
    lastName ?
    {LastName: {$regex: new RegExp(lastName), $options: 'i'}} :
    {};
  Customer.find(condition, function(err, data) {
    if (err) throw err;
    res.json(data);
  }).populate('contarcts');
});

// Add Customer
router.post('/addCustomer', upload, async function(req, res, next) {
  const obj = JSON.parse(JSON.stringify(req.body));
  console.log('Obj', obj);
  const hashedPassword = await bcrypt.hash(obj.password, 10);
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
    img: req.body.file.filename,
    Contracts: [],
  };
  const UserNameExist = await Customer.find({UserName: newCustomer.UserName});
  const CINExist = await Customer.find({Cin: newCustomer.Cin});
  const EmailExist = await Customer.find({Email: newCustomer.Email});
  const UsernameUserExist = await User.find({Username: newCustomer.UserName});
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
          newCustomer.UserName,
          customer._id,
      );
      res.send(customer._id);
    });
  }
});

module.exports = router;
