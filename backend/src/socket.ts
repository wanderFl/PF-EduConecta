import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HttpServer } from "http";

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HttpServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: [
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://127.0.0.1:5173"
      ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ['polling', 'websocket']
  });

  io.on("connection", (socket: Socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // El cliente debe unirse a una sala con su userId al conectarse
    socket.on("join", (userId: string) => {
      console.log(`👤 User ${userId} joined room`);
      socket.join(userId);
    });

    socket.on("disconnect", () => {
      console.log("🔌 Socket disconnected:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO not initialized!");
  }
  return io;
};
