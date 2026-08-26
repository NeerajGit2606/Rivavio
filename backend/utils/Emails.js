const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

exports.sendMail = async(receiverEmail,subject,body) => {
  try {
    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "Rivavio <noreply@rivavio.com>",
      to: receiverEmail,
      subject: subject,
      html: body
    });
    if (error) throw error;
  } catch (error) {
    // Email failures should not crash the request that triggered them
    console.log('Email send failed:', error.message);
  }
};
