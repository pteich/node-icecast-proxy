import icecast from "icy"
import { Emitter } from "emmett"

export class Listener extends Emitter {

    constructor(config, clientreq, clientres, parsedUrl) {

        super()

        this.config = config
        this.clientres = clientres
        this.mount = parsedUrl.pathname
        this.url = parsedUrl.path
        this.meta = {}
        this.remoteAddress = clientreq.connection.remoteAddress

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
                "X-Forwarded-For": this.remoteAddress
            },
            "agent": false
        }

        this.icecastreq = icecast.request(options, (res) => {

            this.icecastres = res

            if (res.headers["icy-url"]) {

                this.connectStart = new Date()

                this.clientres.writeHead(200, {
                    "Content-Type": "audio/mpeg",
                    "Transfer-Encoding": "chunked"
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
        })

        this.icecastreq.end()
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

