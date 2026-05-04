import mongoose from 'mongoose';
import {config} from '../config/config.js';

function connectDB() {
    const MONGO_URI = config.MONGO_URI;

    mongoose.connect(MONGO_URI)
        .then(() => console.log('Connected to MongoDB'))
        .catch((error) => {
            console.error('Error connecting to MongoDB:', error);
            process.exit(1);
        });
}

export default connectDB;