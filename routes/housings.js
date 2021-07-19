const express = require('express');
// eslint-disable-next-line new-cap
const router = express.Router();
const {v4: uuidv4} = require('uuid');
const Housing = require('../models/HousingModel');

const multer = require('multer');
// const path = require('path');
router.use(express.static(__dirname + './public/'));

const DIR = './public/';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, DIR);
  },
  filename: (req, file, cb) => {
    const fileName = file.originalname.toLowerCase().split(' ').join('-');
    cb(null, uuidv4() + '-' + fileName);
  },
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype === 'image/png' ||
      file.mimetype === 'image/jpg' ||
      file.mimetype === 'image/jpeg'
    ) {
      cb(null, true);
    } else {
      cb(null, false);
      return cb(new Error('Only .png, .jpg and .jpeg format allowed!'));
    }
  },
});

// eslint-disable-next-line max-len
/** ********************************************************** CURD ************************************************************************* **/

// Get All Housing,Search by firstName and lastName
router.get('/', function(req, res, next) {
  const Type = req.query.Type;
  const Status = req.query.Status;
  const condition = Type ?
    {Type: {$regex: new RegExp(Type), $options: 'i'}} :
    Status ?
    {Status: {$regex: new RegExp(Status), $options: 'i'}} :
    {};
  Housing.find(condition, function(err, data) {
    if (err) throw err;
    res.json(data);
  });
});

// Get customer By Id
router.get('/:id', function(req, res, next) {
  Housing.findById(req.params.id, function(err, data) {
    if (err) throw err;
    res.json(data);
  });
});

// Add Housing
router.post(
    '/',
    upload.array('imgCollection', 6),
    async function(req, res, next) {
    // const obj = JSON.parse(JSON.stringify(req.body));
    // console.log(obj);
    // const reqFiles = [];
    //                  const url = req.protocol + '://' + req.get('host');
    //                  for (let i = 0; i < req.files.length; i++) {
    // eslint-disable-next-line max-len
    //                    reqFiles.push(url + '/public/uploads/' + req.files[i].filename);
    //                  }
      const newHousing = {
        Description: req.body.Description,
        Address: {
          Street: req.body.Address.Street,
          City: req.body.Address.City,
          State: req.body.Address.State,
          ZipCode: req.body.Address.ZipCode,
          Location: {
            latitude: req.body.Address.Location.latitude,
            longitude: req.body.Address.Location.longitude,
          },
        },
        NbRooms: req.body.NbRooms,
        Nbfloor: req.body.Nbfloor,
        ParkingSpace: req.body.ParkingSpace,
        LivingArea: req.body.LivingArea,
        Type: req.body.Type,
        Status: req.body.Status,
        Price: req.body.Price,
        MonthlyRent: req.body.MonthlyRent,
        ConstructionYear: req.body.ConstructionYear,
        RentalStartDate: req.body.RentalFinishDate,
        RentalFinishDate: req.body.RentalFinishDate,
        PublishedDate: Date.now(),
      // imgCollection: reqFiles,
      };
      Housing.create(newHousing, function(err, housing) {
        if (err) {
          res.send(err);
        } else {
          res.send(housing._id);
        }
      });
    },
);

// Update Housing
router.put(
    '/update/:id',
    upload.array('imgCollection', 6),
    async function(req, res, next) {
    // const obj = JSON.parse(JSON.stringify(req.body));
    // console.log(obj);
    // const reqFiles = [];
    //                  const url = req.protocol + '://' + req.get('host');
    //                  for (let i = 0; i < req.files.length; i++) {
    // eslint-disable-next-line max-len
    //                    reqFiles.push(url + '/public/uploads/' + req.files[i].filename);
    //                  }
      const newHousing = {
        Description: req.body.Description,
        Address: {
          Street: req.body.Address.Street,
          City: req.body.Address.City,
          State: req.body.Address.State,
          ZipCode: req.body.Address.ZipCode,
          Location: {
            latitude: req.body.Address.Location.latitude,
            longitude: req.body.Address.Location.longitude,
          },
        },
        NbRooms: req.body.NbRooms,
        Nbfloor: req.body.Nbfloor,
        ParkingSpace: req.body.ParkingSpace,
        LivingArea: req.body.LivingArea,
        Type: req.body.Type,
        Status: req.body.Status,
        Price: req.body.Price,
        MonthlyRent: req.body.MonthlyRent,
        ConstructionYear: req.body.ConstructionYear,
        RentalStartDate: req.body.RentalFinishDate,
        RentalFinishDate: req.body.RentalFinishDate,
        PublishedDate: Date.now(),
      // imgCollection: reqFiles,
      };
      Housing.findByIdAndUpdate(
          req.params.id,
          newHousing,
          async function(err, data) {
            if (err) throw err;
            console.log('UPDATED');
            res.send('UPDATED OK');
          },
      );
    },
);

// Delete Housing By id
router.delete('/remove/:id', async function(req, res, next) {
  Housing.findByIdAndRemove(
      req.params.id,
      req.body,
      async function(err, data) {
        if (err) throw err;
        res.send('DELETED OK');
      },
  );
});

// Delete All Housings
router.delete('/remove', function(req, res, next) {
  Housing.deleteMany({})
      .then((data) => {
        res.send({
          message: `${data.deletedCount} Housings were deleted successfully!`,
        });
      })
      .catch((err) => {
        res.status(500).send({
          message:
          err.message || 'Some error occurred while removing all customers.',
        });
      });
});

module.exports = router;
