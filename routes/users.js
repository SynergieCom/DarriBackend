var express = require('express');
var router = express.Router();
var bcrypt = require("bcrypt");
var User = require("../models/UserModel").UserSchema;
var Customer = require("../models/CustomerModel");
var Engineer = require("../models/EngineerModel");
var Architect = require("../models/ArchitectModel");
var ResetCode = require("../models/ResetCode");
var {SendResetPasswordEmail} = require("../mailer");
var {ContactUsEmail} = require("../mailer");




/** Get All Users **/

router.get('/usersAll', function(req, res, next) {
  User.find(function(err,data){
    if(err) throw err;
    res.json(data);
  });
});

/** LOGIN Restful API for React **/

router.get('/', function(req, res, next) {
  const username = req.query.username;
  const password = req.query.password;

  User.find({$or:[{Username: username},{Email: username}]},async function(err,data){
    if(err) throw err;
    if(data.length === 0)
    {
      return res.send("UserNotFound");
    }
    else if (await bcrypt.compare(password,data[0].Password) === false){
      console.log("WrongPassword")
      return res.send("WrongPassword");
    }
    else {
      res.json(data);
    }
  });
});

/** Delete All Users **/
router.delete('/remove', function(req,res,next){
  User.deleteMany({})
      .then(data => {
        res.send({
          message: `${data.deletedCount} Users were deleted successfully!`
        });
      })
      .catch(err => {
        res.status(500).send({
          message:
              err.message || "Some error occurred while removing all tutorials."
        });
      });
});


/** Delete All Users **/
router.delete('/remove', function(req,res,next){
  User.deleteMany({})
      .then(data => {
        res.send({
          message: `${data.deletedCount} Users were deleted successfully!`
        });
      })
      .catch(err => {
        res.status(500).send({
          message:
              err.message || "Some error occurred while removing all tutorials."
        });
      });
});




/** LOGIN Restful API for FaceAPi Recognition with Email Account **/
router.get('/EmailFace', function(req, res, next) {
  const email = req.query.email;

  User.find({Email:email},async function(err,data){
    if(err) throw err;
    if(data.length === 0)
    {
      return res.send("UserNotFound");
    }
    else {
      res.json(data);
    }
  });
});


/** Add User (Post Man) **/

router.post('/', async function(req,res,next){
  const password = req.body.Password;
  const hashedPassword = await bcrypt.hash(password,10);
  const user = new User({
    Username:req.body.Username,
    Password:hashedPassword,
    Email:req.body.Email,
    Role:req.body.Role,
    img:req.body.img
  });
  try{
    user.save();
    res.send("Ajout");
  }
  catch (error){
    res.send(error);
  }
});




/** Reset Password (All Users) **/


//Send Reset Password Mail
router.post('/resetPassword', async function(req,res,next){
  const {Email} = req.body;
  const user = await User.find({Email: Email});
  try{
    if(user.length === 0){
      return  res.send("UserNotExist");
    }
    const resetCode = await ResetCode.find({Id: user[0].RefUser});
    if (resetCode.length !==0){
      res.send("EmailAlreadySent");
    }
    else {
      const code = user[0]._id.toString().substr(20,24);
      const newResetCode = new ResetCode({Id: user[0].RefUser,Code:code});
      await newResetCode.save();
      SendResetPasswordEmail(user[0].Email,user[0].Username,user[0].RefUser,code);

      res.send("EmailSended");
    }

  }
  catch (error){
    res.send(error);
  }
});


//Reset User Password Confirmation
router.post('/resetPassword/confirmation', async function(req,res,next){
  const {Code, id, password} = req.body;
  console.log(Code,id,password);
  const hashedPassword = await bcrypt.hash(password,10);

  try {
    const resetCode = await ResetCode.find({Code: Code});
    if (resetCode.length === 0) {
      console.log("WrongCode");
      return res.send("WrongCode");
    }
    else {
      const user = await User.find({RefUser: id});
      if (user.length === 0) {
        console.log("Send Again");
        return res.send("SendAgain");
      }
      else {
        await ResetCode.deleteOne({Code: Code});
        if(user[0].Role ==="Customer"){
          const newUser = new User({
            RefUser: id,
            Username:user[0].Username,
            FirstName: user[0].FirstName,
            LastName: user[0].LastName,
            Password:hashedPassword,
            Email:user[0].Email,
            Role:"Customer",
            img:user[0].img
          });
          await User.deleteOne({RefUser: id});
          await User.create(newUser);
          Customer.findByIdAndUpdate(id, {Password:hashedPassword},function(err,data){
            if(err) throw err;
            console.log('UPDATED');
            return res.send("PasswordUpdated");
          });
        }
        else if(user[0].Role ==="Engineer") {
          const newUser = new User({
            RefUser: id,
            Username: user[0].Username,
            FirstName: user[0].FirstName,
            LastName: user[0].LastName,
            Password: hashedPassword,
            Email: user[0].Email,
            Role: "Engineer",
            img: user[0].img
          });
          await User.deleteOne({RefUser: id});
          await User.create(newUser);
          Engineer.findByIdAndUpdate(id, {Password: hashedPassword}, function (err, data) {
            if (err) throw err;
            console.log('UPDATED');
            return res.send("PasswordUpdated");
          });
        }
        else {
          const newUser = new User({
            RefUser: id,
            Username: user[0].Username,
            FirstName: user[0].FirstName,
            LastName: user[0].LastName,
            Password: hashedPassword,
            Email: user[0].Email,
            Role: "Architect",
            img: user[0].img
          });
          await User.deleteOne({RefUser: id});
          await User.create(newUser);
          Architect.findByIdAndUpdate(id, {Password: hashedPassword}, function (err, data) {
            if (err) throw err;
            console.log('UPDATED');
            return res.send("PasswordUpdated");
          });
        }
      }
    }
  }
  catch (error){
    res.send(error);
  }
});


/** Contact Us **/
router.post('/contactUs', async function(req,res,next){
  const {Email,Username,Subject,Message} = req.body;
  ContactUsEmail(Email ,Username,Subject,Message);
  res.send("EmailSended");

});






module.exports = router;

