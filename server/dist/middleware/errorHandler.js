"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errorHandler = (err, req, res, next) => {
    console.error('Unhandled Application Error:', err);
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    if (err.name === 'ValidationError') {
        statusCode = 400;
        const errors = Object.values(err.errors).map((el) => el.message);
        message = `Invalid input: ${errors.join(', ')}`;
    }
    else if (err.code === 11000) {
        statusCode = 409;
        const field = Object.keys(err.keyValue || {})[0] || 'resource';
        message = `Duplicate value error: ${field} already exists.`;
    }
    else if (err.name === 'CastError') {
        statusCode = 400;
        message = `Invalid ID format for ${err.path}: ${err.value}`;
    }
    res.status(statusCode).json({
        success: false,
        message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    });
};
exports.errorHandler = errorHandler;
