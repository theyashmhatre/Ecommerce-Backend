const PORT = process.env.PORT || 4000;

module.exports = {

  confirm: id => ({
    subject: 'Confirmation Email',
    html: `
    <h1 align="center">Welcome to URL Shortner</h1>
      <a href='http://localhost:4000/confirm/${id}'>
        Click here to verify your account
      </a>
    `,
    text: `Copy and paste this link: http://localhost:4000/confirm/${id}`
  }),

  verified: () => ({
    subject: 'Your account has been verified!',
    html: `
    <h2 align="center">Welcome to URL Shortner</h2>
      <a href="http://localhost:4000" style="text-align:center">Visit URL Shortner</a>
    `,
    text: `Copy and paste this link: http://localhost:4000`
  }),

  deleted: () => ({
    subject: 'Your account has been successfully deleted!',
    html: `
    <h1 align="center">We'll miss you!</h1>
    <p>Account successfully deleted</p><br>
    <p>Regards,<br>URL Shortner Team</p>
      <a href="http://localhost:4000" align="left">URL Shortner</a>
    `,
    text: `Copy and paste this link: http://localhost:4000`
  }),

  passwordResetLink: (id, token) => ({
    subject: 'URL Shortner Password Reset',
    html: `
    <h1 align="center">Reset Password</h1>
      <a href='http://localhost:4000/password/reset/${id}/${token}'>
        Click here to reset your password
      </a>
    `,
    text: `Copy and paste this link: http://localhost:4000/password/reset/${id}/${token}`
  }),

  passwordResetDone: () => ({
    subject: 'Your password has been reset successfully!',
    html: `
    <h2 align="center">Password Reset Successful</h2>
      <a href="http://localhost:4000" style="text-align:center">Visit Site</a>
    `,
    text: `Copy and paste this link: http://localhost:4000`
  }),

  orderSuccessful: (paymentID, amount_paid) => ({
    subject: 'Your order with Order ID ' + paymentID + ' is successfull',
    html: `
    <h2 align="center">Order Successfull</h2>
      <a href="https://site-name" style="text-align:center">Visit URL Shortner</a>
    `,
    text: `Copy and paste this link: https://site-name`
  })

};
