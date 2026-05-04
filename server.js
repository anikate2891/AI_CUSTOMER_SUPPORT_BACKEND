import { createServer } from 'http';
import app from './src/app.js';
import {initSocketServer} from "./src/socketio/socketio.js"

const PORT = 8000;

const httpServer = createServer(app);

initSocketServer(httpServer);

httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});