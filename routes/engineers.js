const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const Engineer = require('../models/EngineerModel');
const User = require('../models/UserModel').UserSchema;

const {sendConfirmationEmail} = require('../mailer');
const bcrypt = require('bcrypt');

const multer = require('multer');
const path = require('path');

// eslint-disable-next-line no-unused-vars
const {LocalStorage} = require('node-localstorage');
router.use(express.static(__dirname + './public/'));
// router.use(express.static(__dirname+"./public/"));
if (typeof localStorage === 'undefined' || localStorage === null) {
  const LocalStorage = require('node-localstorage').LocalStorage;
  localStorage = new LocalStorage('./scratch');
}

const destination = (req, file, cb) => {
  switch (file.mimetype) {
    case 'image/jpeg':
      cb(null, './public/uploads/');
      break;
    case 'image/png':
      cb(null, './public/uploads/');
      break;
    case 'application/pdf':
      cb(null, './public/uploads/pdf');
      break;
    default:
      cb('invalid file');
      break;
  }
};

const storage = multer.diskStorage({
  destination: destination,
  filename: (req, file, cb) => {
    return cb(
        null,
        `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`,
    );
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'application/pdf'
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
  fileFilter: fileFilter,
});

const uploadPostData = (req, res, next) => {
  upload.fields([
    {name: 'img', maxCount: 1},
    {name: 'cv', maxCount: 1},
  ])(req, res, (err) => {
    console.log(req.files);
    req.body.img = req.files.img[0].path.replace('/\\/g', '/');
    req.body.cv = req.files.cv[0].path.replace('/\\/g', '/');
    next();
  });
};
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
router.post('/Add', uploadPostData, async function(req, res, next) {
  const obj = JSON.parse(JSON.stringify(req.body));
  console.log('Obj', obj);
  const hashedPassword = await bcrypt.hash(obj.Password, 10);
  const newEngineer = {
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
    img: req.files.img[0].filename,
    NationalEngineeringId: obj.NationalEngineeringId,
    Bio: obj.Bio,
    Speciality: obj.Speciality,
    NbExperienceYears: obj.NbExperienceYears,
    Cv: req.files.cv[0].filename,
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
      res.send(engineer._id);
    });
  }
});

//  Update Engineer
router.put('/update/:id', uploadPostData, function(req, res, next) {
  const obj = JSON.parse(JSON.stringify(req.body));
  console.log('-> req.body', req.body);
  console.log('-> obj', obj);
  const newEngineer = {
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
    Role: obj.Role,
    img: req.files.img[0].filename,
    NationalEngineeringId: obj.NationalEngineeringId,
    Bio: obj.Bio,
    Speciality: obj.Speciality,
    NbExperienceYears: obj.NbExperienceYears,
    Cv: req.files.cv[0].filename,
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
