//==================================================
// Lesson Payment Management System
// Admin Dashboard
//==================================================

import {
    db,
    teachersRef,
    studentsRef,
    paymentsRef,
    ref,
    push,
    set,
    update,
    remove,
    onValue
} from "./firebase.js";

import { printStudentReceipt } from "./receipt.js";

//==================================================
// DOM ELEMENTS
//==================================================

const teacherTable = document.getElementById("teacherTable");
const studentTable = document.getElementById("studentTable");
const paymentTable = document.getElementById("paymentTable");

const teacherCount = document.getElementById("teacherCount");
const studentCount = document.getElementById("studentCount");

// All teacher commission totals are exactly 33% of the
// underlying real/full student fee figures.
const commissionExpectedFull = document.getElementById("commissionExpectedFull");
const commissionEarnedTotal = document.getElementById("commissionEarnedTotal");
const commissionUnearnedTotal = document.getElementById("commissionUnearnedTotal");
const commissionPaidOutTotal = document.getElementById("commissionPaidOutTotal");
const commissionPayableTotal = document.getElementById("commissionPayableTotal");

const teacherSearch = document.getElementById("teacherSearch");
const studentSearch = document.getElementById("studentSearch");
const studentFilter = document.getElementById("studentFilter");
const studentTeacherFilter = document.getElementById("studentTeacherFilter");

//==================================================
// MODALS
//==================================================

const teacherModal = document.getElementById("teacherModal");
const studentModal = document.getElementById("studentModal");
const paymentModal = document.getElementById("paymentModal");
const dashboardModal = document.getElementById("dashboardModal");
const teacherViewModal = document.getElementById("teacherViewModal");
const deleteModal = document.getElementById("deleteModal");

//==================================================
// STATE
//==================================================

let teachers = {};
let students = {};
let payments = {};
let customPrograms = {};

// A sensible starting set — admins can add any additional program from the
// dropdown itself ("+ Add New Program..."), which is saved to Firebase so
// it shows up for everyone from then on, with no code changes needed.
const DEFAULT_PROGRAMS = [
    "CBT Assessment",
    "ICT Training (Certificate)",
    "Computer Skills",
    "Video Editing",
    "Website Development",
    "App Development",
    "Graphic Design",
    "Digital Marketing",
    "Data Analysis",
    "Software Engineering",
    "Networking Essentials",
    "Cybersecurity Basics"
];

const ADD_PROGRAM_VALUE = "__add_new_program__";
const programsRef = ref(db, "lessonPayment/programs");

let editingTeacherId = null;
let editingStudentId = null;

let deletePath = "";
let deleteType = ""; // "student" | "teacher"

// Students list pagination
let studentsExpanded = false;
const STUDENT_PAGE_SIZE = 3;

//==================================================
// TEACHER COMMISSION RATE
//==================================================
//
// Teacher receives exactly 33% of the student's full fee.
//
// Example:
// Full fee = ₦120,000
// Teacher commission = ₦120,000 × 0.33 = ₦39,600
//
// IMPORTANT:
// Student expectedPayment and amountPaid remain stored in Firebase
// as the REAL/FULL amounts entered by the admin.
// The 33% commission is calculated only when displaying/calculating
// teacher earnings.
//
//==================================================

const TEACHER_COMMISSION_RATE = 0.33;

function toCommission(value) {
    return Number(value || 0) * TEACHER_COMMISSION_RATE;
}

//==================================================
// TOAST
//==================================================

function toast(message) {
    const box = document.getElementById("toast");
    const text = document.getElementById("toastMessage");

    if (!box || !text) return;

    text.textContent = message;
    box.classList.add("show");

    setTimeout(() => {
        box.classList.remove("show");
    }, 2500);
}

//==================================================
// FORMAT MONEY
//==================================================

function money(amount) {
    return "₦" + Number(amount || 0).toLocaleString();
}

function balanceBadge(value) {
    const num = Number(value || 0);

    const cls =
        num > 0
            ? "badge-negative"
            : num < 0
                ? "badge-positive"
                : "badge-neutral";

    return `<span class="balance-badge ${cls}">${money(num)}</span>`;
}

//==================================================
// STUDENT PAYMENT HELPERS
//==================================================
//
// expectedPayment / amountPaid stored in Firebase are always the
// REAL/FULL fee figures entered by the admin.
//
// Teacher commission is exactly 33% and is calculated only when
// displaying teacher-related earnings.
//
//==================================================

function studentBalance(student) {
    return Number(student.expectedPayment || 0) -
        Number(student.amountPaid || 0);
}

function isFullyPaid(student) {
    return studentBalance(student) <= 0;
}

function paymentStatusBadge(student) {
    const balance = studentBalance(student);

    if (balance <= 0) {
        return `<span class="balance-badge badge-positive">Fully Paid</span>`;
    }

    return `
        <span class="balance-badge badge-negative">
            ${money(balance)} Due
        </span>
    `;
}

//==================================================
// STUDENT SUBSCRIPTION TIMER
//==================================================
//
// expired      → subscription period is over
// ending_soon  → 7 days or fewer remain
// active       → more than 7 days remain
// none         → no stop date was set
//
//==================================================

const DAY_MS = 24 * 60 * 60 * 1000;

