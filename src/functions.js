import ipaddr from "ipaddr.js"

export function getRemoteAddress(ipString) {

    if (ipaddr.IPv4.isValid(ipString)) {
        return ipString
    } else if (ipaddr.IPv6.isValid(ipString)) {
        var ip = ipaddr.IPv6.parse(ipString)
        if (ip.isIPv4MappedAddress()) {
            return ip.toIPv4Address().toString()
        } else {
            return ipString
        }
    } else {
        return null
    }
}
