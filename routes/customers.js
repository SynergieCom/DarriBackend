const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const Customer = require('../models/CustomerModel');
const User = require('../models/UserModel').UserSchema;

const {sendConfirmationEmail} = require('../mailer');
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
  }).populate('Contarcts');
});

// Get customer By Id
router.get('/:id', function(req, res, next) {
  Customer.findById(req.params.id, function(err, data) {
    if (err) throw err;
    res.json(data);
  }).populate('Contarcts');
});

// Add Customer
router.post('/Add', upload, async function(req, res, next) {
  const obj = JSON.parse(JSON.stringify(req.body));
  console.log('Obj', obj);
  const hashedPassword = await bcrypt.hash(obj.Password, 10);
  const newCustomer = {
    Username: obj.Username,
    Cin: obj.Cin,
    FirstName: obj.FirstName,
    LastName: obj.LastName,
    Email: obj.Email,
    Password: hashedPassword,
    PhoneNumber: obj.PhoneNumber,
    Address: {
      Street: obj.Street,
      City: obj.City,
      State: obj.State,
      ZipCode: obj.ZipCode,
    },
    Role: obj.Role,
    img: req.file.filename,
    ActiveDate: Date(),
    Gender: obj.Gender,
    DayOfBirth: obj.DayOfBirth,
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
      sendConfirmationEmail(
          newCustomer.Email,
          newCustomer.Username,
          customer._id,
          'Customer',
      );
      res.send(customer._id);
    });
  }
});

//  Update Customer
router.put('/update/:id', upload, function(req, res, next) {
  const obj = JSON.parse(JSON.stringify(req.body));
  console.log('-> req.body', req.body);
  console.log('-> obj', obj);
  const newCustomer = {
    Username: obj.Username,
    Cin: obj.Cin,
    FirstName: obj.FirstName,
    LastName: obj.LastName,
    Email: obj.Email,
    PhoneNumber: obj.PhoneNumber,
    Address: {
      Street: obj.Street,
      City: obj.City,
      State: obj.State,
      ZipCode: obj.ZipCode,
    },
    img: req.file.filename,
  };
  Customer.findByIdAndUpdate(
      req.params.id,
      newCustomer,
      async function(err, data) {
        if (err) throw err;
        await User.findOneAndUpdate(
            {RefUser: req.params.id},
            {
              Username: newCustomer.Username,
              Email: newCustomer.Email,
              img: newCustomer.img,
            },
        );
        console.log('UPDATED');
        res.send('UPDATED OK');
      },
  );
});

// Delete Customer By id
router.delete('/remove/:id', async function(req, res, next) {
  Customer.findByIdAndRemove(
      req.params.id,
      req.body,
      async function(err, data) {
        if (err) throw err;
        await User.deleteOne({RefUser: req.params.id});
        res.send('DELETED OK');
      },
  );
});

// Delete All Customers
router.delete('/remove', function(req, res, next) {
  Customer.deleteMany({})
      .then((data) => {
        res.send({
          message: `${data.deletedCount} Customers were deleted successfully!`,
        });
      })
      .catch((err) => {
        res.status(500).send({
          message:
          err.message || 'Some error occurred while removing all customers.',
        });
      });
});

// Update Password Customer
router.put('/updatePassword/:id', async function(req, res, next) {
  const {currentPassword, password} = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await User.find({RefUser: req.params.id});
    if ((await bcrypt.compare(currentPassword, user[0].Password)) === false) {
      return res.send('WrongPassword');
    } else {
      Customer.findByIdAndUpdate(
          req.params.id,
          {Password: hashedPassword},
          async function(err, data) {
            if (err) throw err;
            await User.findOneAndUpdate(
                {RefUser: req.params.id},
                {
                  Password: hashedPassword,
                },
            );
            console.log('UPDATED');
            return res.send('PasswordUpdated');
          },
      );
    }
  } catch (error) {
    res.send(error);
  }
});

// Disable Account Customer
router.put('/DisableAccount/:id', async function(req, res, next) {
  const {passwordD} = req.body;
  try {
    const user = await User.find({RefUser: req.params.id});
    if ((await bcrypt.compare(passwordD, user[0].Password)) === false) {
      return res.send('WrongPassword');
    } else {
      Customer.findByIdAndRemove(req.params.id, async function(err, data) {
        if (err) throw err;
        await User.remove({RefUser: req.params.id});
        console.log('UserDeleted');
        return res.send('Deleted');
      });
    }
  } catch (error) {
    res.send(error);
  }
});

module.exports = router;
