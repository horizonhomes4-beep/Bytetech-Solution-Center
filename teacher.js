//==================================================
// Lesson Payment Management System
// Teacher Dashboard
//==================================================

import {
    db,
    ref,
    update,
    studentsRef,
    paymentsRef,
    teachersRef,
    onValue
} from "./firebase.js";

import { printStudentReceipt } from "./receipt.js";

//==================================================
// DOM ELEMENTS
//==================================================

const teacherNameEl = document.getElementById("teacherName");
const expectedAmountEl = document.getElementById("expectedAmount");
const receivedAmountEl = document.getElementById("receivedAmount");
const balanceAmountEl = document.getElementById("balanceAmount");
const studentTable = document.getElementById("studentTable");
const paymentTable = document.getElementById("paymentTable");
const loadingScreen = document.getElementById("loadingScreen");

//==================================================
// FORMAT MONEY
//==================================================

function money(value) {
    return "₦" + Number(value || 0).toLocaleString();
}

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

//==================================================
// GET DASHBOARD KEY FROM URL
//==================================================

const params = new URLSearchParams(window.location.search);
const dashboardKey = params.get("id");

let teacherId = null;
let allStudents = {};
let allPayments = {};

// Assigned students list pagination (show a handful at a time)
let studentsExpanded = false;
const STUDENT_PAGE_SIZE = 3;

//==================================================
// FIND TEACHER MATCHING THIS DASHBOARD KEY
//==================================================

if (!dashboardKey) {
    teacherNameEl.textContent = "Invalid Dashboard Link";
    if (loadingScreen) loadingScreen.style.display = "none";
} else {
    onValue(teachersRef, (snapshot) => {
        const teachers = snapshot.val() || {};
        teacherId = null;

        Object.keys(teachers).forEach((id) => {
            if (teachers[id].dashboardKey === dashboardKey) {
                teacherId = id;
                teacherNameEl.textContent = teachers[id].name;
            }
        });

        if (!teacherId) {
            teacherNameEl.textContent = "Invalid Dashboard Link";
            if (loadingScreen) loadingScreen.style.display = "none";
            return;
        }

        loadStudents();
        loadPayments();

        if (loadingScreen) loadingScreen.style.display = "none";
    });
}

//==================================================
// LOAD STUDENTS ASSIGNED TO THIS TEACHER
//==================================================

function loadStudents() {
    onValue(studentsRef, (snapshot) => {
        allStudents = snapshot.val() || {};
        renderStudents();
        renderTotals();
    });
}

function renderStudents() {
    // Only active (non-deleted) students show in the list; deleted
    // students are NOT dropped from `allStudents` itself, so their
    // amounts still count toward this teacher's expected earnings.
    const activeIds = Object.keys(allStudents).filter((id) => {
        const student = allStudents[id];
        return student.teacherId === teacherId && !student.isDeleted;
    });

    const visibleIds = studentsExpanded ? activeIds : activeIds.slice(0, STUDENT_PAGE_SIZE);

    studentTable.innerHTML = "";

    visibleIds.forEach((studentId) => {
        const student = allStudents[studentId];
        const share = Number(student.amountPaid || 0) / 3;

        studentTable.innerHTML += `
<tr>
<td>${escapeHtml(student.name)}</td>
<td><span class="program-tag">${escapeHtml(student.program) || "-"}</span></td>
<td>${student.startDate || "-"}</td>
<td>${student.stopDate || "-"}</td>
<td>${money(student.amountPaid)}</td>
<td>${money(share)}</td>
<td><a href="#" class="receipt-link printReceipt" data-id="${studentId}">Print Receipt</a></td>
</tr>
`;
    });

    if (activeIds.length === 0) {
        studentTable.innerHTML = `<tr><td colspan="7" class="empty">No students assigned</td></tr>`;
    }

    renderStudentTableFooter(activeIds.length);
    attachStudentRowEvents();
}

