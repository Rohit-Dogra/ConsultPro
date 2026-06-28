import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ... inside your component:
const [userDisplayName, setUserDisplayName] = useState('');
useEffect(() => {
  const userDataRaw = localStorage.getItem('user') || '{}';
  try {
    const user = JSON.parse(userDataRaw);
    setUserDisplayName(
      `${user.first_name || ''} ${user.last_name || ''}`.trim() ||
      user.name ||
      user.email ||
      'User'
    );
  } catch {
    setUserDisplayName('User');
  }
}, []);

const getInvoiceName = () => userDisplayName;

const InvoiceDialog = () => {
  if (!selectedInvoiceBooking) return null;
  const booking = selectedInvoiceBooking;
  const name = getInvoiceName();
  const sessionType = getSessionTypeLabel(booking.session_type);
  const amount = Number(booking.amount) || 0;
  const total = amount;
  const today = new Date();
  const issueDate = today.toLocaleDateString('en-GB');
  const dueDate = booking.date ? new Date(booking.date).toLocaleDateString('en-GB') : issueDate;

  const handleDownload = () => {
    const doc = new jsPDF('p', 'pt', 'a4');
    const logoUrl = window.location.origin + '/logo.png';
    const img = new window.Image();
    img.src = logoUrl;
    img.onload = () => {
      doc.addImage(img, 'PNG', 40, 30, 80, 60);
      drawRest();
      doc.save(`invoice-${booking.id}.pdf`);
    };
    img.onerror = () => {
      drawRest();
      doc.save(`invoice-${booking.id}.pdf`);
    };
    function drawRest() {
      doc.setFontSize(22);
      doc.setTextColor('#333');
      doc.text('Expertise-Station', 140, 60);
      doc.setFontSize(16);
      doc.setTextColor('#888');
      doc.text(`Invoice #${booking.id}`, 420, 50);
      doc.setFontSize(10);
      doc.setTextColor('#333');
      doc.text(`Issue date: ${issueDate}`, 420, 70);
      doc.text(`Due date: ${dueDate}`, 420, 85);
      doc.text(`Session: ${sessionType}`, 420, 100);
      doc.setFontSize(12);
      doc.setTextColor('#222');
      doc.text('BILL TO', 40, 120);
      doc.setFontSize(11);
      doc.text(name, 40, 135);
      doc.text('Expertise-Station', 40, 150);
      autoTable(doc, {
        startY: 170,
        head: [['Description', 'Hours', 'Unit price (₹)', 'Amount (₹)']],
        body: [
          [sessionType, '1', amount.toFixed(2), amount.toFixed(2)],
        ],
        theme: 'grid',
        headStyles: { fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' },
        bodyStyles: { textColor: 30 },
        styles: { fontSize: 11, cellPadding: 6 },
        columnStyles: { 0: { cellWidth: 200 }, 1: { cellWidth: 80 }, 2: { cellWidth: 100 }, 3: { cellWidth: 100 } },
      });
      let y = doc.lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.text(`Subtotal: ₹${amount.toFixed(2)}`, 340, y);
      y += 15;
      doc.text('GST (to be added): ₹0.00', 340, y);
      y += 15;
      doc.setFont('helvetica', 'bold');
      doc.text(`Total: ₹${total.toFixed(2)}`, 340, y);
      doc.setFont('helvetica', 'normal');
      y += 40;
      doc.setFontSize(10);
      doc.text('Issued by, signature:', 40, y);
      doc.setDrawColor(150);
      doc.line(150, y + 2, 300, y + 2);
      y += 30;
      doc.setFontSize(9);
      doc.setTextColor('#888');
      doc.text('Expertise-Station, www.expertisestation.com, info@expertisestation.com', 40, y);
    }
  };

  return (
    <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden">
        <div className="bg-green-700 flex items-center gap-3 px-6 py-4">
          <img src="/logo.png" alt="Logo" className="h-12 w-12 rounded bg-white p-1 shadow" />
          <div className="text-white text-xl font-bold tracking-wide">Expertise-Station</div>
        </div>
        <div className="px-6 py-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-lg font-semibold text-gray-800">Invoice #{booking.id}</div>
            <div className="text-xs text-gray-500">Issue: {issueDate}</div>
          </div>
          <div className="mb-2 text-gray-700 text-base font-semibold"> {name}</div>
          <div className="mb-1 text-sm">Company: <span className="font-medium">Expertise-Station</span></div>
          <div className="mb-1 text-sm">Session Type: <span className="font-medium">{sessionType}</span></div>
          <div className="mb-1 text-sm">Amount: <span className="font-medium">₹{amount.toFixed(2)}</span></div>
          <div className="mb-1 text-sm">GST: <span className="font-medium">To be added</span></div>
          <div className="text-lg font-bold mt-2">Total: ₹{total.toFixed(2)}</div>
          <div className="mt-4 border-t pt-2 text-xs text-gray-400">Expertise-Station, www.expertisestation.com, info@expertisestation.com</div>
        </div>
        <DialogFooter className="px-6 pb-6">
          <Button onClick={handleDownload} className="w-full bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold py-3 rounded shadow-lg text-lg transition-all duration-200">
            <svg className="inline-block mr-2 w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" /></svg>
            Download Invoice
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};