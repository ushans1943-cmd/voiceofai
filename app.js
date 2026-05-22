const micBtn = document.getElementById("micBtn");
const liveTranscript = document.getElementById("liveTranscript");
const chatBox = document.getElementById("chatBox");
const appointmentCard = document.getElementById("appointmentCard");

const socket = new WebSocket("ws://3.106.191.160:8000/ws");

let recognition;
let isListening = false;
let finalTranscript = "";

// ==========================
// Speech Recognition
// ==========================
if ("webkitSpeechRecognition" in window) {

    recognition = new webkitSpeechRecognition();

} else {

    alert(
        "Speech Recognition not supported"
    );
}

recognition.continuous = true;

recognition.interimResults = true;

recognition.lang = "en-IN";

// ==========================
// Mic Button
// ==========================
micBtn.onclick = () => {

    if (!isListening) {

        finalTranscript = "";

        recognition.start();

        isListening = true;

        micBtn.innerText =
            "🎙 Listening...";

    } else {

        recognition.stop();

        isListening = false;

        micBtn.innerText =
            "🎤 Start Speaking";
    }
};

// ==========================
// Live Listening
// ==========================
recognition.onresult = (event) => {

    let interimTranscript = "";

    for (
        let i = event.resultIndex;
        i < event.results.length;
        ++i
    ) {

        const transcript =
            event.results[i][0].transcript;

        if (event.results[i].isFinal) {

            finalTranscript +=
                transcript + " ";

        } else {

            interimTranscript += transcript;
        }
    }

    liveTranscript.innerHTML = `
        <div class="live-box">
            <b>Listening:</b><br>
            ${finalTranscript}
            <span class="interim">
                ${interimTranscript}
            </span>
        </div>
    `;
};

// ==========================
// When Speech Ends
// ==========================
recognition.onend = () => {

    isListening = false;

    micBtn.innerText =
        "🎤 Start Speaking";

    const cleanedTranscript =
        finalTranscript.trim();

    if (cleanedTranscript.length > 0) {

        addMessage(
            "You",
            cleanedTranscript,
            "user-message"
        );

        socket.send(cleanedTranscript);
    }

    finalTranscript = "";
};

// ==========================
// Receive AI Response
// ==========================
socket.onmessage = (event) => {

    const data = JSON.parse(event.data);

    addMessage(
        "AI",
        data.response,
        "ai-message"
    );

    speakText(data.response);

    // MULTIPLE APPOINTMENTS
    if (
        data.appointment &&
        Array.isArray(data.appointment)
    ) {

        showAppointments(
            data.appointment
        );
    }
};

// ==========================
// Add Message
// ==========================
function addMessage(
    sender,
    text,
    className
) {

    const messageDiv =
        document.createElement("div");

    messageDiv.className =
        `message ${className}`;

    messageDiv.innerHTML = `
        <div class="sender">
            ${sender}
        </div>

        <div class="text">
            ${text}
        </div>
    `;

    chatBox.appendChild(messageDiv);

    chatBox.scrollTop =
        chatBox.scrollHeight;
}

// ==========================
// AI Voice
// ==========================
function speakText(text) {

    window.speechSynthesis.cancel();

    const speech =
        new SpeechSynthesisUtterance(
            text
        );

    speech.lang = "en-IN";

    speech.rate = 1;

    speech.pitch = 1;

    window.speechSynthesis.speak(
        speech
    );
}

// ==========================
// Show ALL Appointments
// ==========================
function showAppointments(
    appointments
) {

    appointmentCard.innerHTML = "";

    appointments.forEach((appt) => {

        appointmentCard.innerHTML += `
            <div class="appointment-box">

                <div class="appointment-item">
                    <b>Name:</b>
                    ${appt.patient_name}
                </div>

                <div class="appointment-item">
                    <b>Age:</b>
                    ${appt.age}
                </div>

                <div class="appointment-item">
                    <b>Doctor:</b>
                    ${appt.doctor}
                </div>

                <div class="appointment-item">
                    <b>Date:</b>
                    ${appt.date}
                </div>

                <div class="appointment-item">
                    <b>Slot:</b>
                    ${appt.slot}
                </div>

                <div class="appointment-item">
                    <b>Reason:</b>
                    ${appt.reason}
                </div>

                <div class="appointment-status">
                    ✅ Appointment Booked
                </div>

            </div>
        `;
    });
}