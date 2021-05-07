const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const User = require('../../models/User');
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');

// @route       POST api/users
// @desc        Register User
// @access      Public
router.post('/', [
  check('name', 'Name shouldn\'t be empty').notEmpty(),
  check('email', 'Email should be valid').isEmail(),
  check(
    'password', 
    'Enter a password with 6 or more characters'
  ).isLength({ min: 6 })

], async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({ errors: errors.array() });
  }

  const {name, email, password} = req.body;

  try {
  // See if user exist
  let user =  await User.findOne({email});
  if (user){
    return res.status(400).json({ errors: [{ msg: 'User already exist'}] });
  }

  // Set gravatar for user
  const avatar = gravatar.url(email, {
    s: '200',
    r: 'pg',
    d: 'mm'
  });

  user = new User({
    name,
    email,
    password,
    avatar
  });

  // Encrypt password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(password, salt);
  await user.save();

  // return jsonwebtoken
  const payload = {
    user: {
      id: user.id
    }
  }
  jwt.sign(
    payload, 
    config.get('jwtToken'),
    { expiresIn: 36000},
    (err, token) =>{
      if (err) throw err;
      res.json({ token }); v
    }
  );

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
  
});
module.exports = router; 