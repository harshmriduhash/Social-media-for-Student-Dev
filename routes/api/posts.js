const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const auth = require('../../middleware/auth');
const Post = require('../../models/Post');
const User = require('../../models/User');
const Profile = require('../../models/Profile');

// @route       POST api/posts
// @desc        Create a Post
// @access      Private
router.post('/', [
  auth, [
    check('text', 'Text is required').notEmpty()
  ] 
], async(req, res) => {
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    res.status(400).json({ errors: errors.array()});
  }

  try {
    const user = await User.findById(req.user.id);
    const newPost = new Post({
      text: req.body.text,
      name: user.name,
      avatar: user.avatar,
      user: req.user.id
    });
    const post = await newPost.save();
    res.json( post );
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error!');
  }

});

// @route       GET api/posts
// @desc        GET all Posts
// @access      Private
router.get('/', auth, async(req,res)=>{
  try {
    const posts = await Post.find().sort({ date: -1});
    res.json(posts);

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error!');
  }
});

// @route       GET api/posts/:id
// @desc        GET post by id
// @access      Private
router.get('/:id', auth, async(req,res)=>{
  try {
    const post = await Post.findById(req.params.id);
    if(!post){
      return res.status(404).json({ msg: 'Post not found!'});
    }
    res.json(post);

  } catch (error) {
    console.error(error.message);
    if(error.kind === 'ObjectId'){
      return res.status(404).json({ msg: 'Post not found!'});
    }
    res.status(500).send('Server Error!');
  }
});

// @route       DELETE api/posts/:id
// @desc        DELETE post by id
// @access      Private
router.delete('/:id', auth, async(req,res)=>{
  try {
    const post = await Post.findById(req.params.id);
    if(!post){
      return res.status(404).json({ msg: 'Post not found!'});
    }
    // Check User
    if(post.user.toString() !== req.user.id){
      return res.status(401).json({msg: 'User not authorized'});
    }
    // Remove post
    await post.remove();
    res.json({msg: 'Post deleted!'});
  } catch (error) {
    console.error(error.message);
    if(error.kind === 'ObjectId'){
      return res.status(404).json({ msg: 'Post not found!'});
    }
    res.status(500).send('Server Error!');
  }
});

// @route       PUT api/posts/like/:id
// @desc        Like a post
// @access      Private
router.put('/like/:id', auth, async(req,res)=>{
  try {
    const post = await Post.findById(req.params.id);
    // check if post is already liked by user
    if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0){
      return res.status(400).json({msg: 'Post already liked'});
    }
    post.likes.unshift({ user: req.user.id});
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error!');
  }
});

// @route       PUT api/posts/unlike/:id
// @desc        unlike a post
// @access      Private
router.put('/unlike/:id', auth, async(req,res)=>{
  try {
    const post = await Post.findById(req.params.id);
    // check if post is already liked by user
    if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0){
      return res.status(400).json({msg: 'Post has not yet been liked'});
    }
    // Get removeIndex
    const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
    post.likes.splice(removeIndex, 1);
    await post.save();
    res.json(post.likes);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error!');
  }
});

// @route       PUT api/posts/comment/:id
// @desc        Add a comment
// @access      Private
router.put('/comment/:id',
[ auth, 
  [
    check('text', 'Text is required').notEmpty()
  ]
], async(req,res)=>{
  const errors = validationResult(req);
  if(!errors.isEmpty()){
    return res.status(400).json({ errors: errors.array()});
  }

  try {
    const user = await User.findById(req.user.id).select('-password');
    const post = await Post.findById(req.params.id);
    const newComment = {
      user: req.user.id,
      text: req.body.text,
      name: user.name,
      avatar: user.avatar 
    }
    post.comments.unshift(newComment);
    await post.save();
    res.json(post.comments);

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error!');
  }
  
});

// @route       DELETE api/posts/comment/:id/:comment_id
// @desc        Delete a comment
// @access      Private
router.delete('/comment/:id/:comment_id', auth, async(req,res)=>{

  try {
    const post = await Post.findById(req.params.id);
    const comment = post.comments.find(comment => comment.id === req.params.comment_id);
    // check if comment exist
    if(!comment){
      return res.status(404).json({msg: 'Comment not found!'});
    }
    // check user
    if(comment.user.toString() !== req.user.id){
      return res.status(401).json({msg: 'User not authenticated!'});
    }
    // get remove index
    const remIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);
    post.comments.splice(remIndex, 1); 
    await post.save();
    res.json(post.comments);

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error!');
  }
  
});

module.exports = router; 