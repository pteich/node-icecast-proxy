// Config-JSON laden
import config from "../config/config.json"

import http from "http"
import url from "url"
import util from "util"

import { Listener } from "./listener"

let clients = []

// Prozess einrichten
process.stdin.resume()
process.stdin.setEncoding("utf8")

/*
var posix = require("posix")
posix.setrlimit("nofile", { soft: 10000 })
*/

http.createServer((req, res) => {

    let parsedUrl = url.parse(req.url)

    switch (parsedUrl.pathname) {

    case "/stats/clients":
        statsHandler(res)
        break

    default:
        let client = new Listener(config, req, res, parsedUrl)
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

        console.log(`Client ${req.connection.remoteAddress} connected -> streaming ${parsedUrl.pathname}`)
    }

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

    case "memory\n":
        console.log(util.inspect(process.memoryUsage()))
        break

    case "meta\n":
        for (let client of clients) {
            console.log(`Client:${client.remoteAddress} ${client.mount} Meta: ${client.getMeta().timestamp} ${client.getMeta().data}`)
        }
        break
    }

})

function statsHandler(res) {
    res.writeHead(200, {
        "Content-Type": "application/json"
    })

    let stats = []
    let now = new Date()

    for (let client of clients) {
        stats.push({
            ip: client.remoteAddress,
            mount: client.mount,
            url: client.url,
            start: client.connectStart,
            duration: now-client.connectStart,
            meta: client.getMeta()
        })
    }
    res.end(JSON.stringify(stats))
}
