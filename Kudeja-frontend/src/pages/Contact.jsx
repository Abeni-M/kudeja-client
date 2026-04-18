import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import emailjs from '@emailjs/browser';
import { sendMessage } from '../services/messageService';
import { useAuth } from '../context/AuthContext';
import SEO from '../components/SEO';
import './Contact.css';

const Contact = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    message: ''
  });

  // Automatically update form fields if user logs in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || prev.name,
        email: user.email || prev.email
      }));
    }
  }, [user]);
  const [submitted, setSubmitted] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. Save to database
      try {
        await sendMessage(formData);
      } catch (dbErr) {
        console.error('Database Error:', dbErr);
        throw new Error(dbErr?.response?.data?.message || 'Failed to save message to database');
      }

      // 2. Send email via EmailJS
      try {
        const templateParams = {
          from_name: formData.name,
          from_email: formData.email,
          message: formData.message,
          reply_to: formData.email, // This allows you to reply directly via Gmail
          to_name: 'Kudeja Admin', 
        };

        await emailjs.send(
          import.meta.env.VITE_EMAILJS_SERVICE_ID,
          import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
          templateParams,
          import.meta.env.VITE_EMAILJS_PUBLIC_KEY
        );
      } catch (emailErr) {
        console.error('EmailJS Error:', emailErr);
        // We don't necessarily want to fail the whole process if only the email fails, 
        // but since the user wants it "directly to email", we should notify them.
        throw new Error('Message saved to DB, but failed to send email. Check your Template ID.');
      }

      setSubmitted(true);
      toast.success('Message sent successfully to our team!');
    } catch (err) {
      console.error('Error sending message:', err);
      toast.error(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
      <SEO 
        title="Contact Us" 
        description="Get in touch with Kudeja Trading for inquiries about computers, security machines, and general trading services."
      />
      <div className="container">
        <h1 className="page-title">Contact Us</h1>
        <div className="contact-grid">
          <div className="contact-info">
            <h3>Get in Touch</h3>
            <p>
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
            <div className="info-item">
              <strong>📍 Address:</strong>
              <p>Bole Sub-city, Addis Ababa, Ethiopia</p>
            </div>
            <div className="info-item">
              <strong>📞 Phone:</strong>
              <p>+251 911 43 0926</p>
            </div>
            <div className="info-item">
              <strong>✉️ Email:</strong>
              <p>tojiksa@gmail.com</p>
            </div>
            <div className="info-item">
              <strong>🕒 Business Hours:</strong>
              <p>Monday - saturday: 8:00 AM - 6:00 PM</p>
            </div>
          </div>
          <div className="contact-form-container">
            {submitted ? (
              <div className="success-message">
                <h3>Thank You!</h3>
                <p>Your message has been sent. We'll get back to you soon.</p>
                <button onClick={() => setSubmitted(false)} className="btn-primary">
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="contact-form">
                <div className="form-group">
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Your name"
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="Your email"
                  />
                </div>
                <div className="form-group">
                  <label>Message</label>
                  <textarea
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    placeholder="Your message"
                    rows="5"
                  ></textarea>
                </div>
                <button type="submit" disabled={isSubmitting} className="btn-primary">
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;