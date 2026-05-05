# app.py - Dedicated Flask backend for handling the Contact Form (Email Service)

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_mail import Mail, Message
from dotenv import load_dotenv # <-- NEW IMPORT
from flask import Flask, request, jsonify
import os
import sys

# ================================================================
# 1. INITIALIZE APP
# ================================================================
load_dotenv()
app = Flask(__name__)

# Allows requests from your React frontend (typically on localhost:3000)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}}) 

# ================================================================
# 2. FLASK-MAIL CONFIGURATION (The SENDER'S Account Details)
#    These settings MUST use the EMAIL_USER (your Gmail) and 
#    EMAIL_PASS (the 16-digit App Password) environment variables.
# ================================================================
# Safety Check: If environment variables are missing, Flask-Mail configuration 
# will load 'None', which causes the 'default sender' error.
if not os.environ.get('EMAIL_USER') or not os.environ.get('EMAIL_PASS'):
    print("FATAL ERROR: EMAIL_USER or EMAIL_PASS environment variables are NOT SET.")
    print("Please set them in your terminal before running 'python app.py'.")
    # Using 'sys.exit' here would be better in production, but we let it run 
    # for local testing so the user can see the 500 error log in the next step.

app.config['MAIL_SERVER'] = 'smtp.gmail.com' 
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True

# Fetch credentials from environment variables
SENDER_EMAIL = os.environ.get('EMAIL_USER')
SENDER_PASS = os.environ.get('EMAIL_PASS')

app.config['MAIL_USERNAME'] = SENDER_EMAIL
app.config['MAIL_PASSWORD'] = SENDER_PASS

# FIX for 'default sender not configured' error: explicitly set it to the username.
app.config['MAIL_DEFAULT_SENDER'] = SENDER_EMAIL

mail = Mail(app)

# ================================================================
# 3. DESTINATION EMAIL ADDRESS (The Admin's Inbox)
#    REPLACE THIS WITH THE EMAIL ADDRESS YOU WANT TO RECEIVE THE COMPLAINTS AT.
# ================================================================
ADMIN_EMAIL = 'diyasj109@gmail.com' 

# ================================================================
# 4. CONTACT ROUTE HANDLER
# ================================================================
@app.route('/contact', methods=['POST'])
def contact():
    """Receives contact form data and sends an email to the admin."""
    try:
        data = request.get_json()
        
        user_email = data.get('email')
        subject = data.get('subject')
        message_body = data.get('message')
        wallet_address = data.get('walletAddress')

        # Compose the full email body for the admin
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
            # Robustness Fix: Explicitly define the sender
            sender=SENDER_EMAIL 
        )
        
        # ACTUALLY SEND THE EMAIL: THIS LINE MUST BE UNCOMMENTED
        mail.send(msg) 

        print(f"--- SERVER LOG ---\nComplaint received and PROCESSED SUCCESSFULLY for: {ADMIN_EMAIL}")

        return jsonify({"status": "success", "message": "Message successfully sent."}), 200
        
    except Exception as e:
        # CRITICAL LOGGING: This will show the exact reason for the 500 error (e.g., SMTPAuthenticationError)
        print(f"\nServer-side error: Failed to send email via SMTP.")
        print(f"EXACT PYTHON EXCEPTION: {e}") 
        print("----------------------------------------------------------------------\n")
        
        # Send a 500 status back to the frontend
        return jsonify({"status": "error", "message": "Server-side error processing email request."}), 500

# ================================================================
# 5. RUN SERVER
# ================================================================
if __name__ == '__main__':
    # Flask runs on the same port specified in src/api.js (http://127.0.0.1:5000)
    app.run(host='127.0.0.1', port=5000, debug=True)