// Config-JSON laden
import config from "../config/config.json"

import http from "http"
import url from "url"

import { Listener } from "./listener"

let clients = []

// Prozess einrichten
process.stdin.resume()
process.stdin.setEncoding("utf8")

http.createServer((req, res) => {

    let mount = url.parse(req.url).pathname

    res.writeHead(200, {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked"
    })

    let client = new Listener(config, res, mount)
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

    client.on("close", () => {
        removeClient(client)
    })

    console.log("Client connected -> streaming")

}).listen(config.server.port, () => {
    console.log("> Server listening on port " + config.server.port)
})

function removeClient(client) {

    client.remove()

    clients = clients.filter((myclient) => {
        if (myclient !== client) return myclient
    })

    client = null

    console.log("Client disconnected")
}


// Auf Eingaben von der Konsole reagieren. Im Moment ist folgendes implementiert: quit | info
process.stdin.on("data", (text) => {
    //logger.info('received data:', util.inspect(text));
    switch (text) {

        case "quit\n":
            process.exit()
            break

        case "info\n":
            console.log(`Clients insgesamt: ${clients.length}`)
            break

        case "meta\n":
            for (let client of clients) {
                console.log(`Client: ${client.mount} Meta: ${client.getMeta().timestamp} ${client.getMeta().data}`)
            }
            break
    }

})
