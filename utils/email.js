const nodemailer = require('nodemailer');

const sendEmail = async options => {
    // 1- transporter
    const transporter = nodemailer.createTransport({
        //service: 'Gmail', // not recommended in services websites
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
        // Activate in gmail 'less secure app' option
    });
    
    // 2- define email options
    const mailOptions = {
        from: 'George Ibrahim <georgeibrahim213@gmail.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        // html: 
    };

    // 3- send email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;