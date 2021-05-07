const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const config = require('config');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {check, validationResult} = require('express-validator');

// @route       GET api/auth
// @desc        GET authenticated user
// @access      Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json( user );
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ msg: 'Server Error!'});
  }
});

// @route       POST api/auth
// @desc        Authenticate user & get token
// @access      Public
router.post('/', 
[
  check('email', 'Email should be valid').isEmail(),
  check('password','password is required').exists()
], 
async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({ errors: errors.array() });
  }

  const {email, password} = req.body;

  try {
  // See if user exist
  let user =  await User.findOne({email});
  if (!user){
    return res.status(400).json({ errors: [{ msg: 'Invalid credentials'}] });
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if(!isMatch){
    res.status(400).json({ msg: 'Invalid credentials'});
  }

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