import icecast from "icy"
import { Emitter } from "emmett"

export class Listener extends Emitter {

    constructor(config, clientres, mount) {

        super()

        this.IcecastHost = config.upstream.host
        this.clientres = clientres
        this.mount = mount
        this.meta = {}

        this.connectIcecast(this.mount)
    }

    connectIcecast(mount) {
        this.icecastreq = icecast.get(this.IcecastHost + mount, (res) => {

            if (res.headers["icy-url"]) {

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

            } else {
                this.clientres.writeHead(404)
                this.clientres.end()
                this.emit("close")
            }

        })
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
        this.icecastreq.end()
    }

}

