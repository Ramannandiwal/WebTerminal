import * as pty from 'node-pty';
import { Request, Response } from 'express';
import { WebSocketServer } from 'ws';
import server from '..';

export const startHandler = async (req: Request, res: Response) => {
    try {
      
        res.status(200).json({ message: "WebSocket server started successfully" });
    } catch (error) {
        console.error("Error in startHandler:", error);
        res.status(500).json({ error: "An error occurred while starting the WebSocket server." });
    }
};
