// config.js
const ENV = process.env.NODE_ENV;

const config = {
  development: {
    API_URL: 'http://localhost:5000/api', // Change this to your local backend if needed
  },
  production: {
    API_URL: 'https://productivity-app-xyzfe-b5bed29e76a5.herokuapp.com', // Replace with your actual Heroku backend URL
  },
};

export default config["production"];