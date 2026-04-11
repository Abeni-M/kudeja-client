import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { sendMessage } from '../services/messageService';
import { useAuth } from '../context/AuthContext';
import './Contact.css';

const Contact = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await sendMessage(formData);
      setSubmitted(true);
      toast.success('Message sent successfully!');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to send message');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contact-page">
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