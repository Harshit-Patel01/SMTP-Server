const { SMTPServer } = require("smtp-server");
const { simpleParser } = require("mailparser");


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
            simpleParser(stream)
                .then(parsed => {
                    console.log("From:", parsed.from.text);
                    console.log("To:", parsed.to.text);
                    console.log("Subject:", parsed.subject);
                    console.log("Body:", parsed.html);
                    callback(); // Accept the data
                })
                .catch(err => {
                    console.error("Error parsing email:", err);
                    callback(err); // Reject the data
                });
            
        }
    }
);

server.listen(25, () => {
    console.log("SMTP Server is listening on port 25");
});