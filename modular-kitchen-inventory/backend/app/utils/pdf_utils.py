import os
from datetime import datetime
from fpdf import FPDF
from ..database import STORAGE_DIR

class VudfitPDF(FPDF):
    def __init__(self, doc_title="GOODS REQUISITION NOTE"):
        super().__init__()
        self.doc_title = doc_title

    def header(self):
        # Forest green background header banner (#0b2316)
        self.set_fill_color(11, 35, 22)
        self.rect(0, 0, 210, 32, "F")
        
        # Gold branded text (#c5a059)
        self.set_xy(15, 6)
        self.set_text_color(197, 160, 89)
        self.set_font("Helvetica", "B", 18)
        self.cell(100, 10, "VUDFIT", border=0, ln=0, align="L")
        
        # Subtitle
        self.set_xy(15, 14)
        self.set_text_color(255, 255, 255)
        self.set_font("Helvetica", "B", 7)
        self.cell(100, 5, "LUXURY LIVING INTERIOR SYSTEMS", border=0, ln=0, align="L")
        
        # Right aligned Document Title
        self.set_xy(110, 8)
        self.set_text_color(197, 160, 89)
        self.set_font("Helvetica", "B", 12)
        self.cell(85, 10, self.doc_title, border=0, ln=1, align="R")
        
        # Spacer
        self.ln(20)
        
    def footer(self):
        self.set_y(-15)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Page {self.page_no()}/{{nb}} - Vudfit Logistics Division", align="C")

