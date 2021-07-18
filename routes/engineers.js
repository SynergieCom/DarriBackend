const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const Engineer = require('../models/EngineerModel');
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

// Get All Engineers,Search by firstName and lastName
router.get('/', function(req, res, next) {
  const firstName = req.query.FirstName;
  const lastName = req.query.LastName;
  const condition = firstName ?
    {FirstName: {$regex: new RegExp(firstName), $options: 'i'}} :
    lastName ?
    {LastName: {$regex: new RegExp(lastName), $options: 'i'}} :
    {};
  Engineer.find(condition, function(err, data) {
    if (err) throw err;
    res.json(data);
  }).populate('Payments Projects');
});

// Get Egineer By Id
router.get('/:id', function(req, res, next) {
  Engineer.findById(req.params.id, function(err, data) {
    if (err) throw err;
    res.json(data);
  }).populate('Payments Projects');
});

// Add Engineer
router.post(
    '/Add',
    /* upload,*/ async function(req, res, next) {
      const obj = JSON.parse(JSON.stringify(req.body));
      console.log('Obj', obj);
      const hashedPassword = await bcrypt.hash(obj.Password, 10);
      const newEngineer = {
        Username: req.body.Username,
        Cin: req.body.Cin,
        FirstName: req.body.FirstName,
        LastName: req.body.LastName,
        Password: hashedPassword,
        Email: req.body.Email,
        PhoneNumber: req.body.PhoneNumber,
        Address: {
          Street: req.body.Address.Street,
          City: req.body.Address.City,
          State: req.body.Address.State,
          ZipCode: req.body.Address.ZipCode,
        },
        Role: req.body.Role,
        img: req.body.img /* file.filename*/,
        NationalEngineeringId: req.body.NationalEngineeringId,
        Bio: req.body.Bio,
        Speciality: req.body.Speciality,
        NbExperienceYears: req.body.NbExperienceYears,
        Cv: req.body.Cv,
        Subscribed: false,
        SubscriptionExpirationDate: new Date(),
        Project: [],
        Payments: [],
      };
      const UserNameExist = await Engineer.find({
        Username: newEngineer.Username,
      });
      const CINExist = await Engineer.find({Cin: newEngineer.Cin});
      const EmailExist = await Engineer.find({Email: newEngineer.Email});
      const UsernameUserExist = await User.find({
        Username: newEngineer.Username,
      });

      const EmailUserExist = await User.find({Email: newEngineer.Email});
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
        Engineer.create(newEngineer, function(err, engineer) {
          if (err) throw err;
          sendConfirmationEmail(
              newEngineer.Email,
              newEngineer.Username,
              engineer._id,
              'Engineer',
          );
          res.send(engineer._id);
        });
      }
    },
);

//  Update Engineer
router.put('/update/:id', upload, function(req, res, next) {
  const obj = JSON.parse(JSON.stringify(req.body));
  console.log('-> req.body', req.body);
  console.log('-> obj', obj);
  const newEngineer = {
    Username: req.body.Username,
    Cin: req.body.Cin,
    FirstName: req.body.FirstName,
    LastName: req.body.LastName,
    Email: req.body.Email,
    PhoneNumber: req.body.PhoneNumber,
    Address: {
      Street: req.body.Address.Street,
      City: req.body.Address.City,
      State: req.body.Address.State,
      ZipCode: req.body.Address.ZipCode,
    },
    Role: req.body.Role,
    img: req.body.img /* file.filename*/,
    NationalEngineeringId: req.body.NationalEngineeringId,
    Bio: req.body.Bio,
    Speciality: req.body.Speciality,
    NbExperienceYears: req.body.NbExperienceYears,
    Cv: req.body.Cv,
  };
  Engineer.findByIdAndUpdate(
      req.params.id,
      newEngineer,
      async function(err, data) {
        if (err) throw err;
        await User.findOneAndUpdate(
            {RefUser: req.params.id},
            {
              Username: newEngineer.Username,
              Email: newEngineer.Email,
              img: newEngineer.img,
            },
        );
        console.log('UPDATED');
        res.send('UPDATED OK');
      },
  );
});

// Delete Engineer By id
router.delete('/remove/:id', async function(req, res, next) {
  Engineer.findByIdAndRemove(
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
  Engineer.deleteMany({})
      .then((data) => {
        res.send({
          message: `${data.deletedCount} Engineers were deleted successfully!`,
        });
      })
      .catch((err) => {
        res.status(500).send({
          message:
          err.message || 'Some error occurred while removing all engineers.',
        });
      });
});

// Update Password Engineer
router.put('/updatePassword/:id', async function(req, res, next) {
  const {currentPassword, password} = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await User.find({RefUser: req.params.id});
    if ((await bcrypt.compare(currentPassword, user[0].Password)) === false) {
      return res.send('WrongPassword');
    } else {
      Engineer.findByIdAndUpdate(
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

// Disable Account Engineer
router.put('/DisableAccount/:id', async function(req, res, next) {
  const {passwordD} = req.body;
  try {
    const user = await User.find({RefUser: req.params.id});
    if ((await bcrypt.compare(passwordD, user[0].Password)) === false) {
      return res.send('WrongPassword');
    } else {
      Engineer.findByIdAndRemove(req.params.id, async function(err, data) {
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

// Update Engineer Subscription
router.put('/UpdateSubscription/:id', function(req, res, next) {
  Engineer.findByIdAndUpdate(req.params.id, req.body, function(err, data) {
    if (err) throw err;
    console.log('UPDATED');
    res.send('UPDATED OK');
  });
});

module.exports = router;
