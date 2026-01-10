import { SMTPServer } from "smtp-server";
import { simpleParser } from "mailparser";
import { supabase } from './db.js';

import express from 'express';

const app = express();
app.use(express.json());


app.get('/mails', (req,res) => {
    supabase.from('mails').select('id, sender, receiver, header').then(({data, error}) => {
        if (error) {
            res.status(500).json({ error: error.message });
        } else {
            const content = data.map(mail => `
                <div>
                    <h3>${mail.header}</h3>
                    <p>From: ${mail.sender}</p>
                    <p>To: ${mail.receiver}</p>
                    <a href="/${mail.id}">View Mail</a>
                </div>
            `);
            res.contentType('text/html');
            res.send(content.sort().join(''));
        }
    });
})


app.get('/:id', (req, res) => {
    const id = req.params.id;
    supabase.from('mails').select('*').eq('id', id).then(({ data, error }) => {
        if (error) {
            res.status(500).json({ error: error.message });
        } else if (data.length === 0) {
            res.status(404).json({ error: 'Mail not found' });
        } else {
            return res.contentType('text/html').send(`
                <div>
                    <h2>${data[0].header}</h2>
                    <p>From: ${data[0].sender}</p>
                    <p>To: ${data[0].receiver}</p>
                    <div>${data[0].body}</div>
                </div>
            `);
        }
    });
});



const server = new SMTPServer(
    {
        authOptional: true,
        onConnect(session, callback) {
            console.log("Client connected:", session.remoteAddress);
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

app.listen(80, () => {
    console.log('Express server listening on port 80');
});