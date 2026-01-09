import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";
import { supabase } from './db.js';

const server = new SMTPServer(
    {
        authOptional: true,
        onConnect(session, callback) {
            console.log("Client connected:", session.remoteAddress);
            callback();
        },
        onMailFrom(address, session, callback) {
            console.log("Mail from:", address.address);
            callback();
        },
        onRcptTo(address, session, callback) {
            console.log("Recipient to:", address.address);
            callback();
        },
        onData(stream, session, callback) {
            simpleParser(stream)
                .then(async parsed => {
                    console.log("From:", parsed.from.text);
                    console.log("To:", parsed.to.text);
                    console.log("Subject:", parsed.subject || 'No Subject');
                    console.log("Body:", parsed.html || parsed.text || 'No Body');
                    
                    const { error } = await supabase.from('mails').insert([
                        {
                            sender: parsed.from.text, 
                            receiver: parsed.to.text,
                            header: parsed.subject || 'No Subject',
                            body: parsed.html || parsed.text || 'No Body'
                        }
                    ]);
                    
                    if (error) {
                        console.error("Error saving email to database:", error);
                        callback(error);
                    } else {
                        console.log("Email saved to database");
                        callback();
                    }
                })
                .catch(err => {
                    console.error("Error parsing email:", err);
                    callback(err);
                });
        }
    }
);

server.listen(25, () => {
    console.log("SMTP Server is listening on port 25");
});