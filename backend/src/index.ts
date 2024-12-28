import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { createServer } from 'http';
import * as pty from 'node-pty';
import { Server } from 'socket.io';

const app: Application = express();
const server = createServer(app); // Create HTTP server
const PORT: number = parseInt(process.env.PORT || '3000');
const io = new Server(server, { cors: { origin: "*" } });

app.use(bodyParser.json());
app.use(cors({
    origin: '*',
    methods: "POST",
}));

// Health check route
app.get("/", (req: Request, res: Response) => {
    console.log("Health check endpoint hit");
    res.status(200).json({ message: "Health Route is working fine" });
});

interface dataType {
    data: string;
}

// Socket.io connection
io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    const ptyProcess = pty.spawn('bash', [], {
        name: 'xterm-color',
        cols: 80,
        rows: 30,
        cwd: process.cwd(),
        env: process.env,
    });
   

    // Listen for input from client
    socket.on('terminal:data', (data: dataType) => {
      
        ptyProcess.write(`${data.data}`); // Append newline for command execution
    });

    // Send terminal output to client
    ptyProcess.onData((data) => {
     
        socket.emit("data:terminal", data); // Send back terminal output
    });

   
    socket.on("disconnect", () => {
        console.log(`Client disconnected: ${socket.id}`);
        ptyProcess.kill(); // Clean up terminal process
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
});

export default server;
