const mongoose = require('mongoose');
const config = require('config');
const db = config.get("mongoURI");

const connectDB = async() => {
  try {
    await mongoose.connect(db, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });
    console.log('Mongodb connected....');
  } catch (error) {
    console.error(error.message);
    //Exit process with failure flag on
    process.exit(1);
  }
}

module.exports = connectDB;