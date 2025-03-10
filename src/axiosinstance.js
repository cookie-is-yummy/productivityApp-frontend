// axiosInstance.js
import axios from 'axios';
import config from './config';

const instance = axios.create({
  baseURL: config.API_URL,
});

export default instance;