import express from 'express';
import { PrismaClient } from '@prisma/client';
import { enhance } from '@zenstackhq/runtime';
import { ZenStackMiddleware } from '@zenstackhq/server/express';
import RestApiHandler from '@zenstackhq/server/api/rest';

const prisma = new PrismaClient();
const app = express();

app.use(express.json());



function getSessionUser(request: express.Request) {    
    // This is a placeholder for your auth solution
    return {
        id: "",
    };
}

const handler = RestApiHandler({ endpoint: 'http://localhost:3000/api' });

app.use('/api/models', ZenStackMiddleware({ 
    // switch for authentication
    getPrisma: (request: express.Request) => enhance(prisma, { user: getSessionUser(request) }),
    // getPrisma: () => prisma,
    handler: handler 
}));

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
