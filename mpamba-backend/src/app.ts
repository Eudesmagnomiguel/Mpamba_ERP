import cors from 'cors';
import express from 'express';
import roleRoutes from './routes/core/role.routes.js';
import planRoutes from './routes/core/plan.routes.js';
import userRoutes from './routes/core/user.routes.js';
import { swaggerDocs } from './config/swagger.config.js';
import { authRoutes } from './routes/core/auth.routes.js';
import moduleRoutes from './routes/core/module.routes.js';
import stockRoutes from './routes/module/stock/index.js';
import billingRoutes from './routes/module/billing/index.js';
import treasuryRoutes from './routes/module/treasury/index.js';
import permissionRoutes from './routes/core/permission.routes.js';
import subscriptionRoutes from './routes/core/subscription.routes.js';
import subscriptionRequestRoutes from './routes/core/subscription-request.routes.js';
import organizationRoutes from './routes/module/organization.routes.js';
import dashboardRoutes from './routes/core/dashboard.routes.js';
import notificationRoutes from './routes/core/notification.routes.js';
import accountingRoutes from './routes/module/accounting/index.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", async (req, res) => {
    res.json({ status: "OK", message: "Mpamba API is running perfectly! 🚀" });
});

// API Routes Wrapper
const apiRouter = express.Router();

// Auth Routes
apiRouter.use("/auth", authRoutes);

// User Routes
apiRouter.use("/users", userRoutes);

// Permission Routes
apiRouter.use("/permissions", permissionRoutes);

// Role Routes
apiRouter.use("/roles", roleRoutes);

// Plan Routes
apiRouter.use("/plans", planRoutes);

// Module Routes
apiRouter.use("/modules", moduleRoutes);

// Organization Routes
apiRouter.use('/organizations', organizationRoutes);

// Stock Routes
apiRouter.use('/stock', stockRoutes);

// Billing Routes
apiRouter.use('/billing', billingRoutes);

// Treasury Routes
apiRouter.use('/treasury', treasuryRoutes);

// Accounting Routes
apiRouter.use('/accounting', accountingRoutes);

// Subscription Routes
apiRouter.use('/subscription', subscriptionRoutes);
apiRouter.use('/subscription-requests', subscriptionRequestRoutes);

// Dashboard Routes
apiRouter.use('/dashboard', dashboardRoutes);

// Notification Routes
apiRouter.use('/notifications', notificationRoutes);

// Mount API Router
app.use("/api", apiRouter);

// Swagger Documentation
swaggerDocs(app);
app.get("/docs", (req, res) => {res.redirect("/api-docs");});

export default app;