def generate_transaction_pdf(tx_type: str, details: dict) -> str:
    """
    Compiles a branded transaction details PDF note using fpdf2.
    Returns the file path to the generated temporary PDF file.
    """
    doc_title = "GOODS RECEIVED NOTE" if tx_type == "inward" else "GOODS RETURN NOTE" if tx_type == "return" else "GOODS REQUISITION NOTE"
    
    pdf = VudfitPDF(doc_title=doc_title)
    pdf.alias_nb_pages()
    pdf.add_page()
    
    # Setup document metadata
    timestamp = details.get("timestamp", datetime.now().strftime("%Y-%m-%d %H:%M:%S"))
    ref_code = f"VUD-{'RCV' if tx_type == 'inward' else 'RET' if tx_type == 'return' else 'REQ'}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
    
    # 1. Metadata Block
    pdf.set_y(38)
    pdf.set_text_color(74, 85, 104) # slate gray
    pdf.set_font("Helvetica", "", 9)
    pdf.cell(100, 5, f"Document Reference: {ref_code}", ln=0)
    pdf.cell(80, 5, f"Date: {timestamp}", ln=1, align="R")
    pdf.ln(5)
    
    # Draw divider line
    pdf.set_draw_color(226, 232, 240) # light gray divider
    pdf.set_line_width(0.5)
    pdf.line(15, 48, 195, 48)
    pdf.ln(5)
    
    # 2. Left / Right Info Columns (Addresses)
    # Left column: Customer/Supplier details
    # Right column: Central central warehouse details
    col_width = 85
    start_y = pdf.get_y()
    
    pdf.set_xy(15, start_y)
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(197, 160, 89) # Gold
    pdf.cell(col_width, 4, "REQUISITIONED FOR" if tx_type == "outward" else "RETURNED BY" if tx_type == "return" else "RECEIVED FROM", ln=2)
    
    pdf.set_text_color(11, 35, 22) # Dark Green
    pdf.set_font("Helvetica", "B", 11)
    
    if tx_type in ["outward", "return"]:
        cust_name = details.get("customer_name", "N/A")
        pdf.cell(col_width, 6, cust_name, ln=2)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(74, 85, 104)
        
        phone = details.get("customer_phone")
        if phone:
            pdf.cell(col_width, 5, f"Phone: {phone}", ln=2)
            
        email = details.get("customer_email")
        if email:
            pdf.cell(col_width, 5, f"Email: {email}", ln=2)
            
        address = details.get("customer_address")
        if address:
            pdf.set_font("Helvetica", "I", 8)
            pdf.multi_cell(col_width, 4, f"Project Address:\n{address}")
    else:
        supp_name = details.get("supplier_name", "N/A")
        pdf.cell(col_width, 6, supp_name, ln=2)
        pdf.set_font("Helvetica", "", 9)
        pdf.set_text_color(74, 85, 104)
        
        invoice = details.get("invoice_number")
        if invoice:
            pdf.cell(col_width, 5, f"Invoice Number: {invoice}", ln=2)
            
        remarks = details.get("remarks")
        if remarks:
            pdf.set_font("Helvetica", "I", 8)
            pdf.multi_cell(col_width, 4, f"Remarks: {remarks}")
            
    # Right column: Vudfit details
    pdf.set_xy(110, start_y)
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(197, 160, 89) # Gold
    pdf.cell(col_width, 4, "ISSUED FROM" if tx_type == "outward" else "RETURNED TO" if tx_type == "return" else "RECEIVED AT", ln=2, align="R")
    
    pdf.set_text_color(11, 35, 22)
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(col_width, 6, "Vudfit Central Warehouse", ln=2, align="R")
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(74, 85, 104)
    pdf.cell(col_width, 5, "133/1/1, Patel Farm", ln=2, align="R")
    pdf.cell(col_width, 5, "Popatpura, Gujarat", ln=2, align="R")
    pdf.cell(col_width, 5, "PIN: 389340", ln=2, align="R")
    
    pdf.ln(15)
    
    # 3. Product Details Table
    pdf.set_x(15)
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(255, 255, 255)
    
    # Table headers: S.No, Product Details, SKU, Barcode, Quantity
    pdf.set_fill_color(11, 35, 22) # Dark Green Header
    pdf.cell(10, 8, "SNo", border=1, fill=True, align="C")
    pdf.cell(60, 8, "Product Name & Details", border=1, fill=True)
    pdf.cell(40, 8, "SKU Code", border=1, fill=True, align="C")
    pdf.cell(45, 8, "Barcode", border=1, fill=True, align="C")
    pdf.cell(25, 8, "Quantity", border=1, fill=True, align="R")
    pdf.ln(8)
    
    # Table content row
    pdf.set_font("Helvetica", "", 8)
    pdf.set_text_color(74, 85, 104)
    
    product_name = details.get("product_name", "N/A")
    sku = details.get("sku", "N/A")
    barcode = details.get("barcode", "N/A")
    qty = details.get("quantity", 0)
    unit = details.get("unit", "pcs")
    
    # Truncate product name if it exceeds 32 characters to prevent overflow
    display_name = product_name
    if len(display_name) > 32:
        display_name = display_name[:29] + "..."
        
    pdf.cell(10, 10, "1", border=1, align="C")
    pdf.cell(60, 10, f" {display_name}", border=1)
    pdf.cell(40, 10, f" {sku}", border=1, align="C")
    pdf.cell(45, 10, f" {barcode}", border=1, align="C")
    
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(11, 35, 22)
    pdf.cell(25, 10, f"{qty} {unit} ", border=1, align="R")
    pdf.ln(15)
    
    start_y = pdf.get_y()
    
    # 4. Remarks and Signatures Block
    pdf.set_x(15)
    pdf.set_font("Helvetica", "B", 8)
    pdf.set_text_color(197, 160, 89)
    pdf.cell(0, 5, "TRANSACTION INFORMATION", ln=1)
    
    pdf.set_font("Helvetica", "", 9)
    pdf.set_text_color(74, 85, 104)
    pdf.cell(100, 5, f"Operator: {details.get('operator', 'N/A')}", ln=1)
    if tx_type in ["outward", "return"]:
        pdf.cell(100, 5, f"Remarks: {details.get('remarks', 'N/A')}", ln=1)
        
    # Draw product image if it is provided
    image_url = details.get("image_url")
    if image_url:
        image_name = os.path.basename(image_url)
        img_path = os.path.join(STORAGE_DIR, "uploads", image_name)
        if os.path.exists(img_path):
            try:
                pdf.set_draw_color(197, 160, 89) # Gold
                pdf.set_line_width(0.3)
                pdf.rect(150, start_y, 40, 40)
                pdf.image(img_path, x=151, y=start_y + 1, w=38, h=38)
                
                pdf.set_xy(150, start_y + 41)
                pdf.set_font("Helvetica", "I", 7)
                pdf.set_text_color(128, 128, 128)
                pdf.cell(40, 3, "Product Reference Photo", border=0, align="C")
            except Exception as img_err:
                print(f"Failed to render image in PDF: {img_err}")
                
    if image_url:
        pdf.set_y(start_y + 48)
    else:
        pdf.ln(15)
    
    # Signature fields
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_text_color(74, 85, 104)
    
    # Prepared By
    pdf.cell(90, 5, "Prepared By: Central Warehouse Manager", ln=0)
    # Received By
    pdf.cell(90, 5, "Received By: Authorized Representative", ln=1, align="R")
    
    pdf.ln(12)
    # Signature line
    pdf.line(15, pdf.get_y(), 75, pdf.get_y())
    pdf.line(135, pdf.get_y(), 195, pdf.get_y())
    
    # Write to a temporary file
    TEMP_DIR = STORAGE_DIR
    os.makedirs(TEMP_DIR, exist_ok=True)
    
    pdf_filename = f"VUD_{tx_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.pdf"
    pdf_path = os.path.join(TEMP_DIR, pdf_filename)
    
    pdf.output(pdf_path)
    return pdf_path
