import { jsPDF } from 'jspdf';

// Helper function to ensure valid numbers
const ensureValidNumber = (value) => {
  const num = parseFloat(value);
  return isNaN(num) ? 0 : num;
};

// Helper function to format currency
const formatCurrency = (amount) => {
  const validAmount = ensureValidNumber(amount);
  return `₹${validAmount.toFixed(2)}`;
};

export const generateInvoice = async (order) => {
  return new Promise((resolve, reject) => {
    try {
      // Create new PDF document
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      // Set initial position
      let yPos = 20;
      const pageWidth = doc.internal.pageSize.width;
      const margin = 20;
      const contentWidth = pageWidth - 2 * margin;

      // Add company logo/header
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text('MEDS4U', pageWidth / 2, yPos, { align: 'center' });
      
      // Add company details
      yPos += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('123 Healthcare Street', pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      doc.text('Medical District, City - 123456', pageWidth / 2, yPos, { align: 'center' });
      yPos += 5;
      doc.text('Phone: +91 1234567890 | Email: support@meds4u.com', pageWidth / 2, yPos, { align: 'center' });

      // Add invoice details
      yPos += 15;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });

      // Invoice number and date
      yPos += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Invoice No: ${order._id}`, margin, yPos);
      doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, pageWidth - margin, yPos, { align: 'right' });

      // Customer details
      yPos += 20;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Customer Details', margin, yPos);
      
      yPos += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Name: ${order.userId?.name || 'N/A'}`, margin, yPos);
      yPos += 5;
      doc.text(`Email: ${order.userId?.email || 'N/A'}`, margin, yPos);
      yPos += 5;
      doc.text(`Phone: ${order.userId?.phoneNumber || 'N/A'}`, margin, yPos);

      // Order items table header
      yPos += 20;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      
      // Table header background
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, yPos, contentWidth, 12, 'F');
      
      // Table headers
      doc.text('#', margin + 5, yPos + 8);
      doc.text('Product', margin + 20, yPos + 8);
      doc.text('Qty', pageWidth - margin - 60, yPos + 8, { align: 'right' });
      doc.text('Price', pageWidth - margin - 40, yPos + 8, { align: 'right' });
      doc.text('Total', pageWidth - margin - 15, yPos + 8, { align: 'right' });

      // Order items
      yPos += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      order.items.forEach((item, index) => {
        // Check if we need a new page
        if (yPos > 250) {
          doc.addPage();
          yPos = 20;
        }

        // Item row
        doc.text(`${index + 1}`, margin + 5, yPos);
        doc.text(item.productDetails?.drugName || 'Unknown Product', margin + 20, yPos);
        doc.text(item.quantity.toString(), pageWidth - margin - 60, yPos, { align: 'right' });
        doc.text(`₹${ensureValidNumber(item.price).toFixed(2)}`, pageWidth - margin - 40, yPos, { align: 'right' });
        doc.text(`₹${(ensureValidNumber(item.price) * ensureValidNumber(item.quantity)).toFixed(2)}`, pageWidth - margin - 15, yPos, { align: 'right' });
        
        yPos += 10;
      });

      // Totals
      yPos += 10;
      doc.setFont('helvetica', 'bold');
      
      // Subtotal
      doc.text('Subtotal:', pageWidth - margin - 60, yPos, { align: 'right' });
      const subtotal = order.items.reduce((sum, item) => {
        return sum + (ensureValidNumber(item.price) * ensureValidNumber(item.quantity));
      }, 0);
      doc.text(`₹${subtotal.toFixed(2)}`, pageWidth - margin - 15, yPos, { align: 'right' });
      
      // Delivery Charge
      yPos += 10;
      doc.text('Delivery Charge:', pageWidth - margin - 60, yPos, { align: 'right' });
      const deliveryCharge = ensureValidNumber(order.deliveryCharge || 0);
      doc.text(`₹${deliveryCharge.toFixed(2)}`, pageWidth - margin - 15, yPos, { align: 'right' });
      
      // Total before discount
      yPos += 10;
      doc.text('Total:', pageWidth - margin - 60, yPos, { align: 'right' });
      const totalBeforeDiscount = subtotal + deliveryCharge;
      doc.text(`₹${totalBeforeDiscount.toFixed(2)}`, pageWidth - margin - 15, yPos, { align: 'right' });
      
      // Discount
      yPos += 10;
      doc.text(`Discount (${order.discountPercentage || 0}%):`, pageWidth - margin - 60, yPos, { align: 'right' });
      const discountAmount = (totalBeforeDiscount * (order.discountPercentage || 0)) / 100;
      doc.text(`₹${discountAmount.toFixed(2)}`, pageWidth - margin - 15, yPos, { align: 'right' });
      
      // Final Total
      yPos += 10;
      doc.setFontSize(12);
      doc.text('Final Total:', pageWidth - margin - 60, yPos, { align: 'right' });
      const finalTotal = totalBeforeDiscount - discountAmount;
      doc.text(`₹${finalTotal.toFixed(2)}`, pageWidth - margin - 15, yPos, { align: 'right' });

      // Terms and conditions
      yPos += 30;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('Terms and Conditions:', margin, yPos);
      yPos += 5;
      doc.text('1. This is a computer-generated invoice and does not require a signature.', margin, yPos);
      yPos += 5;
      doc.text('2. All prices are inclusive of applicable taxes.', margin, yPos);
      yPos += 5;
      doc.text('3. Please keep this invoice for future reference.', margin, yPos);
      yPos += 5;
      doc.text('4. For any queries, please contact our customer support.', margin, yPos);

      // Get the PDF as a buffer
      const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
      resolve(pdfBuffer);
    } catch (error) {
      console.error('Error generating invoice:', error);
      reject(error);
    }
  });
};  