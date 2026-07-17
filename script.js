document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("rsvpForm");
    const formMessage = document.getElementById("form-message");
    const submitButton = form?.querySelector('button[type="submit"]');
    const submitLabel = submitButton?.querySelector(".submit-label");
    const submitLoading = submitButton?.querySelector(".submit-loading");

    if (!form || !formMessage || !submitButton) {
        return;
    }

    const scriptURL = "https://script.google.com/macros/s/AKfycbxqKhRaUJ9FqDHXIF-TUcaKJpWz_3BgH1ytJx9UPfFnG4dcdteceFiI7G3U1KEv_3_ynQ/exec";
    const saturdayCheckbox = document.getElementById("Attendance_Saturday");
    const sundayCheckbox = document.getElementById("Attendance_Sunday");
    const attendanceGroup = document.getElementById("attendance-group");
    const attendanceError = document.getElementById("attendance-error");
    const lodgingGroup = document.getElementById("lodging-group");
    const lodgingError = document.getElementById("lodging-error");
    const transportationGroup = document.getElementById("transportation-group");
    const transportationError = document.getElementById("transportation-error");
    const fields = [
        document.getElementById("Name"),
        document.getElementById("Phone"),
        document.getElementById("Email"),
        document.getElementById("Attendees")
    ].filter(Boolean);

    function setFieldError(field, message) {
        const errorElement = document.getElementById(`${field.id}-error`);
        field.setAttribute("aria-invalid", message ? "true" : "false");

        if (errorElement) {
            errorElement.textContent = message;
        }
    }

    function getFieldError(field) {
        if (field.required && typeof field.value === "string" && !field.value.trim()) {
            return "Please complete this field.";
        }

        if (field.validity.valueMissing) {
            return "Please complete this field.";
        }

        if (field.validity.typeMismatch) {
            return "Please enter a valid email address.";
        }

        if (field.validity.rangeUnderflow) {
            return "Please enter at least 1 attendee.";
        }

        if (field.validity.rangeOverflow) {
            return "Please enter no more than 99 attendees.";
        }

        return "";
    }

    function validateForm() {
        let firstInvalidField = null;

        fields.forEach((field) => {
            const message = getFieldError(field);
            setFieldError(field, message);

            if (message && !firstInvalidField) {
                firstInvalidField = field;
            }
        });

        const hasAttendance = saturdayCheckbox.checked || sundayCheckbox.checked;
        attendanceGroup.setAttribute("aria-invalid", hasAttendance ? "false" : "true");
        attendanceError.textContent = hasAttendance ? "" : "Please select at least one day.";

        if (!hasAttendance && !firstInvalidField) {
            firstInvalidField = saturdayCheckbox;
        }

        const lodging = form.querySelector('input[name="Lodging"]:checked');
        lodgingGroup.setAttribute("aria-invalid", lodging ? "false" : "true");
        lodgingError.textContent = lodging ? "" : "Please select Yes or No.";

        if (!lodging && !firstInvalidField) {
            firstInvalidField = document.getElementById("lodging-no");
        }

        const transportation = form.querySelector('input[name="Transportation"]:checked');
        transportationGroup.setAttribute("aria-invalid", transportation ? "false" : "true");
        transportationError.textContent = transportation ? "" : "Please select Yes or No.";

        if (!transportation && !firstInvalidField) {
            firstInvalidField = document.getElementById("transportation-no");
        }

        if (firstInvalidField) {
            firstInvalidField.focus();
            return false;
        }

        return true;
    }

    function setSubmitting(isSubmitting) {
        submitButton.disabled = isSubmitting;
        submitButton.setAttribute("aria-busy", String(isSubmitting));
        submitLabel.hidden = isSubmitting;
        submitLoading.hidden = !isSubmitting;
    }

    function showMessage(type, message, shouldFocus = false) {
        formMessage.className = `form-message is-visible ${type}`;
        formMessage.textContent = message;

        if (shouldFocus) {
            formMessage.focus();
        }
    }

    function clearMessage() {
        formMessage.className = "form-message";
        formMessage.textContent = "";
    }

    function buildPayload() {
        const lodging = form.querySelector('input[name="Lodging"]:checked');
        const transportation = form.querySelector('input[name="Transportation"]:checked');
        const payload = new URLSearchParams();

        payload.set("Name", document.getElementById("Name").value.trim());
        payload.set("Phone", document.getElementById("Phone").value.trim());
        payload.set("Email", document.getElementById("Email").value.trim());
        payload.set("Attendees", document.getElementById("Attendees").value);

        // Keep the legacy sheet column names so the existing Apps Script remains compatible.
        payload.set("Service_Music_Rehearsal", saturdayCheckbox.checked ? "Yes" : "No");
        payload.set("Service_Seeking_Gifts", sundayCheckbox.checked ? "Yes" : "No");
        payload.set("Service_Youth_Meeting", sundayCheckbox.checked ? "Yes" : "No");

        payload.set("Lodging", lodging.value);
        payload.set("Transportation", transportation.value);
        payload.set("Comments", document.getElementById("Comments").value.trim());
        payload.set("Timestamp", new Date().toISOString());

        return payload.toString();
    }

    fields.forEach((field) => {
        field.addEventListener("input", () => {
            if (field.getAttribute("aria-invalid") === "true") {
                setFieldError(field, getFieldError(field));
            }
        });
    });

    [saturdayCheckbox, sundayCheckbox].forEach((checkbox) => {
        checkbox.addEventListener("change", () => {
            if (saturdayCheckbox.checked || sundayCheckbox.checked) {
                attendanceGroup.setAttribute("aria-invalid", "false");
                attendanceError.textContent = "";
            }
        });
    });

    form.querySelectorAll('input[name="Lodging"]').forEach((radio) => {
        radio.addEventListener("change", () => {
            lodgingGroup.setAttribute("aria-invalid", "false");
            lodgingError.textContent = "";
        });
    });

    form.querySelectorAll('input[name="Transportation"]').forEach((radio) => {
        radio.addEventListener("change", () => {
            transportationGroup.setAttribute("aria-invalid", "false");
            transportationError.textContent = "";
        });
    });

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        clearMessage();

        if (!validateForm()) {
            showMessage("error", "Please review the highlighted fields and try again.");
            return;
        }

        setSubmitting(true);
        showMessage("loading", "Submitting your RSVP…");

        const xhr = new XMLHttpRequest();
        xhr.open("POST", scriptURL, true);
        xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        xhr.timeout = 20000;

        xhr.onload = () => {
            setSubmitting(false);

            if (xhr.status >= 200 && xhr.status < 300) {
                form.reset();
                fields.forEach((field) => setFieldError(field, ""));
                attendanceGroup.setAttribute("aria-invalid", "false");
                lodgingGroup.setAttribute("aria-invalid", "false");
                transportationGroup.setAttribute("aria-invalid", "false");
                showMessage("success", "Thank you. Your RSVP has been submitted successfully.", true);
                return;
            }

            showMessage("error", "We could not submit your RSVP. Please try again or contact one of the local brethren.", true);
        };

        xhr.onerror = () => {
            setSubmitting(false);
            showMessage("error", "We could not connect to the RSVP service. Please check your connection and try again.", true);
        };

        xhr.ontimeout = () => {
            setSubmitting(false);
            showMessage("error", "The RSVP request took too long. Please try again.", true);
        };

        xhr.send(buildPayload());
    });
});
