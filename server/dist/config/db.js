"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const connectDB = async () => {
    const atlasUri = process.env.MONGO_URI;
    const localUri = 'mongodb://127.0.0.1:27017/subscription_db';
    try {
        if (atlasUri) {
            console.log('Connecting to MongoDB Atlas...');
            await mongoose_1.default.connect(atlasUri, {
                serverSelectionTimeoutMS: 8000,
            });
            console.log('MongoDB Atlas Connected successfully!');
            return;
        }
    }
    catch (err) {
        console.warn('MongoDB Atlas connection failed:', err.message);
        console.log('Falling back to local MongoDB at', localUri);
    }
    try {
        await mongoose_1.default.connect(localUri);
        console.log('Local MongoDB Connected successfully!');
    }
    catch (err) {
        console.error('CRITICAL: All MongoDB connections failed:', err.message);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
