const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const Promoter = require('../models/PromoterModel');
const User = require('../models/UserModel').UserSchema;
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

// All Promoters
router.get('/', function(req, res, next) {
  const commercialName = req.query.CommercialName;
  const denomination = req.query.Denomination;
  const condition = commercialName ?
    {CommercialName: {$regex: new RegExp(commercialName), $options: 'i'}} :
    denomination ?
    {Denomination: {$regex: new RegExp(denomination), $options: 'i'}} :
    {};
  Promoter.find(condition, function(err, data) {
    if (err) throw err;
    res.json(data);
  }).populate('Payments Projects');
});

// Sort Promoters by CreationYear
router.get('/triByCreationYear', function(req, res, next) {
  Promoter.find(function(err, data) {
    if (err) throw err;
    res.json(data);
  })
      .sort({CreationYear: 1})
      .populate('Payments Projects');
});

// Get Promoter By Id
router.get('/:id', function(req, res, next) {
  Promoter.findById(req.params.id, function(err, data) {
    if (err) throw err;
    res.json(data);
  }).populate('Payments Projects');
});

// Add Promoter
router.post('/', upload, async function(req, res, next) {
  const obj = JSON.parse(JSON.stringify(req.body));
  console.log('Obj', obj);
  const hashedPassword = await bcrypt.hash(req.body.Password, 10);
  const newPromoter = {
    ResponsibleCin: obj.ResponsibleCin,
    ResponsibleName: obj.ResponsibleName,
    CreationYear: obj.CreationYear,
    CommercialName: obj.CommercialName,
    Activity: obj.Activity,
    HeadquartersAddress: {
      Street: obj.Street,
      City: obj.City,
      State: obj.State,
      ZipCode: obj.ZipCode,
    },
    RegisterStatus: obj.RegisterStatus,
    RegionalOffice: obj.RegionalOffice,
    Denomination: obj.Denomination,
    TaxSituation: obj.TaxSituation,
    Email: obj.Email,
    Password: hashedPassword,
    PhoneNumber: obj.PhoneNumber,
    Subscribed: false,
    SubscriptionExpirationDate: new Date(),
    Role: 'Promoter',
    img: req.file.filename,
    ActiveDate: Date(),
    Payments: [],
    Packages: [],
  };

  const Denomination = await Promoter.find({
    Denomination: newPromoter.Denomination,
  });
  const CINExist = await Promoter.find({
    ResponsibleCin: newPromoter.ResponsibleCin,
  });
  const EmailExist = await Promoter.find({Email: newPromoter.Email});
  const UsernameUserExist = await User.find({
    Username: newPromoter.ResponsibleName,
  });
  const EmiUserExist = await User.find({Email: newPromoter.Email});
  if (Denomination.length !== 0) {
    console.log('Denomination');
    res.send('DenominationExist');
  }
  if (UsernameUserExist.length !== 0) {
    console.log('UserNameExist');
    res.send('UserNameExist');
  } else if (EmailExist.length !== 0 || EmiUserExist.length !== 0) {
    console.log('Email Exist');
    res.send('EmailExist');
  } else if (CINExist.length !== 0) {
    console.log('CIN Exist');
    res.send('CinExist');
  } else {
    Promoter.create(newPromoter, function(err, company) {
      if (err) throw err;
      res.send(company._id);
    });
  }
});

// Update Prompter
router.put('/update/:id', upload, function(req, res, next) {
  const obj = JSON.parse(JSON.stringify(req.body));
  const newPromoter = {
    ResponsibleCin: obj.ResponsibleCin,
    ResponsibleName: obj.ResponsibleName,
    CreationYear: obj.CreationYear,
    CommercialName: obj.CommercialName,
    Activity: obj.Activity,
    HeadquartersAddress: {
      Street: obj.Street,
      City: obj.City,
      State: obj.State,
      ZipCode: obj.ZipCode,
    },
    RegisterStatus: obj.RegisterStatus,
    RegionalOffice: obj.RegionalOffice,
    Denomination: obj.Denomination,
    TaxSituation: obj.TaxSituation,
    Email: obj.Email,
    PhoneNumber: obj.PhoneNumber,
    img: req.file.filename,
  };
  Promoter.findByIdAndUpdate(
      req.params.id,
      newPromoter,
      async function(err, data) {
        if (err) throw err;
        await User.findOneAndUpdate(
            {RefUser: req.params.id},
            {
              Username: newPromoter.ResponsibleName,
              Email: newPromoter.Email,
              img: newPromoter.img,
            },
        );
        console.log('UPDATED');
        res.send(newPromoter);
      },
  );
});

// Delete All Promoters
router.delete('/remove', function(req, res, next) {
  Promoter.deleteMany({})
      .then((data) => {
        res.send({
          message: `${data.deletedCount} Promoters were deleted successfully!`,
        });
      })
      .catch((err) => {
        res.status(500).send({
          message:
          err.message || 'Some error occurred while removing all tutorials.',
        });
      });
});

// Delete Promoter By id
router.delete('/remove/:id', function(req, res, next) {
  Promoter.findByIdAndRemove(req.params.id, req.body, function(err, data) {
    if (err) throw err;
    console.log('DELETED');
    res.send('DELETED OK');
  });
});

// Update Password
router.put('/updatePassword/:id', async function(req, res, next) {
  const {currentPassword, password} = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await User.find({Id: req.params.id});
    if ((await bcrypt.compare(currentPassword, user[0].Password)) === false) {
      return res.send('WrongPassword');
    } else {
      Promoter.findByIdAndUpdate(
          req.params.id,
          {Password: hashedPassword},
          async function(err, data) {
            if (err) throw err;
            await User.findOneAndUpdate(
                {Id: req.params.id},
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
    const user = await User.find({Id: req.params.id});
    if ((await bcrypt.compare(passwordD, user[0].Password)) === false) {
      return res.send('WrongPassword');
    } else {
      Promoter.findByIdAndRemove(req.params.id, async function(err, data) {
        if (err) throw err;
        await User.remove({Id: req.params.id});
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
  Promoter.findByIdAndUpdate(req.params.id, req.body, function(err, data) {
    if (err) throw err;
    console.log('UPDATED');
    res.send('UPDATED OK');
  });
});

module.exports = router;
