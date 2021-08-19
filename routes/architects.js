const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const Architect = require('../models/ArchitectModel');
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

// Get All Archotects,Search by firstName and lastName
router.get('/', function(req, res, next) {
  const firstName = req.query.FirstName;
  const lastName = req.query.LastName;
  const condition = firstName ?
    {FirstName: {$regex: new RegExp(firstName), $options: 'i'}} :
    lastName ?
    {LastName: {$regex: new RegExp(lastName), $options: 'i'}} :
    {};
  Architect.find(condition, function(err, data) {
    if (err) throw err;
    res.json(data);
  }).populate('Payments Projects');
});

// Get customer By Id
router.get('/:id', function(req, res, next) {
  Architect.findById(req.params.id, function(err, data) {
    if (err) throw err;
    res.json(data);
  }).populate('Payments Projects');
});

// Add Architect
// eslint-disable-next-line max-len
router.post('/Add', uploadPostData, async function(req, res, next) {
  console.log('-> req.body', req.body);
  console.log('-> req.files', req.files);
  const obj = JSON.parse(JSON.stringify(req.body));
  console.log('Obj', obj);
  const hashedPassword = await bcrypt.hash(obj.Password, 10);
  const newArchitect = {
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
    ActiveDate: Date(),
    Gender: obj.Gender,
    DayOfBirth: obj.DayOfBirth,
    NationalEngineeringId: obj.NationalEngineeringId,
    Bio: obj.Bio,
    Type: obj.Type,
    NbExperienceYears: obj.NbExperienceYears,
    Cv: req.files.cv[0].filename,
    Subscribed: false,
    SubscriptionExpirationDate: new Date(),
    Project: [],
    Payments: [],
  };
  const UserNameExist = await Architect.find({
    Username: newArchitect.Username,
  });
  const CINExist = await Architect.find({Cin: newArchitect.Cin});
  const EmailExist = await Architect.find({Email: newArchitect.Email});
  const UsernameUserExist = await User.find({
    Username: newArchitect.Username,
  });

  const EmailUserExist = await User.find({Email: newArchitect.Email});
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
    Architect.create(newArchitect, function(err, architect) {
      if (err) throw err;
      res.send(architect._id);
    });
  }
});

//  Update Architect
// eslint-disable-next-line max-len
router.put(
    '/update/:id',
    upload.array('imgCollection', 6),
    function(req, res, next) {
      const obj = JSON.parse(JSON.stringify(req.body));
      console.log('-> req.body', req.body);
      console.log('-> obj', obj);
      const newArchitect = {
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
        img: req.files.img,
        NationalEngineeringId: req.body.NationalEngineeringId,
        Bio: req.body.Bio,
        Type: req.body.Type,
        NbExperienceYears: req.body.NbExperienceYears,
        Cv: req.files.cv,
      };
      Architect.findByIdAndUpdate(
          req.params.id,
          newArchitect,
          async function(err, data) {
            if (err) throw err;
            await User.findOneAndUpdate(
                {RefUser: req.params.id},
                {
                  Username: newArchitect.Username,
                  Email: newArchitect.Email,
                  img: newArchitect.img,
                },
            );
            console.log('UPDATED');
            res.send('UPDATED OK');
          },
      );
    },
);

// Delete Architect By id
router.delete('/remove/:id', async function(req, res, next) {
  Architect.findByIdAndRemove(
      req.params.id,
      req.body,
      async function(err, data) {
        if (err) throw err;
        await User.deleteOne({RefUser: req.params.id});
        res.send('DELETED OK');
      },
  );
});

// Delete All Archotects
router.delete('/remove', function(req, res, next) {
  Architect.deleteMany({})
      .then((data) => {
        res.send({
          message: `${data.deletedCount} Architects were deleted successfully!`,
        });
      })
      .catch((err) => {
        res.status(500).send({
          message:
          err.message || 'Some error occurred while removing all customers.',
        });
      });
});

// Update Password Architect
router.put('/updatePassword/:id', async function(req, res, next) {
  const {currentPassword, password} = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await User.find({RefUser: req.params.id});
    if ((await bcrypt.compare(currentPassword, user[0].Password)) === false) {
      return res.send('WrongPassword');
    } else {
      Architect.findByIdAndUpdate(
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

// Disable Account Architect
router.put('/DisableAccount/:id', async function(req, res, next) {
  const {passwordD} = req.body;
  try {
    const user = await User.find({RefUser: req.params.id});
    if ((await bcrypt.compare(passwordD, user[0].Password)) === false) {
      return res.send('WrongPassword');
    } else {
      Architect.findByIdAndRemove(req.params.id, async function(err, data) {
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

// Update Architect Subscription
router.put('/UpdateSubscription/:id', function(req, res, next) {
  Architect.findByIdAndUpdate(req.params.id, req.body, function(err, data) {
    if (err) throw err;
    console.log('UPDATED');
    res.send('UPDATED OK');
  });
});

module.exports = router;
