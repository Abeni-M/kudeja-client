const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // Standard configuration for testing
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_APP_PASSWORD,
    },
  });
};

const sendOrderReceipt = async (userEmail, orderDetails) => {
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
      console.warn('Email credentials not set. Skipping receipt email.');
      return false;
    }

    const transporter = createTransporter();

    // Constructing the item list HTML
    const itemsHtml = orderDetails.items.map(item => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #ddd;">ETB ${item.priceNumber ? (item.priceNumber * item.quantity).toFixed(2) : 'N/A'}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: `"Kudeja Trading" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: `Order Confirmation - #${String(orderDetails.id).slice(0, 8)}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px;">
          <h2 style="color: #4a6ee0; text-align: center;">Thank you for your order!</h2>
          <p style="font-size: 16px; color: #333;">Your order has been successfully placed at Kudeja Trading and is currently marked as <strong>${orderDetails.status}</strong>.</p>
          
          <div style="background-color: white; padding: 20px; border-radius: 5px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <h3 style="border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Order Summary</h3>
            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
              <thead>
                <tr style="background-color: #f5f5f5;">
                  <th style="text-align: left; padding: 10px;">Item</th>
                  <th style="text-align: left; padding: 10px;">Qty</th>
                  <th style="text-align: left; padding: 10px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>
            
            <div style="margin-top: 20px; text-align: right; font-size: 18px;">
              <strong>Total: ETB ${orderDetails.total.toFixed(2)}</strong>
            </div>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 5px; margin-top: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <h3 style="border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">Shipping Details</h3>
            <p><strong>Method:</strong> ${orderDetails.paymentMethod}</p>
            <p><strong>Address:</strong> ${orderDetails.shippingAddress?.addressLine1 || 'N/A'}, ${orderDetails.shippingAddress?.city || ''}</p>
          </div>
          
          <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #888;">
            © ${new Date().getFullYear()} Kudeja Trading. All rights reserved.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Receipt sent to ${userEmail}`);
    return true;
  } catch (error) {
    console.error('Email sending failed:', error);
    return false;
  }
};

const sendAdminAlert = async (orderDetails) => {
    try {
      if (!process.env.EMAIL_USER || !process.env.EMAIL_APP_PASSWORD) {
        return false;
      }
      
      const adminEmail = process.env.ADMIN_EMAIL || process.env.EMAIL_USER; // Fallback to sender
      const transporter = createTransporter();
      
      const mailOptions = {
        from: `"Kudeja System" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: `🔔 NEW ORDER RECEIVED - #${String(orderDetails.id).slice(0, 8)}`,
        text: `A new order has been placed on the platform totaling ETB ${orderDetails.total.toFixed(2)}. Please check the admin dashboard for details. \n\nPayment Method: ${orderDetails.paymentMethod}`,
      };
      
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Admin alert failed:', error);
      return false;
    }
  };

module.exports = { sendOrderReceipt, sendAdminAlert };
