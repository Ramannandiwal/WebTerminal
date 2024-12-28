import { Request, Response, Router } from "express";
import { startHandler } from "../controller/startHandler";
 const router :Router = Router();
router.get("/:id",startHandler);
export default router;