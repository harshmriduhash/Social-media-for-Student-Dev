const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult} = require('express-validator');
const Profile = require('../../models/Profile');
const User = require('../../models/User');
const config = require('config');
const request = require('request');

// @route       GET api/profile/me
// @desc        GET current user profile
// @access      Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id }).populate('user',['name', 'avatar']);
    if(!profile){
      return res.status(400).json({msg: 'Profile not found for this user!!'});
    }
    res.json( profile );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route       POST api/profile
// @desc        Create OR update user profile
// @access      Private
router.post('/',[
  auth, [
    check('status', 'Status is required!').notEmpty(),
    check('skills', 'Skills are required!').notEmpty()
  ]
], 
async (req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({ errors: errors.array() });
  }

  const {
    company,
    website,
    location,
    bio,
    status,
    githubusername,
    skills,
    youtube,
    facebook,
    twitter,
    instagram,
    linkedin
  } = req.body;

  // build profile object
  const profileFields = {};
  profileFields.user = req.user.id;
  if(company) profileFields.company = company;
  if(website) profileFields.website = website;
  if(location) profileFields.location = location;
  if(bio) profileFields.bio = bio;
  if(status) profileFields.status = status;
  if(githubusername) profileFields.githubusername = githubusername;
  if (skills){
    profileFields.skills = skills.split(',').map(skill => skill.trim());
  }
  
  //build social links
  profileFields.social = {}
  if (youtube) profileFields.social.youtube = youtube;
  if (facebook) profileFields.social.facebook = facebook;
  if (twitter) profileFields.social.twitter = twitter;
  if (instagram) profileFields.social.instagram = instagram;

  try {
    let profile = await Profile.findOne({ user: req.user.id });
    if (profile){
      profile = await Profile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );

      return res.json(profile);
    }

    //create profile
    profile = new Profile(profileFields);
    await profile.save();
    res.json(profile);

  } catch (error) {
    console.error(errors.message);
    res.status(500).json({ msg: 'Server Error!!'});
  }

});

// @route       GET api/profile
// @desc        GET all user profiles
// @access      Public

router.get('/', async(req,res)=>{
  try {
    const profiles = await Profile.find().populate('user',['name', 'avatar']);
    res.json(profiles);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route       GET api/profile/user/:user_id
// @desc        GET profile by user id
// @access      Public

router.get('/user/:user_id', async(req,res)=>{
  try {
    const profile = await Profile.findOne({ user: req.params.user_id}).populate('user',['name', 'avatar']);
    if (!profile) return res.status(400).json({msg: 'Profile not found!!'});

    res.json(profile);
  } catch (error) {
    console.error(error.message);
    if(error.kind == 'ObjectId'){
      return res.status(400).json({msg: 'Profile not found!!'});
    } 
    res.status(500).send('Server Error');
  }
});

// @route       DELETE api/profile
// @desc        Delete profile, user & posts
// @access      Private

router.delete('/', auth, async(req,res)=>{
  try {
    // remove profile
    await Profile.findOneAndRemove({ user: req.user.id});
    // remove user
    await User.findOneAndRemove({ _id: req.user.id});

    res.json({msg: 'user deleted!'});
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
});

// @route       PUT api/profile/experience
// @desc        Add profile experience
// @access      Private

router.put('/experience', [auth, 
  [
    check('title', 'title is required!').notEmpty(),
    check('company', 'company is required!').notEmpty(),
    check('from', 'from date is required!').notEmpty()
  ]
], 
  async(req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()){
      res.status(400).json({ errors: errors.array()});
    }
    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    }

    try {
      const profile = await Profile.findOne({ user: req.user.id});
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);

    } catch (error) {
      console.error(error.messages);
      res.status(500).send("Server Error!");
    }
  }
);

// @route       DELETE api/profile/experience/:exp_id
// @desc        DELETE profile experience
// @access      Private

router.delete('/experience/:exp_id', auth, async(req, res) =>{
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const removeIndex = profile.experience.map(item => item.id).indexOf(req.params.exp_id);

    profile.experience.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error!');
  }
});

// @route       PUT api/profile/education
// @desc        Add profile education
// @access      Private

router.put('/education', [auth, 
  [
    check('school', 'school is required!').notEmpty(),
    check('degree', 'degree is required!').notEmpty(),
    check('fieldofstudy', 'fieldofstudy is required!').notEmpty(),
    check('from', 'from date is required!').notEmpty()

  ]
], 
  async(req,res)=>{
    const errors = validationResult(req);
    if (!errors.isEmpty()){
      res.status(400).json({ errors: errors.array()});
    }
    const {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldofstudy,
      from,
      to,
      current,
      description
    }

    try {
      const profile = await Profile.findOne({ user: req.user.id});
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);

    } catch (error) {
      console.error(error.messages);
      res.status(500).send("Server Error!");
    }
  }
);

// @route       DELETE api/profile/education/:edu_id
// @desc        DELETE profile education
// @access      Private

router.delete('/education/:edu_id', auth, async(req, res) =>{
  try {
    const profile = await Profile.findOne({ user: req.user.id });
    const removeIndex = profile.education.map(item => item.id).indexOf(req.params.edu_id);

    profile.education.splice(removeIndex, 1);
    await profile.save();
    res.json(profile);

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error!');
  }
});

// @route       GET api/profile/github/:username
// @desc        GET user repo from Github
// @access      Public

router.get('/github/:username', (req, res)=>{
  try {
    const options = {
      uri: `https://api.github.com/users/${req.params.username}/repos?per_page=5&
      sort=created:asc&client_id=${config.get('githubClientId')}&client_secret=${config.get('githubSecret')}`,
      method: 'GET',
      headers: {'user-agent': 'node.js'}
    };

    request(options, (error, response, body) => {
      if(error) console.error(error);
      
      if(response.statusCode !== 200){
        return res.status(404).json({msg: 'No github profile Found'});
      }
      
      res.json(JSON.parse(body));
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error!');
  }
});


module.exports = router; 