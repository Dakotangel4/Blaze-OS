import { Router, type IRouter } from "express";
import healthRouter from "./health";
import dashboardRouter from "./dashboard";
import tradesRouter from "./trades";
import clientsRouter from "./clients";
import notesRouter from "./notes";
import calendarRouter from "./calendar";
import financesRouter from "./finances";

const router: IRouter = Router();

router.use(healthRouter);
router.use(dashboardRouter);
router.use(tradesRouter);
router.use(clientsRouter);
router.use(notesRouter);
router.use(calendarRouter);
router.use(financesRouter);

export default router;
