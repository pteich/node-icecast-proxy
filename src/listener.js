import icecast from "icy"
import { Emitter } from "emmett"
import * as functions from "./functions"

export class Listener extends Emitter {

    constructor(config, clientreq, clientres, parsedUrl) {

        super()

        this.config = config
        this.clientres = clientres
        this.mount = parsedUrl.pathname
        this.url = parsedUrl.path
        this.meta = {}
        this.remoteAddress = functions.getRemoteAddress(clientreq.connection.remoteAddress)

        clientreq.socket.setNoDelay()

        this.connectIcecast(parsedUrl.path)
    }

    connectIcecast(url) {

        let options = {
            "hostname": this.config.upstream.host,
            "port": this.config.upstream.port,
            "path": url,
            "method": "GET",
            "headers": {
                "X-Forwarded-For": this.remoteAddress,
                "User-Agent": this.userAgent ? this.userAgent : "Node StreamProxy",
                "Referrer": this.referrer ? this.referrer : ""
            },
            "agent": false
        }

        try {
            this.icecastreq = icecast.request(options, (res) => {

                this.icecastres = res

                if (res.headers["icy-metaint"] || res.headers["icy-name"]) {

                    this.connectStart = new Date()

                    this.clientres.writeHead(200, {
                        "Content-Type": res.headers["content-type"],
                        "Cache-control": "no-cache, no-store",
                        "Pragma": "no-cache",
                        "Expires": "Mon, 26 Jul 1997 05:00:00 GMT",
                        "Accept-Ranges": "none"
                    })

                    // receiving data from Icecast event
                    res.on("data", (data) => {
                        this.clientres.write(data)
                    })

                    // changing metadata event
                    res.on("metadata", (metadata) => {
                        this.setMeta(icecast.parse(metadata).StreamTitle)
                    })

                    res.on("close", () => {
                        this.emit("close")
                    })

                    res.on("error", () => {
                        this.emit("close")
                    })

                } else {
                    this.clientres.writeHead(404)
                    this.clientres.end()
                    this.emit("close")
                }

            })

            this.icecastreq.on("error", (err) => {
                console.log(`Error connecting ${url} auf ${this.config.upstream.host} - ${err}`)
                this.clientres.writeHead(500)
                this.clientres.end()
                this.emit("close")            
            })

            this.icecastreq.end()

        } catch(err) {
            if (this.icecastres) {
                this.icecastres.end()
            }            
            this.clientres.writeHead(500)
            this.clientres.end()
            this.emit("close")
        }
    }

    setMeta(data) {
        this.meta = {
            timestamp: new Date(),
            data: data
        }
    }

    getMeta() {
        return this.meta
    }

    remove() {
        console.log("Remove Icecast-Connection")
        if (this.icecastres) {
            this.icecastres.removeAllListeners("data")
        }
        if (this.icecastreq) {
            this.icecastreq.destroy()
        }
    }

}

