const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/UserModel').UserSchema;
const Customer = require('../models/CustomerModel');
const Engineer = require('../models/EngineerModel');
const Architect = require('../models/ArchitectModel');
const Promoter = require('../models/PromoterModel');
const ResetCode = require('../models/ResetCode');
const {sendResetPasswordEmail} = require('../mailer');
const {contactUsEmail, welcomeAdminEditorEmail} = require('../mailer');
const {OAuth2Client} = require('google-auth-library');
const fetch = require('node-fetch');

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
const client = new OAuth2Client(
    '211469900619-2p5n681boi9123tb9tqohej9b5186mr6.apps.googleusercontent.com',
);

// eslint-disable-next-line max-len
/** ********************************************************** CURD ************************************************************************* **/

// Get All Users
router.get('/usersAll', function(req, res, next) {
  User.find(function(err, data) {
    if (err) throw err;
    res.json(data);
  });
});

// Find User By ID
router.get('/:id', function(req, res, next) {
  User.findById(req.params.id, function(err, data) {
    if (err) throw err;
    res.json(data);
  });
});

router.get('/loginface/:id', function(req, res, next) {
  User.findById(req.params.id, function(err, data) {
    if (err) throw err;
    if (data.length === 0) {
      return res.send('UserNotFound');
    }
    res.json(data);
  });
});

/** Add User (Post Man) **/
router.post('/', upload, async function(req, res, next) {
  const obj = JSON.parse(JSON.stringify(req.body));
  console.log('Obj', obj);
  const password = obj.Password;
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    Username: obj.Username,
    Cin: obj.Cin,
    FirstName: obj.FirstName,
    LastName: obj.LastName,
    Password: hashedPassword,
    Email: obj.Email,
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
  });

  User.create(newUser, function(err, customer) {
    if (err) throw err;
    welcomeAdminEditorEmail(
        customer.Email,
        customer.Username,
        obj.Password,
        customer.Role,
    );
    res.send(customer._id);
  });
});

//  Update User
router.put('/update/:id', upload, function(req, res, next) {
  const obj = JSON.parse(JSON.stringify(req.body));
  const newUser = {
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
    Role: obj.Role,
  };
  User.findByIdAndUpdate(obj.Id, newUser, function(err, data) {
    if (err) console.log(err);
    res.json(newUser);
  });
});

// Delete User By Id
router.delete('/remove/:id', function(req, res, next) {
  User.findByIdAndDelete(req.params.id, function(err, data) {
    if (err) throw err;
    res.send('Deleted');
  });
});

// Delete All Users
router.delete('/remove', function(req, res, next) {
  User.deleteMany({})
      .then((data) => {
        res.send({
          message: `${data.deletedCount} Users were deleted successfully!`,
        });
      })
      .catch((err) => {
        res.status(500).send({
          message:
          // eslint-disable-next-line max-len
          err.message || 'Some error occurred while removing all tutorials.',
        });
      });
});

// LOGIN
router.get('/', function(req, res, next) {
  const username = req.query.username;
  const password = req.query.password;
  User.find(
      {$or: [{Username: username}, {Email: username}]},
      async function(err, data) {
        if (err) throw err;
        if (data.length === 0) {
          return res.send('UserNotFound');
        // eslint-disable-next-line max-len
        } else if ((await bcrypt.compare(password, data[0].Password)) === false) {
          console.log('WrongPassword');
          return res.send('WrongPassword');
        } else {
          res.json(data);
        }
      },
  );
});

/** LOGIN Restful API for FaceAPi Recognition with Email Account **/
router.get('/EmailFace', function(req, res, next) {
  const email = req.query.email;

  User.find({Email: email}, async function(err, data) {
    if (err) throw err;
    if (data.length === 0) {
      return res.send('UserNotFound');
    } else {
      res.json(data);
    }
  });
});

/** LOGIN WITH GOOGLE **/
router.get('/loginWithGoogle/:Tokenid', function(req, res, next) {
  const tokenId = req.params.Tokenid;
  console.log('-> tokenId', tokenId);
  client
      .verifyIdToken({
        idToken: tokenId,
        audience:
        // eslint-disable-next-line max-len
        '211469900619-2p5n681boi9123tb9tqohej9b5186mr6.apps.googleusercontent.com',
      })
      .then((response) => {
      // eslint-disable-next-line camelcase
        const {email_verified, email} = response.getPayload();
        // eslint-disable-next-line camelcase
        if (email_verified) {
          console.log('res', email);
          User.find({Email: email}, async function(err, data) {
            if (err) throw err;
            if (data.length === 0) {
              return res.send('UserNotFound');
            } else {
              res.json(data);
            }
          });
        } else {
          res.send('aasbat');
        }
      });
});

/** Reset Password (All Users) **/

// Send Reset Password Mail
router.post('/resetPassword', async function(req, res, next) {
  const {Email} = req.body;
  const user = await User.find({Email: Email});
  try {
    if (user.length === 0) {
      return res.send('UserNotExist');
    }
    const resetCode = await ResetCode.find({Id: user[0].RefUser});
    if (resetCode.length !== 0) {
      res.send('EmailAlreadySent');
    } else {
      const code = user[0]._id.toString().substr(20, 24);
      const newResetCode = new ResetCode({Id: user[0].RefUser, Code: code});
      await newResetCode.save();
      await sendResetPasswordEmail(
          user[0].Email,
          user[0].Username,
          user[0].RefUser,
          code,
      );
      res.send('EmailSended');
    }
  } catch (error) {
    res.send(error);
  }
});

