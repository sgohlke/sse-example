/* eslint-disable @typescript-eslint/naming-convention */
// import { Server } from 'socket.io'
import express, {Response} from 'express'
import cors from 'cors'
import bodyParser from 'body-parser'

const app = express()
app.use(cors())
app.use(bodyParser.text())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))

const messages: Array<string> = ['first message']
let clients: Array<{
    id: number,
    response:Response
}> = []

app.get('/messages', (request, response) => {
    const headers = {
        'Content-Type': 'text/event-stream',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache'
    }
    response.writeHead(200, headers)
    
    const data = `data: ${JSON.stringify(messages)}\n\n`
    
    response.write(data)
    
    const clientId = Date.now()
    
    const newClient = {
        id: clientId,
        response
    }
    
    clients.push(newClient)
    
    request.on('close', () => {
        console.log(`${clientId} Connection closed`)
        clients = clients.filter(client => client.id !== clientId)
    })
})

app.post('/submitMessage', (request, response) => {
    addNewMessage(request.body)
    response.json(request.body)
    
})

app.get('/', (_request, response) => {
    // eslint-disable-next-line unicorn/prefer-module
    response.sendFile(__dirname + '/index.html')
})

app.listen(3000, () => {
    console.log('listening on localhost:3000')
})

function sendEventsToAll(newMessage: string): void {
    for (const client of clients) client.response.write(`data: ${JSON.stringify(newMessage)}\n\n`)
}

function addNewMessage(newMessage: string): void {
    messages.push(newMessage)
    sendEventsToAll(newMessage)
}

setInterval(function() { 
    addNewMessage(`New Message on ${new Date()}`)
}, 5000)

setInterval(function() { 
    // Send all messages to all clients
    for (const client of clients) client.response.write(`data: ${JSON.stringify(messages)}\n\n`)
}, 20_000)