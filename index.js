const { SMTPServer } = require("smtp-server");

const server = new SMTPServer(
    {
        authOptional: true,
        onConnect(session, callback) {
            console.log("Client connected:", session.remoteAddress);
            callback(); // Accept the connection
        },
        onMailFrom(address, session, callback) {
            console.log("Mail from:", address.address);
            callback(); // Accept the sender
        },
        onRcptTo(address, session, callback) {
            console.log("Recipient to:", address.address);
            callback(); // Accept the recipient
        },
        onData(stream, session, callback) {
            let message = "";
            stream.on("data", (chunk) => {
                message += chunk.toString();
            });
            stream.on("end", () => {
                console.log("Received message:", message);
                callback(); // Accept the data
            });
        }
    }
);

server.listen(25, () => {
    console.log("SMTP Server is listening on port 25");
});