function renderStudentTableFooter(totalCount) {
    const footer = document.getElementById("studentTableFooter");
    if (!footer) return;

    if (totalCount <= STUDENT_PAGE_SIZE) {
        footer.innerHTML = "";
        return;
    }

    const remaining = totalCount - STUDENT_PAGE_SIZE;
    footer.innerHTML = studentsExpanded
        ? `<button class="outline-btn small-btn" id="toggleStudentsBtn">Show Less</button>`
        : `<button class="outline-btn small-btn" id="toggleStudentsBtn">Show ${remaining} More</button>`;

    document.getElementById("toggleStudentsBtn").onclick = () => {
        studentsExpanded = !studentsExpanded;
        renderStudents();
    };
}

function attachStudentRowEvents() {
    document.querySelectorAll(".printReceipt").forEach((link) => {
        link.onclick = (e) => {
            e.preventDefault();
            const student = allStudents[link.dataset.id];
            if (!student) return;
            printStudentReceipt(student, teacherNameEl.textContent);
        };
    });
}

//==================================================
// LOAD PAYMENTS RECEIVED BY THIS TEACHER
//==================================================

function loadPayments() {
    onValue(paymentsRef, (snapshot) => {
        const all = snapshot.val() || {};
        allPayments = all[teacherId] || {};
        renderPayments();
        renderTotals();
    });
}

function renderPayments() {
    paymentTable.innerHTML = "";
    let count = 0;

    // Sort by date/createdAt, most recent first
    const entries = Object.keys(allPayments)
        .map((id) => ({ id, ...allPayments[id] }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

    entries.forEach((payment) => {
        count++;
        const status = payment.status || "acknowledged";
        const type = payment.type || "add";
        const sign = type === "deduct" ? "−" : "+";
        const badgeCls = type === "deduct" ? "badge-negative" : "badge-positive";

        const actionCell =
            status === "pending"
                ? `<button class="acknowledge-btn ackPayment" data-id="${payment.id}">Acknowledge</button>`
                : `<span class="acknowledged-tag">-</span>`;

        paymentTable.innerHTML += `
<tr>
<td>${payment.date || "-"}</td>
<td><span class="balance-badge ${badgeCls}">${sign}${money(payment.amount)}</span></td>
<td>${type === "deduct" ? "Deduction" : "Payment"}</td>
<td>${escapeHtml(payment.remark) || "-"}</td>
<td><span class="status-badge status-${status}">${status === "acknowledged" ? "Acknowledged" : "Pending"}</span></td>
<td>${actionCell}</td>
</tr>
`;
    });

    if (count === 0) {
        paymentTable.innerHTML = `<tr><td colspan="6" class="empty">No payment history available</td></tr>`;
    }

    attachAcknowledgeEvents();
}

//==================================================
// ACKNOWLEDGE A PENDING PAYMENT
// Only after acknowledgement does the amount get counted
// (added or deducted, depending on entry type) into totals.
//==================================================

function attachAcknowledgeEvents() {
    document.querySelectorAll(".ackPayment").forEach((button) => {
        button.onclick = () => {
            update(ref(db, "lessonPayment/teacherPayments/" + teacherId + "/" + button.dataset.id), {
                status: "acknowledged",
                acknowledgedAt: Date.now()
            });
        };
    });
}

//==================================================
// TOTALS: EXPECTED / RECEIVED / BALANCE
//==================================================

function renderTotals() {
    let expected = 0;
    Object.values(allStudents).forEach((student) => {
        // Include every student ever assigned (even removed ones) so a
        // student's deletion never retroactively shrinks the teacher's
        // already-counted expected earnings.
        if (student.teacherId === teacherId) {
            expected += Number(student.amountPaid || 0) / 3;
        }
    });

    let received = 0;
    Object.values(allPayments).forEach((payment) => {
        const status = payment.status || "acknowledged";
        if (status !== "acknowledged") return;

        const type = payment.type || "add";
        const amt = Number(payment.amount || 0);
        received += type === "deduct" ? -amt : amt;
    });

    expectedAmountEl.textContent = money(expected);
    receivedAmountEl.textContent = money(received);
    balanceAmountEl.textContent = money(expected - received);

    const balanceCard = balanceAmountEl.closest(".summary-card");
    if (balanceCard) {
        balanceCard.classList.remove("card-positive", "card-negative", "card-neutral");
        const diff = expected - received;
        balanceCard.classList.add(diff > 0 ? "card-negative" : diff < 0 ? "card-positive" : "card-neutral");
    }
}
