const nodemailer = require('nodemailer');

// eslint-disable-next-line require-jsdoc
function sendEmail(message) {
  return new Promise((res, rej) => {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GOOGLE_USER,
        pass: process.env.GOOGLE_PASSWORD,
      },
    });

    transporter.sendMail(message, function(err, info) {
      if (err) {
        rej(err);
      } else {
        res(info);
      }
    });
  });
}

exports.sendConfirmationEmail = function(Email, Username, id, Role) {
  const message = {
    from: process.env.GOOGLE_USER,
    to: Email,
    subject: 'Darri - Activate Account',
    html: `

        <h1>Darri</h1>
      <h3> Hello ${Username} </h3>
      <p>Thank you for registering into our Application. 
      Much Appreciated! Just one last step is laying ahead of you...</p>
      <p>To activate your account please follow
       this link: 
       <a target="_" 
       href="${process.env.DOMAIN}/users/ActivateAccount/${id}/${Role}">
        Activate </a></p>
      <p>Cheers</p>
      <p>Darri Team</p>
    `,
  };
  return sendEmail(message);
};

exports.sendResetPasswordEmail = (Email, Username, id, code) => {
  const message = {
    from: process.env.GOOGLE_USER,
    to: Email,
    subject: 'Darri - Reset Password',
    html: `
      <h3>Hello ${Username} </h3>
      <p>You reset Code : <strong>${code}</strong></p>
      <p>To reset your password 
      please follow this link: <a target="_"
       href="${process.env.DOMAIN_REACT}/ResetNewPassword?id=${id}">Reset 
       Password Link</a></p>
      <p>Cheers,</p>
      <p>Darri Team</p>
    `,
  };

  return sendEmail(message);
};

exports.paymentDetailsEmail = (
    Email,
    Username,
    amount,
    nameOnCard,
    cardNumber,
) => {
  const message = {
    from: process.env.GOOGLE_USER,
    to: Email,
    subject: 'Darri - Payment ',
    html: `
      <h3>Hello ${Username} </h3>
      <p>Your payment was successful <strong> you paid ${
  amount / 100
} TND</strong></p>
      <p>With this Card :</p>
      <p>Name On Card :
       ${nameOnCard} Card Number : **** **** **** ${cardNumber}</p>
      <p>Cheers,</p>
      <p>Darri Team</p>
    `,
  };

  return sendEmail(message);
};

exports.contactUsEmail = (Email, Username, Subject, Message) => {
  const message = {
    from: Email,
    to: process.env.GOOGLE_USER,
    subject: Subject,
    html: `
      <h3>From ${Username} </h3>
      <p>${Message}</p>
    `,
  };

  return sendEmail(message);
};
