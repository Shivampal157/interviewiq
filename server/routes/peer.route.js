import express from "express";
import isAuth from "../middlewares/isAuth.js";
import {
  createPeerInterview,
  endPeerInterview,
  getPeerByCode,
  joinPeerInterview,
  myPeerInterviews,
  startPeerInterview,
  runPeerCode,
} from "../controllers/peer.controller.js";

const peerRouter = express.Router();

peerRouter.post("/create", isAuth, createPeerInterview);
peerRouter.get("/mine", isAuth, myPeerInterviews);
peerRouter.get("/:code", isAuth, getPeerByCode);
peerRouter.post("/:code/join", isAuth, joinPeerInterview);
peerRouter.post("/:code/start", isAuth, startPeerInterview);
peerRouter.post("/:code/end", isAuth, endPeerInterview);
peerRouter.post("/:code/run", isAuth, runPeerCode);

export default peerRouter;