function studentTimeStatus(student) {
    if (!student.stopDate) {
        return {
            category: "none",
            label: "No End Date",
            cls: "badge-neutral"
        };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const stop = new Date(student.stopDate + "T00:00:00");

    if (isNaN(stop.getTime())) {
        return {
            category: "none",
            label: "No End Date",
            cls: "badge-neutral"
        };
    }

    const diffDays = Math.round(
        (stop.getTime() - today.getTime()) / DAY_MS
    );

    if (diffDays < 0) {
        const daysAgo = Math.abs(diffDays);

        return {
            category: "expired",
            label: `Finished ${daysAgo}d ago`,
            cls: "badge-negative"
        };
    }

    if (diffDays === 0) {
        return {
            category: "ending_soon",
            label: "Ends Today",
            cls: "badge-warning"
        };
    }

    if (diffDays <= 7) {
        return {
            category: "ending_soon",
            label: `${diffDays}d left`,
            cls: "badge-warning"
        };
    }

    return {
        category: "active",
        label: `${diffDays}d left`,
        cls: "badge-positive"
    };
}

function timeStatusBadge(status) {
    return `
        <span class="balance-badge ${status.cls}">
            ${status.label}
        </span>
    `;
}

//==================================================
// ESCAPE HTML
//==================================================

function escapeHtml(value) {
    const div = document.createElement("div");
    div.textContent = value ?? "";
    return div.innerHTML;
}

//==================================================
// RANDOM DASHBOARD KEY
//==================================================

function generateKey() {
    return (
        Math.random().toString(36).substring(2, 10) +
        Math.random().toString(36).substring(2, 6)
    );
}

//==================================================
// MODAL OPEN / CLOSE HELPERS
//==================================================

function openTeacherModal(editId = null) {
    editingTeacherId = editId;

    const title = document.querySelector(
        "#teacherModal .modal-header h2"
    );

    const saveBtn = document.getElementById("saveTeacher");

    if (editId) {
        const t = teachers[editId];

        if (!t) return;

        document.getElementById("teacherName").value = t.name || "";
        document.getElementById("teacherPhone").value = t.phone || "";
        document.getElementById("teacherAddress").value = t.address || "";

        title.textContent = "Edit Teacher";
        saveBtn.textContent = "Update Teacher";
    } else {
        document.getElementById("teacherName").value = "";
        document.getElementById("teacherPhone").value = "";
        document.getElementById("teacherAddress").value = "";

        title.textContent = "Add Teacher";
        saveBtn.textContent = "Save Teacher";
    }

    teacherModal.classList.add("active");
}

function closeTeacherModal() {
    teacherModal.classList.remove("active");
    editingTeacherId = null;
}

function openStudentModal(editId = null) {
    editingStudentId = editId;

    const title = document.querySelector(
        "#studentModal .modal-header h2"
    );

    const saveBtn = document.getElementById("saveStudent");
    const programSelect = document.getElementById("studentProgram");

    if (editId) {
        const s = students[editId];

        if (!s) return;

        document.getElementById("studentName").value = s.name || "";
        document.getElementById("studentEmail").value = s.email || "";
        document.getElementById("studentPhone").value = s.phone || "";
        document.getElementById("studentGender").value = s.gender || "";
        document.getElementById("studentDob").value = s.dob || "";
        document.getElementById("studentAddress").value = s.address || "";
        document.getElementById("guardianName").value =
            s.guardianName || "";
        document.getElementById("guardianPhone").value =
            s.guardianPhone || "";

        programSelect.value = s.program || "";

        document.getElementById("startDate").value =
            s.startDate || "";

        document.getElementById("stopDate").value =
            s.stopDate || "";

        document.getElementById("expectedPayment").value =
            s.expectedPayment || "";

        document.getElementById("amountPaid").value =
            s.amountPaid || "";

        teacherSelect.value = s.teacherId || "";

        title.textContent = "Edit Student";
        saveBtn.textContent = "Update Student";
    } else {
        document.getElementById("studentName").value = "";
        document.getElementById("studentEmail").value = "";
        document.getElementById("studentPhone").value = "";

        document.getElementById("studentGender").selectedIndex = 0;

        document.getElementById("studentDob").value = "";
        document.getElementById("studentAddress").value = "";
        document.getElementById("guardianName").value = "";
        document.getElementById("guardianPhone").value = "";

        programSelect.selectedIndex = 0;

        document.getElementById("startDate").value = "";
        document.getElementById("stopDate").value = "";
        document.getElementById("expectedPayment").value = "";
        document.getElementById("amountPaid").value = "";

        teacherSelect.selectedIndex = 0;

        title.textContent = "Add Student";
        saveBtn.textContent = "Save Student";
    }

    studentModal.classList.add("active");
}

function closeStudentModal() {
    studentModal.classList.remove("active");
    editingStudentId = null;
}

//==================================================
// STUDENT PROFILE VIEW MODAL
//==================================================

const studentProfileModal =
    document.getElementById("studentProfileModal");

let viewingStudentId = null;

function profileItem(label, value, fullWidth) {
    const safeValue =
        value && String(value).trim() !== ""
            ? escapeHtml(value)
            : "—";

    return `
<div class="profile-item${fullWidth ? " full-width" : ""}">
    <span class="profile-label">${label}</span>
    <span class="profile-value">${safeValue}</span>
</div>`;
}

function openStudentProfile(id) {
    const student = students[id];

    if (!student) return;

    viewingStudentId = id;

    const teacherName =
        teachers[student.teacherId]?.name || "Unassigned";

    const time = studentTimeStatus(student);

    const grid = document.getElementById("studentProfileGrid");

    document.getElementById("studentProfileTitle").textContent =
        student.name + " — Profile";

    grid.innerHTML =
        profileItem("Email", student.email) +
        profileItem("Phone Number", student.phone) +
        profileItem("Sex", student.gender) +
        profileItem("Date of Birth", student.dob) +
        profileItem("Address", student.address, true) +
        profileItem("Guardian Name", student.guardianName) +
        profileItem("Guardian Phone", student.guardianPhone) +
        profileItem("Program", student.program) +
        profileItem("Assigned Teacher", teacherName) +
        profileItem("Start Date", student.startDate) +
        profileItem("Stop Date", student.stopDate) +
        profileItem("Subscription Status", time.label) +
        profileItem(
            "Expected Payment",
            money(student.expectedPayment)
        ) +
        profileItem(
            "Amount Paid",
            money(student.amountPaid)
        ) +
        profileItem(
            "Teacher Commission (⅓ of Paid)",
            money(toCommission(student.amountPaid))
        ) +
        profileItem(
            "Payment Status",
            isFullyPaid(student)
                ? "Fully Paid"
                : "Balance Due"
        );

    studentProfileModal.classList.add("active");
}

document.getElementById("closeStudentProfileModal").onclick = () => {
    studentProfileModal.classList.remove("active");
    viewingStudentId = null;
};

document.getElementById("closeStudentProfileBtn").onclick = () => {
    studentProfileModal.classList.remove("active");
    viewingStudentId = null;
};

document.getElementById("editFromProfile").onclick = () => {
    if (!viewingStudentId) return;

    studentProfileModal.classList.remove("active");

    openStudentModal(viewingStudentId);

    viewingStudentId = null;
};

//==================================================
// BUTTON WIRING - OPEN
//==================================================

document.getElementById("addTeacherBtn").onclick = () =>
    openTeacherModal();

document.getElementById("addStudentBtn").onclick = () =>
    openStudentModal();

document.getElementById("paymentBtn").onclick = () => {
    paymentModal.classList.add("active");
};

//==================================================
// BUTTON WIRING - CANCEL / CLOSE
//==================================================

document.getElementById("cancelTeacher").onclick =
    closeTeacherModal;

document.getElementById("closeTeacherModal").onclick =
    closeTeacherModal;

document.getElementById("cancelStudent").onclick =
    closeStudentModal;

document.getElementById("closeStudentModal").onclick =
    closeStudentModal;

document.getElementById("cancelPayment").onclick = () => {
    paymentModal.classList.remove("active");
};

document.getElementById("closePaymentModal").onclick = () => {
    paymentModal.classList.remove("active");
};

document.getElementById("closeDashboardModal").onclick = () => {
    dashboardModal.classList.remove("active");
};

document.getElementById("closeTeacherViewModal").onclick =
    closeTeacherViewModal;

function closeTeacherViewModal() {
    teacherViewModal.classList.remove("active");

    document.getElementById("teacherViewFrame").src =
        "about:blank";
}

//==================================================
// REFRESH BUTTON
//==================================================

document.getElementById("refreshBtn").onclick = () => {
    teacherSearch.value = "";
    studentSearch.value = "";

    if (studentFilter) {
        studentFilter.value = "all";
    }

    if (studentTeacherFilter) {
        studentTeacherFilter.value = "all";
    }

    studentsExpanded = false;

    renderTeachers();
    renderStudents();

    toast("Dashboard refreshed");
};

//==================================================
// ADD / UPDATE TEACHER
//==================================================

document.getElementById("saveTeacher").onclick = () => {
    const name =
        document.getElementById("teacherName").value.trim();

    const phone =
        document.getElementById("teacherPhone").value.trim();

    const address =
        document.getElementById("teacherAddress").value.trim();

    if (name === "") {
        toast("Enter teacher name");
        return;
    }

    if (editingTeacherId) {
        update(
            ref(
                db,
                "lessonPayment/teachers/" +
                editingTeacherId
            ),
            {
                name,
                phone,
                address
            }
        );

        toast("Teacher updated successfully");
    } else {
        const teacherId =
            push(teachersRef).key;

        const dashboardKey =
            generateKey();

        set(
            ref(
                db,
                "lessonPayment/teachers/" +
                teacherId
            ),
            {
                name,
                phone,
                address,
                dashboardKey,
                createdAt: Date.now()
            }
        );

        toast("Teacher added successfully");
    }

    closeTeacherModal();
};

//==================================================
// TEACHER SELECT ELEMENTS
//==================================================

const teacherSelect =
    document.getElementById("teacherSelect");

const paymentTeacher =
    document.getElementById("paymentTeacher");

//==================================================
// LOAD TEACHERS
//==================================================

onValue(teachersRef, (snapshot) => {
    teachers = snapshot.val() || {};

    populateTeacherDropdowns();
    renderTeachers();
    renderStudents();
    renderPayments();
    calculateTotals();
});

function populateTeacherDropdowns() {
    const currentTeacherSelectValue =
        teacherSelect.value;

    const currentPaymentTeacherValue =
        paymentTeacher.value;

    const currentStudentTeacherFilterValue =
        studentTeacherFilter
            ? studentTeacherFilter.value
            : "all";

    teacherSelect.innerHTML =
        '<option value="">Select Teacher</option>';

    paymentTeacher.innerHTML =
        '<option value="">Select Teacher</option>';

    if (studentTeacherFilter) {
        studentTeacherFilter.innerHTML =
            '<option value="all">All Teachers</option>';
    }

    Object.keys(teachers).forEach((id) => {
        const teacher = teachers[id];

        const option1 =
            document.createElement("option");

        option1.value = id;
        option1.textContent = teacher.name;

        teacherSelect.appendChild(option1);

        const option2 =
            option1.cloneNode(true);

        paymentTeacher.appendChild(option2);

        if (studentTeacherFilter) {
            const option3 =
                option1.cloneNode(true);

            studentTeacherFilter.appendChild(option3);
        }
    });

    teacherSelect.value =
        currentTeacherSelectValue;

    paymentTeacher.value =
        currentPaymentTeacherValue;

    if (studentTeacherFilter) {
        studentTeacherFilter.value =
            currentStudentTeacherFilterValue;
    }
}

//==================================================
// PROGRAM OPTIONS
//==================================================

const studentProgramSelect =
    document.getElementById("studentProgram");

onValue(programsRef, (snapshot) => {
    customPrograms = snapshot.val() || {};
    populateProgramOptions();
});

function allProgramNames() {
    const extras =
        Object.values(customPrograms)
            .filter(
                (p) => !DEFAULT_PROGRAMS.includes(p)
            );

    return [
        ...DEFAULT_PROGRAMS,
        ...extras
    ];
}

function populateProgramOptions(selectValue) {
    if (!studentProgramSelect) return;

    const keep =
        selectValue !== undefined
            ? selectValue
            : studentProgramSelect.value;

    studentProgramSelect.innerHTML =
        '<option value="">Select Program</option>';

    allProgramNames().forEach((name) => {
        const option =
            document.createElement("option");

        option.value = name;
        option.textContent = name;

        studentProgramSelect.appendChild(option);
    });

    const addOption =
        document.createElement("option");

    addOption.value =
        ADD_PROGRAM_VALUE;

    addOption.textContent =
        "+ Add New Program...";

    studentProgramSelect.appendChild(addOption);

    studentProgramSelect.value = keep;
}

if (studentProgramSelect) {
    studentProgramSelect.addEventListener(
        "change",
        () => {
            if (
                studentProgramSelect.value !==
                ADD_PROGRAM_VALUE
            ) {
                return;
            }

            const entered =
                (
                    prompt(
                        "Enter the new program/course name:"
                    ) || ""
                ).trim();

            if (entered === "") {
                populateProgramOptions("");
                return;
            }

            const exists =
                allProgramNames().some(
                    (p) =>
                        p.toLowerCase() ===
                        entered.toLowerCase()
                );

            if (!exists) {
                const newId =
                    push(programsRef).key;

                set(
                    ref(
                        db,
                        "lessonPayment/programs/" +
                        newId
                    ),
                    entered
                );
            }

            setTimeout(() => {
                populateProgramOptions(entered);
            }, 250);
        }
    );
}

//==================================================
// RENDER TEACHERS
//==================================================

function renderTeachers() {
    const filter =
        (teacherSearch.value || "")
            .trim()
            .toLowerCase();

    teacherTable.innerHTML = "";

    let count = 0;
    let visibleCount = 0;

    Object.keys(teachers).forEach((id) => {
        count++;

        const teacher = teachers[id];

        if (
            filter &&
            !teacher.name
                .toLowerCase()
                .includes(filter)
        ) {
            return;
        }

        visibleCount++;

        let studentCountForTeacher = 0;
        let expected = 0;

        // Teacher earnings are exactly 33% of every student's
        // amount paid.
        //
        // Deleted students remain part of the financial history,
        // so deleting a student does not erase earnings already
        // counted toward the teacher.

        Object.keys(students).forEach(
            (studentId) => {
                const student =
                    students[studentId];

                if (
                    student.teacherId !== id
                ) {
                    return;
                }

                expected += toCommission(
                    student.amountPaid
                );

                if (!student.isDeleted) {
                    studentCountForTeacher++;
                }
            }
        );

        const received =
            acknowledgedReceivedForTeacher(id);

        const balance =
            expected - received;

        teacherTable.innerHTML += `
<tr>
<td>${escapeHtml(teacher.name)}</td>
<td>${escapeHtml(teacher.phone) || "-"}</td>
<td>${studentCountForTeacher}</td>
<td>${money(expected)}</td>
<td>${money(received)}</td>
<td>${balanceBadge(balance)}</td>
<td class="dashboard-actions">
<button
    class="outline-btn view-dashboard"
    data-id="${id}">
    View
</button>

<button
    class="outline-btn copy-link"
    data-id="${id}">
    Copy Link
</button>
</td>
<td>
<button
    class="primary-btn editTeacher"
    data-id="${id}">
    Edit
</button>

<button
    class="danger-btn deleteTeacher"
    data-id="${id}">
    Delete
</button>
</td>
</tr>
`;
    });

    if (count === 0) {
        teacherTable.innerHTML =
            `<tr>
                <td colspan="8" class="empty">
                    No teachers found
                </td>
            </tr>`;
    } else if (visibleCount === 0) {
        teacherTable.innerHTML =
            `<tr>
                <td colspan="8" class="empty">
                    No teachers match your search
                </td>
            </tr>`;
    }

    teacherCount.textContent = count;

    attachViewDashboardEvents();
    attachCopyEvents();
    attachTeacherRowEvents();
}

//==================================================
// VIEW TEACHER DASHBOARD
//==================================================

function attachViewDashboardEvents() {
    document
        .querySelectorAll(".view-dashboard")
        .forEach((button) => {
            button.onclick = () => {
                const teacher =
                    teachers[button.dataset.id];

                if (!teacher) return;

                const currentPath =
                    window.location.pathname;

                const folderPath =
                    currentPath.substring(
                        0,
                        currentPath.lastIndexOf("/") + 1
                    );

                const url =
                    window.location.origin +
                    folderPath +
                    "teacher.html" +
                    "?id=" +
                    teacher.dashboardKey;

                document.getElementById(
                    "teacherViewTitle"
                ).textContent =
                    teacher.name +
                    " — Dashboard";

                document.getElementById(
                    "openTeacherViewTab"
                ).href = url;

                document.getElementById(
                    "teacherViewFrame"
                ).src = url;

                teacherViewModal.classList.add(
                    "active"
                );
            };
        });
}

//==================================================
// COPY DASHBOARD LINK
//==================================================

function attachCopyEvents() {
    document
        .querySelectorAll(".copy-link")
        .forEach((button) => {
            button.onclick = () => {
                const teacher =
                    teachers[button.dataset.id];

                if (!teacher) return;

                const currentPath =
                    window.location.pathname;

                const folderPath =
                    currentPath.substring(
                        0,
                        currentPath.lastIndexOf("/") + 1
                    );

                const url =
                    window.location.origin +
                    folderPath +
                    "teacher.html" +
                    "?id=" +
                    teacher.dashboardKey;

                const linkInput =
                    document.getElementById(
                        "dashboardLink"
                    );

                linkInput.value = url;

                dashboardModal.classList.add(
                    "active"
                );
            };
        });
}

document.getElementById(
    "copyDashboardLink"
).onclick = () => {
    const linkInput =
        document.getElementById(
            "dashboardLink"
        );

    linkInput.select();

    navigator.clipboard.writeText(
        linkInput.value
    );

    toast("Dashboard link copied");
};

//==================================================
// TEACHER ROW EVENTS
//==================================================

function attachTeacherRowEvents() {
    document
        .querySelectorAll(".editTeacher")
        .forEach((button) => {
            button.onclick = () => {
                openTeacherModal(
                    button.dataset.id
                );
            };
        });

    document
        .querySelectorAll(".deleteTeacher")
        .forEach((button) => {
            button.onclick = () => {
                deletePath =
                    "lessonPayment/teachers/" +
                    button.dataset.id;

                deleteType = "teacher";

                document.getElementById(
                    "deleteModalText"
                ).textContent =
                    "Are you sure you want to delete this teacher record?";

                deleteModal.classList.add(
                    "active"
                );
            };
        });
}

//==================================================
// ADD / UPDATE STUDENT
//==================================================

document.getElementById(
    "saveStudent"
).onclick = () => {
    const name =
        document.getElementById(
            "studentName"
        ).value.trim();

    const email =
        document.getElementById(
            "studentEmail"
        ).value.trim();

    const phone =
        document.getElementById(
            "studentPhone"
        ).value.trim();

    const gender =
        document.getElementById(
            "studentGender"
        ).value;

    const dob =
        document.getElementById(
            "studentDob"
        ).value;

    const address =
        document.getElementById(
            "studentAddress"
        ).value.trim();

    const guardianName =
        document.getElementById(
            "guardianName"
        ).value.trim();

    const guardianPhone =
        document.getElementById(
            "guardianPhone"
        ).value.trim();

    const program =
        document.getElementById(
            "studentProgram"
        ).value;

    const startDate =
        document.getElementById(
            "startDate"
        ).value;

    const stopDate =
        document.getElementById(
            "stopDate"
        ).value;

    // These remain FULL student fee figures in Firebase.
    const expectedPayment =
        Number(
            document.getElementById(
                "expectedPayment"
            ).value
        );

    const amountPaidRaw =
        document.getElementById(
            "amountPaid"
        ).value;

    const amountPaid =
        amountPaidRaw === ""
            ? 0
            : Number(amountPaidRaw);

    const teacherId =
        teacherSelect.value;

    if (
        name === "" ||
        program === "" ||
        teacherId === ""
    ) {
        toast(
            "Complete all required fields"
        );

        return;
    }

    if (
        !expectedPayment ||
        expectedPayment <= 0
    ) {
        toast(
            "Enter the expected payment (total fee)"
        );

        return;
    }

    if (amountPaid < 0) {
        toast(
            "Amount paid cannot be negative"
        );

        return;
    }

    if (
        startDate &&
        stopDate &&
        stopDate < startDate
    ) {
        toast(
            "Stop date cannot be before start date"
        );

        return;
    }

    if (
        email !== "" &&
        !/^\S+@\S+\.\S+$/.test(email)
    ) {
        toast(
            "Enter a valid email address"
        );

        return;
    }

    const studentData = {
        name,
        email,
        phone,
        gender,
        dob,
        address,
        guardianName,
        guardianPhone,
        program,
        startDate,
        stopDate,
        expectedPayment,
        amountPaid,
        teacherId
    };

    if (editingStudentId) {
        update(
            ref(
                db,
                "lessonPayment/students/" +
                editingStudentId
            ),
            studentData
        );

        toast(
            "Student updated successfully"
        );
    } else {
        const studentId =
            push(studentsRef).key;

        set(
            ref(
                db,
                "lessonPayment/students/" +
                studentId
            ),
            {
                ...studentData,
                isDeleted: false,
                createdAt: Date.now()
            }
        );

        toast(
            "Student added successfully"
        );
    }

    closeStudentModal();
};

//==================================================
// LOAD STUDENTS
//==================================================

onValue(studentsRef, (snapshot) => {
    students = snapshot.val() || {};

    renderTeachers();
    renderStudents();
    calculateTotals();
});

//==================================================
// RENDER STUDENTS
//==================================================

function renderStudents() {
    const filter =
        (studentSearch.value || "")
            .trim()
            .toLowerCase();

    const category =
        studentFilter
            ? studentFilter.value
            : "all";

    const teacherFilterId =
        studentTeacherFilter
            ? studentTeacherFilter.value
            : "all";

    // Only active students appear in the list.
    // Deleted students remain in Firebase for financial history.

    const activeIds =
        Object.keys(students)
            .filter(
                (id) =>
                    !students[id].isDeleted
            );

    const searchedIds =
        activeIds.filter((id) => {
            if (!filter) return true;

            return (
                students[id].name || ""
            )
                .toLowerCase()
                .includes(filter);
        });

    const teacherFilteredIds =
        searchedIds.filter((id) => {
            if (
                teacherFilterId === "all"
            ) {
                return true;
            }

            return (
                students[id].teacherId ===
                teacherFilterId
            );
        });

    const filteredIds =
        teacherFilteredIds.filter(
            (id) => {
                if (category === "all") {
                    return true;
                }

                const student =
                    students[id];

                if (
                    category === "paid"
                ) {
                    return isFullyPaid(
                        student
                    );
                }

                if (
                    category === "balance"
                ) {
                    return !isFullyPaid(
                        student
                    );
                }

                const time =
                    studentTimeStatus(
                        student
                    );

                if (
                    category === "expired"
                ) {
                    return (
                        time.category ===
                        "expired"
                    );
                }

                if (
                    category ===
                    "ending_soon"
                ) {
                    return (
                        time.category ===
                        "ending_soon"
                    );
                }

                if (
                    category === "active"
                ) {
                    return (
                        time.category ===
                        "active"
                    );
                }

                if (
                    category === "nodate"
                ) {
                    return (
                        time.category ===
                        "none"
                    );
                }

                return true;
            }
        );

    const visibleIds =
        studentsExpanded
            ? filteredIds
            : filteredIds.slice(
                0,
                STUDENT_PAGE_SIZE
            );

    studentTable.innerHTML = "";

    visibleIds.forEach(
        (studentId) => {
            const student =
                students[studentId];

            const teacherNameForRow =
                teachers[
                    student.teacherId
                ]?.name ||
                "Unknown";

            const timeStatus =
                studentTimeStatus(
                    student
                );

            // The students table shows the REAL/FULL amounts the
            // student owes and has paid — never the teacher's ⅓
            // commission. Commission only appears on the Teachers
            // table and the dashboard summary cards.

            studentTable.innerHTML += `
<tr>
<td>
${escapeHtml(student.name)}
</td>

<td>
${escapeHtml(teacherNameForRow)}
</td>

<td>
<span class="program-tag">
${escapeHtml(student.program) || "-"}
</span>
</td>

<td>
${student.startDate || "-"}
</td>

<td>
${student.stopDate || "-"}
</td>

<td>
${money(student.expectedPayment)}
</td>

<td>
${money(student.amountPaid)}
</td>

<td>
${paymentStatusBadge(student)}
</td>

<td>
${timeStatusBadge(timeStatus)}
</td>

<td>
<a
    href="#"
    class="receipt-link printReceipt"
    data-id="${studentId}">
    Print Receipt
</a>
</td>

<td>
<button
    class="outline-btn small-btn viewStudent"
    data-id="${studentId}">
    View
</button>

<button
    class="primary-btn editStudent"
    data-id="${studentId}">
    Edit
</button>

<button
    class="danger-btn deleteStudent"
    data-id="${studentId}">
    Delete
</button>
</td>
</tr>
`;
        }
    );

    if (activeIds.length === 0) {
        studentTable.innerHTML =
            `<tr>
                <td
                    colspan="11"
                    class="empty">
                    No students available
                </td>
            </tr>`;
    } else if (
        filteredIds.length === 0
    ) {
        studentTable.innerHTML =
            `<tr>
                <td
                    colspan="11"
                    class="empty">
                    No students match your search/filter
                </td>
            </tr>`;
    }

    studentCount.textContent =
        activeIds.length;

    renderStudentTableFooter(
        filteredIds.length
    );

    attachStudentRowEvents();
}

//==================================================
// STUDENT TABLE FOOTER
//==================================================

function renderStudentTableFooter(
    filteredCount
) {
    const footer =
        document.getElementById(
            "studentTableFooter"
        );

    if (!footer) return;

    if (
        filteredCount <=
        STUDENT_PAGE_SIZE
    ) {
        footer.innerHTML = "";
        return;
    }

    const remaining =
        filteredCount -
        STUDENT_PAGE_SIZE;

    footer.innerHTML =
        studentsExpanded
            ? `
<button
    class="outline-btn small-btn"
    id="toggleStudentsBtn">
    Show Less
</button>
`
            : `
<button
    class="outline-btn small-btn"
    id="toggleStudentsBtn">
    Show ${remaining} More
</button>
`;

    document.getElementById(
        "toggleStudentsBtn"
    ).onclick = () => {
        studentsExpanded =
            !studentsExpanded;

        renderStudents();
    };
}

//==================================================
// STUDENT ROW EVENTS
//==================================================

function attachStudentRowEvents() {
    document
        .querySelectorAll(".viewStudent")
        .forEach((button) => {
            button.onclick = () => {
                openStudentProfile(
                    button.dataset.id
                );
            };
        });

    document
        .querySelectorAll(".editStudent")
        .forEach((button) => {
            button.onclick = () => {
                openStudentModal(
                    button.dataset.id
                );
            };
        });

    document
        .querySelectorAll(".deleteStudent")
        .forEach((button) => {
            button.onclick = () => {
                deletePath =
                    "lessonPayment/students/" +
                    button.dataset.id;

                deleteType = "student";

                document.getElementById(
                    "deleteModalText"
                ).textContent =
                    "This removes the student from the active list. Payments already counted toward the assigned teacher's earnings will be preserved.";

                deleteModal.classList.add(
                    "active"
                );
            };
        });

    document
        .querySelectorAll(".printReceipt")
        .forEach((link) => {
            link.onclick = (e) => {
                e.preventDefault();

                const student =
                    students[
                        link.dataset.id
                    ];

                if (!student) return;

                const teacherName =
                    teachers[
                        student.teacherId
                    ]?.name ||
                    "Unassigned";

                printStudentReceipt(
                    student,
                    teacherName
                );
            };
        });
}

//==================================================
// SEARCH LISTENERS
//==================================================

teacherSearch.addEventListener(
    "input",
    renderTeachers
);

studentSearch.addEventListener(
    "input",
    () => {
        studentsExpanded = false;
        renderStudents();
    }
);

if (studentFilter) {
    studentFilter.addEventListener(
        "change",
        () => {
            studentsExpanded = false;
            renderStudents();
        }
    );
}

if (studentTeacherFilter) {
    studentTeacherFilter.addEventListener(
        "change",
        () => {
            studentsExpanded = false;
            renderStudents();
        }
    );
}

//==================================================
// KEEP SUBSCRIPTION TIMER FRESH
//==================================================

setInterval(
    () => {
        renderStudents();
    },
    5 * 60 * 1000
);

//==================================================
// RECORD TEACHER PAYMENT
//==================================================
//
// Teacher payments recorded here are the actual amounts paid
// out to the teacher. These are NOT multiplied by 33% because
// they represent money already paid to the teacher.
//
//==================================================

document.getElementById(
    "savePayment"
).onclick = () => {
    const teacherId =
        paymentTeacher.value;

    const type =
        document.getElementById(
            "paymentType"
        ).value || "add";

    const amount =
        Number(
            document.getElementById(
                "paymentAmount"
            ).value
        );

    const date =
        document.getElementById(
            "paymentDate"
        ).value;

    const remark =
        document.getElementById(
            "paymentRemark"
        ).value.trim();

    if (
        teacherId === "" ||
        !amount ||
        amount <= 0
    ) {
        toast(
            "Select teacher and enter amount"
        );

        return;
    }

    const paymentId =
        push(
            ref(
                db,
                "lessonPayment/teacherPayments/" +
                teacherId
            )
        ).key;

    set(
        ref(
            db,
            "lessonPayment/teacherPayments/" +
            teacherId +
            "/" +
            paymentId
        ),
        {
            amount,
            type,
            date,
            remark,
            status: "pending",
            createdAt: Date.now()
        }
    );

    paymentModal.classList.remove(
        "active"
    );

    document.getElementById(
        "paymentAmount"
    ).value = "";

    document.getElementById(
        "paymentDate"
    ).value = "";

    document.getElementById(
        "paymentRemark"
    ).value = "";

    document.getElementById(
        "paymentType"
    ).selectedIndex = 0;

    paymentTeacher.selectedIndex = 0;

    toast(
        "Payment entry recorded — awaiting teacher acknowledgement"
    );
};

//==================================================
// LOAD PAYMENTS
//==================================================

onValue(paymentsRef, (snapshot) => {
    payments = snapshot.val() || {};

    renderTeachers();
    renderPayments();
    calculateTotals();
});

//==================================================
// ACKNOWLEDGED TEACHER PAYMENTS
//==================================================
//
// Only acknowledged payments count as money already paid
// to the teacher.
//
// Legacy records without status/type are treated as
// acknowledged additions so historical totals remain unchanged.
//
//==================================================

function acknowledgedReceivedForTeacher(
    teacherId
) {
    let received = 0;

    const teacherPayments =
        payments[teacherId] || {};

    Object.values(
        teacherPayments
    ).forEach((payment) => {
        const status =
            payment.status ||
            "acknowledged";

        if (
            status !== "acknowledged"
        ) {
            return;
        }

        const type =
            payment.type || "add";

        const amt =
            Number(
                payment.amount || 0
            );

        received +=
            type === "deduct"
                ? -amt
                : amt;
    });

    return received;
}

//==================================================
// RENDER PAYMENTS
//==================================================

function renderPayments() {
    paymentTable.innerHTML = "";

    let hasPayment = false;

    Object.keys(payments).forEach(
        (teacherId) => {
            Object.keys(
                payments[teacherId]
            ).forEach(
                (paymentId) => {
                    hasPayment = true;

                    const payment =
                        payments[
                            teacherId
                        ][paymentId];

                    const status =
                        payment.status ||
                        "acknowledged";

                    const type =
                        payment.type ||
                        "add";

                    const sign =
                        type === "deduct"
                            ? "−"
                            : "+";

                    const badgeCls =
                        type === "deduct"
                            ? "badge-negative"
                            : "badge-positive";

                    paymentTable.innerHTML += `
<tr>
<td>
${escapeHtml(
    teachers[teacherId]?.name
) || "-"}
</td>

<td>
<span
    class="balance-badge ${badgeCls}">
    ${sign}${money(payment.amount)}
</span>
</td>

<td>
${payment.date || "-"}
</td>

<td>
${escapeHtml(payment.remark) || "-"}
</td>

<td>
<span
    class="status-badge status-${status}">
    ${
        status === "acknowledged"
            ? "Acknowledged"
            : "Pending"
    }
</span>
</td>
</tr>
`;
                }
            );
        }
    );

    if (!hasPayment) {
        paymentTable.innerHTML =
            `<tr>
                <td
                    colspan="5"
                    class="empty">
                    No payment history available
                </td>
            </tr>`;
    }
}

//==================================================
// DASHBOARD TOTALS
//==================================================
//
// Full student fees remain stored in Firebase.
//
// Teacher commission:
// Full expected fees × 33%
// Full amount paid × 33%
//
// Example:
// ₦1,000,000 × 0.33 = ₦330,000
//
//==================================================

function calculateTotals() {
    let expectedFull = 0;
    let paidFull = 0;

    Object.values(students).forEach(
        (student) => {
            expectedFull +=
                Number(
                    student.expectedPayment ||
                    0
                );

            paidFull +=
                Number(
                    student.amountPaid ||
                    0
                );
        }
    );

    let paidOut = 0;

    Object.keys(payments).forEach(
        (teacherId) => {
            paidOut +=
                acknowledgedReceivedForTeacher(
                    teacherId
                );
        }
    );

    // Exactly 33% of full student fees.
    const commissionExpected =
        toCommission(
            expectedFull
        );

    const commissionEarned =
        toCommission(
            paidFull
        );

    const commissionUnearned =
        commissionExpected -
        commissionEarned;

    const commissionPayable =
        commissionEarned -
        paidOut;

    commissionExpectedFull.textContent =
        money(
            commissionExpected
        );

    commissionEarnedTotal.textContent =
        money(
            commissionEarned
        );

    commissionUnearnedTotal.textContent =
        money(
            commissionUnearned
        );

    commissionPaidOutTotal.textContent =
        money(
            paidOut
        );

    commissionPayableTotal.textContent =
        money(
            commissionPayable
        );

    setBalanceCardTone(
        commissionUnearnedTotal,
        commissionUnearned
    );

    setBalanceCardTone(
        commissionPayableTotal,
        commissionPayable
    );
}

//==================================================
// BALANCE CARD TONE
//==================================================

function setBalanceCardTone(
    element,
    diff
) {
    const card =
        element.closest(
            ".summary-card"
        );

    if (!card) return;

    card.classList.remove(
        "card-positive",
        "card-negative",
        "card-neutral"
    );

    card.classList.add(
        diff > 0
            ? "card-negative"
            : diff < 0
                ? "card-positive"
                : "card-neutral"
    );
}

//==================================================
// DELETE CONFIRMATION MODAL
//==================================================
//
// Students are soft-deleted so their historical amounts
// continue counting toward teacher earnings.
//
// Teachers are fully removed as before.
//
//==================================================

const confirmDelete =
    document.getElementById(
        "confirmDelete"
    );

const cancelDelete =
    document.getElementById(
        "cancelDelete"
    );

cancelDelete.onclick = () => {
    deleteModal.classList.remove(
        "active"
    );

    deletePath = "";
    deleteType = "";
};

confirmDelete.onclick = () => {
    if (deletePath === "") {
        return;
    }

    if (deleteType === "student") {
        update(
            ref(db, deletePath),
            {
                isDeleted: true,
                deletedAt: Date.now()
            }
        );

        toast(
            "Student removed from active list"
        );
    } else {
        remove(
            ref(db, deletePath)
        );

        toast(
            "Record deleted successfully"
        );
    }

    deleteModal.classList.remove(
        "active"
    );

    deletePath = "";
    deleteType = "";
};

//==================================================
// CLOSE MODALS WHEN CLICKING OUTSIDE
//==================================================

[
    teacherModal,
    studentModal,
    paymentModal,
    dashboardModal,
    teacherViewModal,
    studentProfileModal,
    deleteModal
].forEach((modal) => {
    if (!modal) return;

    modal.addEventListener(
        "click",
        (e) => {
            if (e.target !== modal) {
                return;
            }

            modal.classList.remove(
                "active"
            );

            if (
                modal === deleteModal
            ) {
                deletePath = "";
                deleteType = "";
            }

            if (
                modal === teacherModal
            ) {
                editingTeacherId = null;
            }

            if (
                modal === studentModal
            ) {
                editingStudentId = null;
            }

            if (
                modal === studentProfileModal
            ) {
                viewingStudentId = null;
            }

            if (
                modal === teacherViewModal
            ) {
                document.getElementById(
                    "teacherViewFrame"
                ).src =
                    "about:blank";
            }
        }
    );
});

//==================================================
// FINISH LOADING
//==================================================

window.addEventListener(
    "load",
    () => {
        const loading =
            document.getElementById(
                "loadingScreen"
            );

        if (loading) {
            loading.style.display =
                "none";
        }
    }
);
