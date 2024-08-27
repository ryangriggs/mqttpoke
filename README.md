# mqttpoke
MQTT publisher/subscriber web app with support for binary datatypes

Most MQTT pub/sub web apps don't support native binary datatypes (signed/unsigned integer, float, boolean).  mqttpoke allows you to subscribe and publish to these topics and natively view and edit their values without needing to perform conversions or use other time-consuming tricks.

No server required: runs in modern browsers.  

[Run the app on Github Pages](https://ryangriggs.github.io/mqttpoke/)

**FIREFOX BUG: in Firefox you must change websockets configuration to use HTTP/1.1 instead of HTTP/2 or wss (mqtt) connections will fail.  See [this article](https://support.mozilla.org/en-US/questions/1324001) for details.**
- Open [about:config](about:config)
- Search for setting "network.http.http2.websockets" (or just search for "websockets")
- Change value from "True" to "False"

Datatypes supported:
- string (ascii)
- signed int16
- unsigned int16
- signed int32
- unsigned int32
- boolean
- float32

Support for additional datatypes can be added as needed.

For any questions, contact me or file an issue.
