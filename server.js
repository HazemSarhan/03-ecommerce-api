import dotenv from 'dotenv';
dotenv.config();
import session from 'express-session';
import passport from 'passport';
import express from 'express';
const app = express();

import './configs/oAuthConfig.js';

// Rest of packages
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';

// Middlewares
import notFoundMiddleware from './middleware/not-found.js';
import errorHandlerMiddleware from './middleware/error-handler.js';

// SwaggerUI Docs
import swaggerUI from 'swagger-ui-express';
import yaml from 'yamljs';
const swaggerDocument = yaml.load('./swagger.yaml');

// Routes
import authRoutes from './routes/auth.routes.js';
import categoryRoutes from './routes/category.routes.js';
import productRoutes from './routes/product.routes.js';
import reviewRoutes from './routes/review.routes.js';
import orderRoutes from './routes/order.routes.js';
import userRoutes from './routes/user.routes.js';

// oAuth
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
  })
);
app.use(passport.initialize());
app.use(passport.session());

app.use(express.json());
app.use(cors());
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}
app.use(cookieParser(process.env.JWT_SECRET));
app.use(
  fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp',
  })
);

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/category', categoryRoutes);
app.use('/api/v1/product', productRoutes);
app.use('/api/v1/review', reviewRoutes);
app.use('/api/v1/order', orderRoutes);
app.use('/api/v1/user', userRoutes);

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.get('/', (req, res) => {
  res.send(
    '<h1>Ecommerce API</h1><p>Documentation <a href="/api-docs">here</a></p> <p>Google OAuth <a href="/api/v1/auth/google">here</a></p>'
  );
});
app.use(notFoundMiddleware);
app.use(errorHandlerMiddleware);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
  });
};

startServer();
