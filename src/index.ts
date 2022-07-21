import { app } from './Api';
import http from 'http';

const port = Number(process.env.PORT) || 3001;

const server = http.createServer(app);

server.listen(port, () => console.log('server running on port ' + port));

export { server };
