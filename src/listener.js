import icecast from "icy"

export class Listener {

    constructor(clientres, mount) {

        this.IcecastHost = "http://www.hoerradar.de"
        this.clientres = clientres

        this.clientres.writeHead(200, {
            "Content-Type": "audio/mpeg",
            "Transfer-Encoding": "chunked"
        })

        this.connectIcecast(mount)
    }

    connectIcecast(mount) {
        this.icecastreq = icecast.get(this.IcecastHost + mount, (res) => {

            // receiving data from Icecast event
            res.on("data", (data) => {
                this.clientres.write(data)
            })

            // changing metadata event
            res.on("metadata", (metadata) => {
                this.setMeta(icecast.parse(metadata).StreamTitle)
            })

            res.on("close", () => {
                // TODO Handle disconnect of Icecast source
            })

        })
    }

    setMeta(data) {
        this.meta = data
    }

    remove() {
        console.log("Remove Icecast-Connection")
        this.icecastreq.end()
    }

}

