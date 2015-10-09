import http from "http"
import url from "url"

import { Listener } from "./listener"

let clients = []

http.createServer((req, res) => {

    let mount = url.parse(req.url).pathname

    res.writeHead(200, {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked"
    })

    let client = new Listener(res, mount)
    clients.push(client)

    // Add the response to the clients array to receive streaming
    res.connection.on("close", () => {
        removeClient(client)
    })
    res.connection.on("error", () => {
        removeClient(client)
    })
    res.connection.on("timeout", () => {
        removeClient(client)
    })

    console.log("Client connected -> streaming")

}).listen(9000, () => {
    console.log("Server listening")
})

function removeClient(client) {

    client.remove()

    clients = clients.filter((myclient) => {
        if (myclient !== client) return myclient
    })

    client = null

    console.log("Client disconnected")
}
