const MATHCLOUD_CONFIG = Object.freeze({
  appName: "MathCloud Tutorial",
  examName: "JAMB Preparation",
  annualFee: 3000,
  subscriptionDays: 365,
  examQuestions: 180,
  examMinutes: 120,
  englishQuestionCount: 60,
  otherSubjectQuestionCount: 40,
  jambMaximumScore: 400,
  initialAdminEmail: "marshall12340@gmail.com",
  flutterwavePaymentLink: "https://flutterwave.com/pay/7n1wlo69qnrs",
  officialIBASS: "https://eligibility.jamb.gov.ng/",
  whatsappNumber: "2349129225442",
  calculatorSubjects: ["mathematics","physics","chemistry","economics","principles-of-accounts","geography","agriculture","commerce","computer-studies"]
});


/*
 * Registration catalogue. These are preparation-platform defaults, not a substitute
 * for JAMB's live IBASS eligibility checker. Institution/programme eligibility can
 * vary by institution and admission year; students should verify on IBASS before
 * final JAMB registration.
 */
const JAMB_COURSE_CATALOG = Object.freeze([
  {id:"medicine-and-surgery",name:"Medicine and Surgery",subjects:["english","physics","chemistry","biology"],institutions:["Ahmadu Bello University (ABU)","University of Abuja (UNIABUJA)","University of Benin (UNIBEN)","University of Ibadan (UI)","University of Ilorin (UNILORIN)","University of Lagos (UNILAG)","University of Nigeria, Nsukka (UNN)","University of Port Harcourt (UNIPORT)","University of Nigeria Teaching Hospital/affiliated options"]},
  {id:"dentistry",name:"Dentistry",subjects:["english","physics","chemistry","biology"],institutions:["University of Benin (UNIBEN)","University of Ibadan (UI)","University of Lagos (UNILAG)","University of Nigeria, Nsukka (UNN)","University of Port Harcourt (UNIPORT)"]},
  {id:"pharmacy",name:"Pharmacy",subjects:["english","physics","chemistry","biology"],institutions:["Ahmadu Bello University (ABU)","University of Benin (UNIBEN)","University of Ibadan (UI)","University of Lagos (UNILAG)","University of Nigeria, Nsukka (UNN)","University of Port Harcourt (UNIPORT)"]},
  {id:"nursing-science",name:"Nursing Science",subjects:["english","physics","chemistry","biology"],institutions:["Ahmadu Bello University (ABU)","University of Abuja (UNIABUJA)","University of Benin (UNIBEN)","University of Ibadan (UI)","University of Ilorin (UNILORIN)","University of Lagos (UNILAG)","University of Nigeria, Nsukka (UNN)","University of Port Harcourt (UNIPORT)"]},
  {id:"medical-laboratory-science",name:"Medical Laboratory Science",subjects:["english","physics","chemistry","biology"],institutions:["University of Benin (UNIBEN)","University of Calabar (UNICAL)","University of Ibadan (UI)","University of Jos (UNIJOS)","University of Nigeria, Nsukka (UNN)","University of Port Harcourt (UNIPORT)"]},
  {id:"biochemistry",name:"Biochemistry",subjects:["english","physics","chemistry","biology"],institutions:["Ahmadu Bello University (ABU)","University of Abuja (UNIABUJA)","University of Benin (UNIBEN)","University of Ibadan (UI)","University of Lagos (UNILAG)","University of Nigeria, Nsukka (UNN)"]},
  {id:"microbiology",name:"Microbiology",subjects:["english","physics","chemistry","biology"],institutions:["University of Abuja (UNIABUJA)","University of Benin (UNIBEN)","University of Ibadan (UI)","University of Lagos (UNILAG)","University of Nigeria, Nsukka (UNN)","University of Port Harcourt (UNIPORT)"]},
  {id:"computer-science",name:"Computer Science",subjects:["english","mathematics","physics","chemistry"],institutions:["Ahmadu Bello University (ABU)","University of Abuja (UNIABUJA)","University of Benin (UNIBEN)","University of Ibadan (UI)","University of Ilorin (UNILORIN)","University of Lagos (UNILAG)","University of Nigeria, Nsukka (UNN)","University of Port Harcourt (UNIPORT)"]},
  {id:"software-engineering",name:"Software Engineering",subjects:["english","mathematics","physics","chemistry"],institutions:["University of Abuja (UNIABUJA)","University of Benin (UNIBEN)","University of Lagos (UNILAG)","University of Nigeria, Nsukka (UNN)","University of Port Harcourt (UNIPORT)"]},
  {id:"electrical-electronics-engineering",name:"Electrical / Electronic Engineering",subjects:["english","mathematics","physics","chemistry"],institutions:["Ahmadu Bello University (ABU)","University of Benin (UNIBEN)","University of Ibadan (UI)","University of Ilorin (UNILORIN)","University of Lagos (UNILAG)","University of Nigeria, Nsukka (UNN)","University of Port Harcourt (UNIPORT)"]},
  {id:"civil-engineering",name:"Civil Engineering",subjects:["english","mathematics","physics","chemistry"],institutions:["Ahmadu Bello University (ABU)","University of Benin (UNIBEN)","University of Ibadan (UI)","University of Ilorin (UNILORIN)","University of Lagos (UNILAG)","University of Nigeria, Nsukka (UNN)"]},
  {id:"mechanical-engineering",name:"Mechanical Engineering",subjects:["english","mathematics","physics","chemistry"],institutions:["Ahmadu Bello University (ABU)","University of Benin (UNIBEN)","University of Ibadan (UI)","University of Ilorin (UNILORIN)","University of Lagos (UNILAG)","University of Nigeria, Nsukka (UNN)"]},
  {id:"architecture",name:"Architecture",subjects:["english","mathematics","physics","chemistry"],institutions:["Ahmadu Bello University (ABU)","University of Abuja (UNIABUJA)","University of Benin (UNIBEN)","University of Jos (UNIJOS)","University of Lagos (UNILAG)","University of Nigeria, Nsukka (UNN)"]},
  {id:"quantity-surveying",name:"Quantity Surveying",subjects:["english","mathematics","physics","economics"],institutions:["Ahmadu Bello University (ABU)","University of Benin (UNIBEN)","University of Ilorin (UNILORIN)","University of Lagos (UNILAG)","University of Nigeria, Nsukka (UNN)"]},
  {id:"law",name:"Law",subjects:["english","literature","government","crs"],institutions:["Ahmadu Bello University (ABU)","University of Abuja (UNIABUJA)","University of Benin (UNIBEN)","University of Ibadan (UI)","University of Ilorin (UNILORIN)","University of Lagos (UNILAG)","University of Nigeria, Nsukka (UNN)","University of Port Harcourt (UNIPORT)"]},
  {id:"mass-communication",name:"Mass Communication",subjects:["english","literature","government","economics"],institutions:["University of Abuja (UNIABUJA)","University of Benin (UNIBEN)","University of Ilorin (UNILORIN)","University of Lagos (UNILAG)","University of Nigeria, Nsukka (UNN)"]},
  {id:"political-science",name:"Political Science",subjects:["english","government","history","economics"],institutions:["Ahmadu Bello University (ABU)","University of Abuja (UNIABUJA)","University of Benin (UNIBEN)","University of Ibadan (UI)","University of Ilorin (UNILORIN)","University of Lagos (UNILAG)","University of Nigeria, Nsukka (UNN)"]},
  {id:"economics",name:"Economics",subjects:["english","mathematics","economics","government"],institutions:["Ahmadu Bello University (ABU)","University of Abuja (UNIABUJA)","University of Benin (UNIBEN)","University of Ibadan (UI)","University of Ilorin (UNILORIN)","University of Lagos (UNILAG)","University of Nigeria, Nsukka (UNN)"]},
  {id:"accounting",name:"Accounting",subjects:["english","mathematics","economics","commerce"],institutions:["Ahmadu Bello University (ABU)","University of Abuja (UNIABUJA)","University of Benin (UNIBEN)","University of Ibadan (UI)","University of Ilorin (UNILORIN)","University of Lagos (UNILAG)","University of Nigeria, Nsukka (UNN)"]},
  {id:"business-administration",name:"Business Administration",subjects:["english","mathematics","economics","commerce"],institutions:["Ahmadu Bello University (ABU)","University of Abuja (UNIABUJA)","University of Benin (UNIBEN)","University of Ibadan (UI)","University of Ilorin (UNILORIN)","University of Lagos (UNILAG)"]},
  {id:"education",name:"Education",subjects:["english","government","economics","literature"],institutions:["University of Abuja (UNIABUJA)","University of Benin (UNIBEN)","University of Ibadan (UI)","University of Ilorin (UNILORIN)","University of Nigeria, Nsukka (UNN)"]},
  {id:"english-and-literary-studies",name:"English and Literary Studies",subjects:["english","literature","government","history"],institutions:["Ahmadu Bello University (ABU)","University of Abuja (UNIABUJA)","University of Benin (UNIBEN)","University of Ibadan (UI)","University of Ilorin (UNILORIN)","University of Lagos (UNILAG)","University of Nigeria, Nsukka (UNN)"]},
  {id:"geography",name:"Geography",subjects:["english","geography","economics","government"],institutions:["Ahmadu Bello University (ABU)","University of Abuja (UNIABUJA)","University of Ibadan (UI)","University of Ilorin (UNILORIN)","University of Lagos (UNILAG)"]},
  {id:"estate-management",name:"Estate Management",subjects:["english","mathematics","economics","geography"],institutions:["Ahmadu Bello University (ABU)","University of Benin (UNIBEN)","University of Ilorin (UNILORIN)","University of Lagos (UNILAG)"]},
  {id:"agricultural-science",name:"Agricultural Science",subjects:["english","chemistry","biology","agriculture"],institutions:["Ahmadu Bello University (ABU)","University of Abuja (UNIABUJA)","University of Ibadan (UI)","University of Nigeria, Nsukka (UNN)"]}
]);
const JAMB_INSTITUTIONS = Object.freeze([...new Set(JAMB_COURSE_CATALOG.flatMap(x=>x.institutions))].sort());
function getCourseById(id){return JAMB_COURSE_CATALOG.find(x=>x.id===id)||null;}
function getCourseSubjects(id){return getCourseById(id)?.subjects||[];}
