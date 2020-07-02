const nodemailer = require('nodemailer');
const ejs = require('ejs');
const htmlToText = require('html-to-text');

module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.firstname;
    this.url = url;
    this.from = `${process.env.EMAIL_FROM}`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      //sendgrid transporter
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }

    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  //send email
  async send(template, subject) {
    //render email template
    let temp;
    const emailHTML = ejs.renderFile(
      `${__dirname}/../views/emails/${template}.ejs`,
      {
        firstName: this.firstName,
        url: this.url,
        subject,
      },
      (err, html) => {
        if (err) console.log(err);
        //console.log(html);
        temp = html;
      }
    );
    //define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html: temp,
      text: htmlToText.fromString(temp),
    };

    //create transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send('welcome', 'Welcome to the tweetPlug family');
  }
};
