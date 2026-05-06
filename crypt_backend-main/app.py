# app.py - Dedicated Flask backend for handling the Contact Form (Email Service)

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
from dotenv import load_dotenv
import os
import sys

# ================================================================
# 1. INITIALIZE APP
# ================================================================
load_dotenv()
app = Flask(__name__)  # FIX: removed duplicate Flask import

CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}) 

# ================================================================
# 2. FLASK-MAIL CONFIGURATION
# ================================================================
if not os.environ.get('EMAIL_USER') or not os.environ.get('EMAIL_PASS'):
    print("FATAL ERROR: EMAIL_USER or EMAIL_PASS environment variables are NOT SET.")
    print("Please set them in your terminal before running 'python app.py'.")

app.config['MAIL_SERVER'] = 'smtp.gmail.com' 
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True

SENDER_EMAIL = os.environ.get('EMAIL_USER')
SENDER_PASS = os.environ.get('EMAIL_PASS')

app.config['MAIL_USERNAME'] = SENDER_EMAIL
app.config['MAIL_PASSWORD'] = SENDER_PASS
app.config['MAIL_DEFAULT_SENDER'] = SENDER_EMAIL

mail = Mail(app)

# ================================================================
# 3. DESTINATION EMAIL ADDRESS
# ================================================================
ADMIN_EMAIL = os.environ.get('ADMIN_EMAIL', 'diyasj109@gmail.com')

# ================================================================
# 4. CONTACT ROUTE HANDLER
# ================================================================
@app.route('/contact', methods=['POST'])
def contact():
    """Receives contact form data and sends an email to the admin."""
    try:
        data = request.get_json()

        # FIX: validate required fields before processing
        user_email = data.get('email', '').strip()
        subject = data.get('subject', '').strip()
        message_body = data.get('message', '').strip()
        wallet_address = data.get('walletAddress', 'Not Connected')

        if not user_email or not subject or not message_body:
            return jsonify({"status": "error", "message": "email, subject, and message are required."}), 400

        admin_message_body = (
            f"--- New Support Request ---\n"
            f"From: {user_email}\n"
            f"Subject: {subject}\n"
            f"Wallet Address: {wallet_address}\n"
            f"---------------------------\n\n"
            f"Message:\n{message_body}"
        )

        msg = Message(
            subject=f"[CryptoFund Support] {subject}",
            recipients=[ADMIN_EMAIL], 
            body=admin_message_body,
            sender=SENDER_EMAIL 
        )
        
        mail.send(msg) 

        print(f"--- SERVER LOG ---\nComplaint received and PROCESSED SUCCESSFULLY for: {ADMIN_EMAIL}")

        return jsonify({"status": "success", "message": "Message successfully sent."}), 200
        
    except Exception as e:
        print(f"\nServer-side error: Failed to send email via SMTP.")
        print(f"EXACT PYTHON EXCEPTION: {e}") 
        print("----------------------------------------------------------------------\n")
        return jsonify({"status": "error", "message": "Server-side error processing email request."}), 500

# ================================================================
# 5. RUN SERVER
# ================================================================
if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)