// Reset User Password Confirmation
router.post('/resetPassword/confirmation', async function(req, res, next) {
  const {Code, id, password} = req.body;
  console.log(Code, id, password);
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const resetCode = await ResetCode.find({Code: Code});
    if (resetCode.length === 0) {
      console.log('WrongCode');
      return res.send('WrongCode');
    } else {
      const user = await User.find({RefUser: id});
      if (user.length === 0) {
        console.log('Send Again');
        return res.send('SendAgain');
      } else {
        await ResetCode.deleteOne({Code: Code});
        if (user[0].Role === 'Customer') {
          const newUser = new User({
            RefUser: id,
            Username: user[0].Username,
            Password: hashedPassword,
            Email: user[0].Email,
            Role: 'Customer',
            img: user[0].img,
            ActiveDate: Date(),
          });
          await User.deleteOne({RefUser: id});
          await User.create(newUser);
          Customer.findByIdAndUpdate(
              id,
              {Password: hashedPassword},
              function(err, data) {
                if (err) throw err;
                console.log('UPDATED');
                return res.send('PasswordUpdated');
              },
          );
        } else if (user[0].Role === 'Engineer') {
          const newUser = new User({
            RefUser: id,
            Username: user[0].Username,
            Password: hashedPassword,
            Email: user[0].Email,
            Role: 'Engineer',
            img: user[0].img,
            ActiveDate: Date(),
          });
          await User.deleteOne({RefUser: id});
          await User.create(newUser);
          Engineer.findByIdAndUpdate(
              id,
              {Password: hashedPassword},
              function(err, data) {
                if (err) throw err;
                console.log('UPDATED');
                return res.send('PasswordUpdated');
              },
          );
        } else {
          const newUser = new User({
            RefUser: id,
            Username: user[0].Username,
            Password: hashedPassword,
            Email: user[0].Email,
            Role: 'Architect',
            img: user[0].img,
            ActiveDate: Date(),
          });
          await User.deleteOne({RefUser: id});
          await User.create(newUser);
          Architect.findByIdAndUpdate(
              id,
              {Password: hashedPassword},
              function(err, data) {
                if (err) throw err;
                console.log('UPDATED');
                return res.send('PasswordUpdated');
              },
          );
        }
      }
    }
  } catch (error) {
    res.send(error);
  }
});

// Activate Users
router.get('/ActivateAccount/:id/:role', async function(req, res, next) {
  if (req.params.role === 'Customer') {
    Customer.findById(req.params.id).then((c) => {
      User.create(
          {
            RefUser: c._id,
            Username: c.Username,
            Password: c.Password,
            Email: c.Email,
            Role: 'Customer',
            img: c.img,
            ActiveDate: Date(),
          },
          function(err, user) {
            if (err) throw err;
            res.redirect(`${process.env.DOMAIN_REACT}/ActivatedAccount`);
            res.end();
          },
      );
    });
  } else if (req.params.role === 'Architect') {
    Architect.findById(req.params.id).then((a) => {
      User.create(
          {
            RefUser: a._id,
            Username: a.Username,
            Password: a.Password,
            Email: a.Email,
            Role: 'Architect',
            img: a.img,
            ActiveDate: Date(),
          },
          function(err, user) {
            if (err) throw err;
            res.redirect(`${process.env.DOMAIN_REACT}/ActivatedAccount`);
            res.end();
          },
      );
    });
  } else if (req.params.role === 'Engineer') {
    Engineer.findById(req.params.id).then((e) => {
      User.create(
          {
            RefUser: e._id,
            Username: e.Username,
            Password: e.Password,
            Email: e.Email,
            Role: 'Engineer',
            img: e.img,
            ActiveDate: Date(),
          },
          function(err, user) {
            if (err) throw err;
            res.redirect(`${process.env.DOMAIN_REACT}/ActivatedAccount`);
            res.end();
          },
      );
    });
  } else {
    Promoter.findById(req.params.id).then((p) => {
      User.create(
          {
            RefUser: p._id,
            Username: p.ResponsibleName,
            Password: p.Password,
            Email: p.Email,
            Role: 'Promoter',
            img: p.img,
            ActiveDate: Date(),
          },
          function(err, user) {
            if (err) throw err;
            res.redirect(`${process.env.DOMAIN_REACT}/ActivatedAccount`);
            res.end();
          },
      );
    });
  }
});

/** Contact Us **/
router.post('/contactUs', async function(req, res, next) {
  const {Email, Username, Subject, Message} = req.body;
  await contactUsEmail(Email, Username, Subject, Message);
  res.send('EmailSended');
});

// Update Password Customer
router.put('/updatePassword/:id', async function(req, res, next) {
  const {currentPassword, password} = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const user = await User.find({_id: req.params.id});
    if ((await bcrypt.compare(currentPassword, user[0].Password)) === false) {
      return res.send('WrongPassword');
    } else {
      User.findByIdAndUpdate(
          req.params.id,
          {Password: hashedPassword},
          async function(err, data) {
            if (err) throw err;
            console.log('UPDATED');
            return res.send('PasswordUpdated');
          },
      );
    }
  } catch (error) {
    res.send(error);
  }
});

// Disable Account User
router.put('/DisableAccount/:id', async function(req, res, next) {
  const {password} = req.body;
  try {
    const user = await User.find({_id: req.params.id});
    if ((await bcrypt.compare(password, user[0].Password)) === false) {
      return res.send('WrongPassword');
    } else {
      User.findByIdAndRemove(req.params.id, async function(err, data) {
        if (err) throw err;
        console.log('UserDeleted');
        return res.send('Deleted');
      });
    }
  } catch (error) {
    res.send(error);
  }
});

module.exports = router;
