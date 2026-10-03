import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from .pdf_utils import generate_transaction_pdf
from ..database import STORAGE_DIR

# Setup paths relative to this file
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.makedirs(STORAGE_DIR, exist_ok=True)
LOG_FILE_PATH = os.path.join(STORAGE_DIR, "sent_emails.txt")

def load_env():
    """Lightweight .env parser to avoid external dependency requirements."""
    env_path = os.path.join(os.path.dirname(BASE_DIR), ".env")
    if os.path.exists(env_path):
        with open(env_path, "r") as f:
            for line in f:
                line = line.strip()
                if "=" in line and not line.startswith("#"):
                    key, val = line.split("=", 1)
                    os.environ[key.strip()] = val.strip()

# Run loader
load_env()

# Retrieve values dynamically
NOTIFY_EMAIL = os.environ.get("NOTIFY_EMAIL", "inventory.vudfit@gmail.com")

def send_transaction_email(tx_type: str, details: dict):
    """
    Sends an automated email notification about inventory movements.
    Falls back gracefully to writing details to a local log file if SMTP is unconfigured or fails.
    """
    current_stock = details.get("current_stock")
    min_stock = details.get("min_stock")
    
    is_low_stock = False
    if current_stock is not None and min_stock is not None:
        try:
            is_low_stock = float(current_stock) < float(min_stock)
        except (ValueError, TypeError):
            pass

    subject_prefix = "[LOW STOCK WARNING] " if is_low_stock else ""
    subject = f"{subject_prefix}[Vudfit Inventory] New {tx_type.upper()} Transaction Alert"
    
    # Extract details safely
    timestamp = details.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    product_name = details.get("product_name", "N/A")
    sku = details.get("sku", "N/A")
    barcode = details.get("barcode", "N/A")
    quantity = details.get("quantity", 0)
    unit = details.get("unit", "pcs")
    operator = details.get("operator", "N/A")
    remarks = details.get("remarks", "N/A")
    
    inward_details = ""
    if tx_type == "inward":
        supplier = details.get("supplier_name", "N/A")
        invoice = details.get("invoice_number", "N/A")
        inward_details = f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1d3f2d;">Supplier:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #4a5568;">{supplier}</td>
        </tr>
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1d3f2d;">Invoice Number:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #4a5568; font-family: monospace;">{invoice}</td>
        </tr>
        """
    else:
        customer = details.get("customer_name", "N/A")
        inward_details = f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1d3f2d;">Customer Name:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #4a5568;">{customer}</td>
        </tr>
        """

    # Construct image row if present
    image_url = details.get("image_url")
    base_url = details.get("base_url", "http://localhost:8000")
    image_row = ""
    if image_url:
        full_image_url = image_url if image_url.startswith("http") else f"{base_url}{image_url}"
        image_row = f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1d3f2d; vertical-align: top;">Captured Photo:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #4a5568;">
                <img src="{full_image_url}" alt="Goods Capture" style="max-width: 180px; border-radius: 8px; border: 1px solid #e5c185; display: block;" />
            </td>
        </tr>
        """

    warning_box = ""
    if is_low_stock:
        warning_box = f"""
        <div style="background-color: #fef2f2; border: 1px solid #fee2e2; border-radius: 12px; padding: 15px; margin-bottom: 20px;">
            <h3 style="color: #991b1b; margin: 0 0 5px 0; font-size: 14px; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                ⚠️ LOW STOCK ALERT
            </h3>
            <p style="color: #7f1d1d; margin: 0; font-size: 13px; line-height: 1.5;">
                Stock for <strong>{product_name}</strong> (SKU: {sku}) has fallen below its minimum required threshold of <strong>{min_stock} {unit}</strong>. Post-transaction stock level is currently <strong>{current_stock} {unit}</strong>. Please arrange a restock soon.
            </p>
        </div>
        """

    stock_details_rows = ""
    if current_stock is not None:
        stock_details_rows += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1d3f2d;">Current Stock:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #4a5568; font-weight: bold;">{current_stock} {unit}</td>
        </tr>
        """
    if min_stock is not None:
        stock_details_rows += f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1d3f2d;">Min Stock Level:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #4a5568;">{min_stock} {unit}</td>
        </tr>
        """

    # Vudfit forest green (#0b2316) & gold (#c5a059) branded HTML body
    html_body = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>{subject}</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #faf8f5; margin: 0; padding: 20px;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border: 1px solid #e5c185; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
            <!-- Header Banner -->
            <tr>
                <td align="center" style="background-color: #0b2316; padding: 30px; border-bottom: 4px solid #c5a059;">
                    <h1 style="color: #c5a059; margin: 0; font-size: 24px; font-weight: bold; letter-spacing: 2px;">VUDFIT</h1>
                    <p style="color: #ffffff; margin: 5px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Luxury Living Inventory System</p>
                </td>
            </tr>
            <!-- Content -->
            <tr>
                <td style="padding: 30px;">
                    <h2 style="color: #0b2316; margin-top: 0; font-size: 18px; border-bottom: 2px solid #faf8f5; padding-bottom: 10px;">Transaction Details ({tx_type.upper()})</h2>
                    {warning_box}
                    <p style="color: #4a5568; font-size: 14px; line-height: 1.6;">
                        This is an automated alert notifying you that a new stock transaction has been recorded.
                    </p>
                    
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="font-size: 14px; margin-top: 20px; border-collapse: collapse;">
                        <tr>
                            <td width="35%" style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1d3f2d;">Movement Type:</td>
                            <td width="65%" style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: {'#3d7c5a' if tx_type == 'inward' else '#3182ce' if tx_type == 'return' else '#ef4444'}; text-transform: uppercase;">{tx_type}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1d3f2d;">Product Name:</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #4a5568;">{product_name}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1d3f2d;">SKU / Code:</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #4a5568; font-family: monospace;">{sku}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1d3f2d;">Barcode:</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #4a5568; font-family: monospace;">{barcode}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1d3f2d;">Quantity:</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1d3f2d; font-size: 16px;">{quantity} {unit}</td>
                        </tr>
                        {stock_details_rows}
                        {inward_details}
                        {image_row}
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1d3f2d;">Recorded By:</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #4a5568;">{operator}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #1d3f2d;">Timestamp:</td>
                            <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #4a5568;">{timestamp}</td>
                        </tr>
                        <tr>
                            <td style="padding: 10px; font-weight: bold; color: #1d3f2d; vertical-align: top;">Remarks:</td>
                            <td style="padding: 10px; color: #718096; font-style: italic;">{remarks}</td>
                        </tr>
                    </table>
                </td>
            </tr>
            <!-- Footer -->
            <tr>
                <td style="background-color: #0b2316; padding: 20px; text-align: center; border-top: 1px solid #e5c185;">
                    <p style="color: #e5c185; margin: 0; font-size: 11px;">&copy; {datetime.now().year} VUDFIT. All rights reserved.</p>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    # Generate PDF note
    pdf_path = None
    try:
        pdf_path = generate_transaction_pdf(tx_type, details)
    except Exception as pdf_err:
        print(f"PDF generation failed: {pdf_err}")

    # Load SMTP configurations from environment if they exist
    smtp_host = os.environ.get("SMTP_HOST")
    smtp_port = os.environ.get("SMTP_PORT")
    smtp_user = os.environ.get("SMTP_USER")
    smtp_password = os.environ.get("SMTP_PASSWORD")
    smtp_sender = os.environ.get("SMTP_SENDER", "inventory@vudfit.com")
    
    smtp_sent = False
    
    if smtp_host and smtp_port and smtp_user and smtp_password:
        try:
            # Use 'mixed' type to allow both alternative html/text and attachments
            msg = MIMEMultipart("mixed")
            msg["Subject"] = subject
            msg["From"] = smtp_sender
            msg["To"] = NOTIFY_EMAIL
            
            # Attach plain text fallback and HTML body
            alt_container = MIMEMultipart("alternative")
            text_body = f"New {tx_type.upper()} Transaction alert:\nProduct: {product_name}\nQty: {quantity} {unit}\nOperator: {operator}\nTime: {timestamp}"
            alt_container.attach(MIMEText(text_body, "plain"))
            alt_container.attach(MIMEText(html_body, "html"))
            msg.attach(alt_container)
            
            # Attach PDF if generated successfully
            if pdf_path and os.path.exists(pdf_path):
                from email.mime.base import MIMEBase
                from email import encoders
                
                with open(pdf_path, "rb") as attachment:
                    part = MIMEBase("application", "octet-stream")
                    part.set_payload(attachment.read())
                    encoders.encode_base64(part)
                    
                    filename = os.path.basename(pdf_path)
                    part.add_header(
                        "Content-Disposition",
                        f"attachment; filename={filename}",
                    )
                    msg.attach(part)
            
            # Connect and send
            port = int(smtp_port)
            if port == 465:
                server = smtplib.SMTP_SSL(smtp_host, port, timeout=10)
            else:
                server = smtplib.SMTP(smtp_host, port, timeout=10)
                server.starttls()
                
            server.login(smtp_user, smtp_password)
            server.sendmail(smtp_sender, [NOTIFY_EMAIL], msg.as_string())
            server.quit()
            smtp_sent = True
        except Exception as e:
            print(f"SMTP notification failed: {e}")
            
    # Always append to standard local backup file to verify output & fallback
    try:
        with open(LOG_FILE_PATH, "a", encoding="utf-8") as f:
            f.write("="*80 + "\n")
            f.write(f"NOTIFICATION ATTEMPT: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
            f.write(f"RECIPIENT: {NOTIFY_EMAIL}\n")
            f.write(f"SUBJECT: {subject}\n")
            f.write(f"SMTP STATUS: {'SENT SUCCESSFULLY' if smtp_sent else 'FALLBACK ACTIVE (SMTP UNCONFIGURED/FAILED)'}\n")
            f.write(f"PDF ATTACHED: {'YES' if pdf_path else 'NO'}\n")
            f.write(f"DETAILS: Type={tx_type}, Product={product_name}, SKU={sku}, Qty={quantity} {unit}, Operator={operator}\n")
            f.write(f"BODY:\n{html_body}\n")
            f.write("="*80 + "\n\n")
    except Exception as e:
        print(f"Failed to log email alert to backup file: {e}")
        
    # Cleanup temporary PDF file
    if pdf_path and os.path.exists(pdf_path):
        try:
            os.remove(pdf_path)
        except Exception as cleanup_err:
            print(f"Failed to delete temp PDF file: {cleanup_err}")
