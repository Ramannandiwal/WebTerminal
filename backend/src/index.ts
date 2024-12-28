import 'dotenv/config';
import express, { Application, Request, Response } from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import { createServer } from 'http';
import * as pty from 'node-pty';
import { Server } from 'socket.io';
import Docker from 'dockerode'; // Dockerode for interacting with Docker

const app: Application = express();
const server = createServer(app); // Create HTTP server
const PORT: number = parseInt(process.env.PORT || '3000');
const io = new Server(server, { cors: { origin: "*" } });

const docker = new Docker(); // Docker instance to interact with Docker daemon

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

interface DataType {
    data: string;
}

// Socket.io connection
io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Create a unique container for each user based on their socket.id
    const containerName = `user-container-${socket.id}`;
    
    // Create the Docker container
    docker.createContainer({
        Image: 'ubuntu:latest', // Use your preferred Docker image
        Cmd: ['bash'],
        name: containerName,
        Tty: true, // Enable TTY for interactive terminal
        Env: ['TERM=xterm-256color'], // Set the TERM variable for terminal compatibility
    }).then((container) => {
        container.start(); // Start the container

        // Create a pty (pseudo-terminal) process connected to the Docker container
        const ptyProcess = pty.spawn('docker', ['exec', '-it', containerName, 'bash'], {
            name: 'xterm-color',
            cols: 80,
            rows: 30,
            cwd: process.cwd(),
            env: process.env,
        });

        // Send terminal output to the frontend
        ptyProcess.onData((data) => {
            socket.emit("data:terminal", data); // Send terminal output back to client
        });

        // Listen for input from the client and send it to the Docker container
        socket.on('terminal:data', (data: DataType) => {
            ptyProcess.write(data.data); // Pass command data from frontend to container
        });

        // Listen for the process exit event
        ptyProcess.onExit(() => {
            console.log(`Process inside container ${containerName} exited`);
            socket.emit("data:terminal", "The terminal session has ended. Refresh the page to restart the terminal.");
        });

        // Clean up when the user disconnects
        socket.on("disconnect", () => {
            console.log(`Client disconnected: ${socket.id}`);
            // Stop and remove the Docker container associated with this user
            container.stop().then(() => {
                container.remove(); // Remove the container after stopping it
                console.log(`Docker container stopped and removed for user: ${socket.id}`);
            }).catch((err) => {
                console.error(`Error stopping or removing Docker container: ${err.message}`);
            });
            ptyProcess.kill(); // Clean up the terminal process
        });
    }).catch((err) => {
        console.error(`Error creating Docker container: ${err.message}`);
        socket.emit('data:terminal', `Error creating Docker container: ${err.message}`);
    });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server is listening on ${PORT}`);
});

export default server;
