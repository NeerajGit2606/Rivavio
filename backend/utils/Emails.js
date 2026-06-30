const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

exports.sendMail = async(receiverEmail,subject,body) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: receiverEmail,
      subject: subject,
      html: body
    });
  } catch (error) {
    // Email failures should not crash the request that triggered them
    console.log('Email send failed:', error.message);
  }
};
