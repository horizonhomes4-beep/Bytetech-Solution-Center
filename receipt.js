//==================================================
// Lesson Payment Management System
// Shared Receipt Printing Module
//==================================================

export const INSTITUTE_NAME = "Byte Tech Solutions";
export const INSTITUTE_TAGLINE = "Center for CBT Assessment & ICT Training with Certificates";

function money(value) {
    return "₦" + Number(value || 0).toLocaleString();
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

//==================================================
// BUILD + OPEN A PRINTABLE RECEIPT FOR A STUDENT
//==================================================

export function printStudentReceipt(student, teacherName) {
    if (!student) return;

    const share = Number(student.amountPaid || 0) / 3;
    const expected = Number(student.expectedPayment || 0);
    const paid = Number(student.amountPaid || 0);
    const balance = expected - paid;
    const isFullyPaid = balance <= 0;
    const issued = new Date().toLocaleDateString();
    const receiptNo = "BTS-" + String(student.createdAt || Date.now()).slice(-6);

    // Resolve the logo relative to the page that opened this receipt,
    // since the pop-up window itself starts at "about:blank".
    const baseHref = window.location.href.substring(0, window.location.href.lastIndexOf("/") + 1);
    const logoSrc = baseHref + "logo.jpg";

    const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<base href="${baseHref}">
<title>Receipt - ${escapeHtml(student.name)}</title>
<style>
    *{ box-sizing:border-box; }
    body{
        font-family:'Segoe UI', Arial, sans-serif;
        padding:40px 20px;
        color:#202b22;
        background:#f6f1e2;
    }
    .receipt-box{
        max-width:600px;
        margin:auto;
        background:#fbf8ef;
        border:2px solid #2f5d46;
        border-radius:10px;
        padding:34px;
    }
    .receipt-head{
        text-align:center;
        border-bottom:2px dashed #ddd0a6;
        padding-bottom:16px;
        margin-bottom:16px;
    }
    .receipt-logo{
        width:64px;
        height:64px;
        object-fit:contain;
        border-radius:50%;
        margin:0 auto 10px;
        display:block;
        background:#fff;
        box-shadow:0 0 0 3px #f6f1e2, 0 0 0 5px #b8862c;
    }
    h1{
        color:#1d4433;
        margin:0 0 4px;
        font-size:23px;
    }
    .tagline{
        color:#55604f;
        font-size:11.5px;
        text-transform:uppercase;
        letter-spacing:.06em;
        font-weight:600;
    }
    .meta-row{
        display:flex;
        justify-content:space-between;
        font-size:12px;
        color:#8f9280;
        margin-bottom:10px;
        flex-wrap:wrap;
        gap:6px;
    }
    table{
        width:100%;
        border-collapse:collapse;
        margin-top:10px;
    }
    td{
        padding:9px 0;
        border-bottom:1px dashed #ddd0a6;
        font-size:14px;
    }
    td.label{
        color:#8f9280;
        font-weight:600;
        width:44%;
        text-transform:uppercase;
        font-size:11.5px;
        letter-spacing:.03em;
    }
    .total-row td{
        font-weight:700;
        font-size:16px;
        color:#1d4433;
        border-top:2px solid #2f5d46;
        border-bottom:none;
        padding-top:14px;
    }
    .status-pill{
        display:inline-block;
        padding:3px 10px;
        border-radius:4px;
        font-size:12px;
        font-weight:700;
        text-transform:uppercase;
        letter-spacing:.04em;
    }
    .status-pill.paid{
        background:#e3ede7;
        color:#1d4433;
    }
    .status-pill.due{
        background:#f4e2da;
        color:#9c3b2e;
    }
    .footer-note{
        margin-top:26px;
        font-size:11px;
        color:#8f9280;
        text-align:center;
        line-height:1.5;
    }
    .print-btn{
        display:block;
        margin:22px auto 0;
        padding:10px 22px;
        background:#2f5d46;
        color:#f6ecd3;
        border:none;
        border-radius:6px;
        font-weight:700;
        font-size:13px;
        cursor:pointer;
    }
    @media print{
        body{ background:#fff; padding:0; }
        .receipt-box{ border:none; }
        .no-print{ display:none; }
    }
</style>
</head>
<body>
<div class="receipt-box">
    <div class="receipt-head">
        <img class="receipt-logo" src="${logoSrc}" alt="${escapeHtml(INSTITUTE_NAME)}" onerror="this.style.display='none'">
        <h1>${escapeHtml(INSTITUTE_NAME)}</h1>
        <div class="tagline">${escapeHtml(INSTITUTE_TAGLINE)}</div>
    </div>
    <div class="meta-row">
        <span>Receipt No: ${escapeHtml(receiptNo)}</span>
        <span>Date Issued: ${escapeHtml(issued)}</span>
    </div>
    <table>
        <tr><td class="label">Student Name</td><td>${escapeHtml(student.name)}</td></tr>
        <tr><td class="label">Phone Number</td><td>${escapeHtml(student.phone) || "-"}</td></tr>
        <tr><td class="label">Email</td><td>${escapeHtml(student.email) || "-"}</td></tr>
        <tr><td class="label">Program</td><td>${escapeHtml(student.program) || "-"}</td></tr>
        <tr><td class="label">Assigned Teacher</td><td>${escapeHtml(teacherName) || "-"}</td></tr>
        <tr><td class="label">Start Date</td><td>${student.startDate || "-"}</td></tr>
        <tr><td class="label">Stop Date</td><td>${student.stopDate || "-"}</td></tr>
        <tr><td class="label">Expected Payment</td><td>${money(expected)}</td></tr>
        <tr><td class="label">Amount Paid</td><td>${money(paid)}</td></tr>
        <tr><td class="label">Payment Status</td><td>
            <span class="status-pill ${isFullyPaid ? "paid" : "due"}">
                ${isFullyPaid ? "Fully Paid" : "Balance Due"}
            </span>
        </td></tr>
        <tr class="total-row"><td class="label">Balance</td><td>${money(isFullyPaid ? 0 : balance)}</td></tr>
    </table>
    <div class="footer-note">
        This receipt is computer generated and confirms the payment record on file
        for the above student at ${escapeHtml(INSTITUTE_NAME)}.
    </div>
    <button class="print-btn no-print" onclick="window.print()">Print Receipt</button>
</div>
<script>
    window.onload = function(){ window.print(); };
</script>
</body>
</html>`;

    const win = window.open("", "_blank", "width=650,height=750");
    if (!win) {
        alert("Please allow pop-ups to print the receipt.");
        return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
}
