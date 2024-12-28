import React, { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css"; // Import xterm's CSS for styling
import { io } from "socket.io-client";

const Terminal = (): JSX.Element => {
  const terminalRef = useRef<HTMLDivElement>(null); // Reference to the terminal container
  const terminalInstance = useRef<XTerm | null>(null); // Store terminal instance
  const socket = useRef(io("http://localhost:4000")); // Socket connection

  // Function to handle terminal data reception from the server
  const fetchTerminalData = () => {
    socket.current.emit("request:terminalData"); // Emit request to fetch terminal data
  };

  useEffect(() => {
    if (terminalRef.current && !terminalInstance.current) {
      const terminal = new XTerm(); // Create a new terminal instance
      terminalInstance.current = terminal;
      terminal.open(terminalRef.current); // Mount terminal to the DOM

      // Handle keypress events
      terminal.onKey(({ key }) => {
        socket.current.emit("terminal:data", { data: key });
      });

      // Listen for terminal output from the backend
      socket.current.on("data:terminal", (data: string) => {
        terminal.write(data);
      });

      // Fetch terminal data on component mount or every render
      fetchTerminalData();

      // Cleanup socket connection and terminal instance on unmount
      return () => {
        socket.current.disconnect();
        terminalInstance.current?.dispose(); // Properly dispose of the terminal
        terminalInstance.current = null;
      };
    }
  }, []); // Empty dependency array ensures this runs only once when the component mounts

  return (
    <div className="border-4 bg-yellow-100 rounded-2xl overflow-hidden">
      <div
        ref={terminalRef}
        className=" w-[50%] m-3 p-3 rounded-3xl" // Ensuring no overflow on parent container
        style={{ backgroundColor: "#1e1e1e", overflow: "hidden" }} // Removing unnecessary scrolling
      />
    </div>
  );
};

export default Terminal;
