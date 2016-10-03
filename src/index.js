// load config
import config from "../config/config.json"

import http from "http"
import url from "url"
import util from "util"

import { Listener } from "./listener"
import * as functions from "./functions"

let clients = []

// Prozess einrichten
process.stdin.resume()
process.stdin.setEncoding("utf8")

/*
var posix = require("posix")
posix.setrlimit("nofile", { soft: 10000, hard: 10000 })
*/

http.createServer((req, res) => {

    // we only respond to GET requests, discard any others
    if (req.method !== "GET") {

            res.writeHead(405, {
                "Content-Type": "text/plain"
            })
            res.end("method not allowed")

    } else {

        let parsedUrl = url.parse(req.url)

        res.useChunkedEncodingByDefault = false

        switch (parsedUrl.pathname) {

            // simple stats API
            case "/stats/clients": {
                statsHandler(res)
                break
            }
            default: {
                // Add the response to the clients array to receive streaming                
                let client = new Listener(config, req, res, parsedUrl)
                clients.push(client)

                res.on("error", () => removeClient(client))
                req.on("error", () => removeClient(client))

                if (res.connection) {
                    res.connection.once("close", () => removeClient(client))
                    res.connection.once("timeout", () => removeClient(client))
                }

                client.once("close", () => removeClient(client))

                console.log(`Client ${req.connection.remoteAddress} connected -> streaming ${parsedUrl.pathname}`)
            }
        }
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

setInterval(() => {
    global.gc()
},config.gcinterval*1000)

// Auf Eingaben von der Konsole reagieren. Im Moment ist folgendes implementiert: quit | info
process.stdin.on("data", (text) => {
    //logger.info('received data:', util.inspect(text));
    switch (text) {

        case "quit\n": {       
            process.exit()
        }
        case "info\n": {
            console.log(`Clients insgesamt: ${clients.length}`)
            break
        }
        case "memory\n": {
            console.log(util.inspect(process.memoryUsage()))
            break
        }
        case "meta\n": {
            for (let client of clients) {
                console.log(`Client:${functions.getRemoteAddress(client.remoteAddress)} ${client.mount} Meta: ${client.getMeta().timestamp} ${client.getMeta().data}`)
            }
            break
        }
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

