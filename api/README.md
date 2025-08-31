# PCK Sales Visit API

A RESTful API server built with Node.js, Express, and MongoDB for managing sales visits and user authentication.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Security**: Helmet for security headers, rate limiting, CORS configuration
- **Logging**: Winston logger with different levels for development and production
- **Database**: MongoDB with Mongoose ODM
- **Validation**: Joi schema validation for request data
- **File Storage**: Services for AWS S3 and Google Cloud Storage
- **Error Handling**: Comprehensive error handling middleware

## Project Structure

```
api/
├── config/           # Configuration files
│   ├── database.js   # MongoDB connection
│   └── logger.js     # Winston logger setup
├── controllers/      # Route controllers
│   ├── authController.js
│   └── userController.js
├── middleware/       # Custom middleware
│   ├── auth.js       # Authentication middleware
│   ├── validation.js # Request validation
│   ├── requestLogger.js
│   └── errorHandler.js
├── models/           # Mongoose models
│   └── User.js
├── routers/          # Express routers
│   ├── authRoutes.js
│   └── userRoutes.js
├── services/         # External service integrations
│   ├── s3Service.js
│   └── googleStorageService.js
├── logs/            # Log files directory
├── .env.example     # Environment variables template
├── .gitignore
├── package.json
└── index.js         # Main server file
```

## Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy environment variables:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   - Database connection string
   - JWT secret
   - AWS/Google Cloud credentials (if using file storage)

5. Start MongoDB (make sure it's running on `mongodb://localhost:27001`)

6. Run the server:
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 3001 |
| `DB_HOST` | MongoDB server host | mongodb://localhost:27001 |
| `DB_NAME` | Database name | site-visit-2 |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | JWT expiration time | 7d |
| `JWT_COOKIE_EXPIRES_IN` | Cookie expiration (days) | 7 |
| `AWS_ACCESS_KEY_ID` | AWS access key | - |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | - |
| `AWS_REGION` | AWS region | ap-southeast-1 |
| `AWS_S3_BUCKET` | S3 bucket name | - |

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/logout` - Logout user
- `GET /api/v1/auth/me` - Get current user profile
- `PATCH /api/v1/auth/me` - Update current user profile
- `PATCH /api/v1/auth/change-password` - Change password

### Users (Admin only)
- `GET /api/v1/users` - Get all users
- `GET /api/v1/users/:id` - Get user by ID
- `PATCH /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user
- `PATCH /api/v1/users/:id/activate` - Activate user
- `PATCH /api/v1/users/:id/deactivate` - Deactivate user

### Health Check
- `GET /health` - API health check

## User Roles

- `admin`: Full system access
- `manager`: Management level access
- `sales`: Sales team access
- `user`: Basic user access

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **httpOnly Cookies**: Prevent XSS attacks
- **Rate Limiting**: Prevent brute force attacks
- **Helmet**: Security headers
- **CORS**: Cross-origin resource sharing configuration
- **Input Validation**: Joi schema validation
- **Password Hashing**: bcrypt with salt rounds

## Logging

The API uses Winston for logging with different levels:
- **Development**: Debug level (detailed logs)
- **Production**: Warn level (errors and warnings only)

Logs are written to:
- Console (formatted with colors)
- `logs/all.log` (all logs)
- `logs/error.log` (error logs only)

## Development

```bash
# Install dependencies
npm install

# Start in development mode (with nodemon)
npm run dev

# Run tests
npm test
```

## License

ISC
