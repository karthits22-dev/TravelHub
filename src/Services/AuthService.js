const AUTH_API_BASE_URL = 'https://travelhubbackend-4.onrender.com/api/auth';

// Assumes the backend takes POST { mobileNumber: "+91XXXXXXXXXX" } and
// replies with { success: true, message } / { success: false, message } —
// adjust the body/response shape here if your endpoint differs.
export async function sendOtp(mobileNumber) {
  const fullNumber = `+91${mobileNumber}`;
  console.log("OTPPP",fullNumber)

  let res;
  try {
    res = await fetch(`${AUTH_API_BASE_URL}/send-otp`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({phone: fullNumber}),
    });
  } catch (err) {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  let json = null;
  try {
    json = await res.json();
  } catch (err) {
    // Non-JSON response — the status-based error below still applies.
  }

  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || `Failed to send OTP (status ${res.status}).`);
  }

  return json;
}

// Assumes POST { mobileNumber: "+91XXXXXXXXXX", otp: "123456" } replying
// with the same { success, message } shape as sendOtp — adjust the body
// field names here if your endpoint expects something different (e.g. a
// `code` field instead of `otp`).
export async function verifyOtp(mobileNumber, otp) {
  const fullNumber = `+91${mobileNumber}`;

  let res;
  try {
    res = await fetch(`${AUTH_API_BASE_URL}/verify-otp`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({phone: fullNumber, otp}),
    });
  } catch (err) {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }

  let json = null;
  try {
    json = await res.json();
  } catch (err) {
    // Non-JSON response — the status-based error below still applies.
  }

  if (!res.ok || json?.success === false) {
    throw new Error(json?.message || `Incorrect or expired code. Please try again.`);
  }

  return json;
}
