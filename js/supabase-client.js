// ============================================================
// Maverick Barbier — Supabase booking integration
//
// 1. Create a free project at https://supabase.com
// 2. Run supabase/schema.sql in the SQL editor (creates "reservations" table)
// 3. Paste your project URL + anon public key below
// 4. Deploy — that's it, the form will write straight to your table
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ---- 🔧 EDIT THESE TWO LINES with your own Supabase project values ----
const SUPABASE_URL = 'https://YOUR-PROJECT-REF.supabase.co';
const SUPABASE_ANON_KEY = 'YOUR-SUPABASE-ANON-PUBLIC-KEY';
// -------------------------------------------------------------------------

const isConfigured =
  !SUPABASE_URL.includes('YOUR-PROJECT-REF') &&
  !SUPABASE_ANON_KEY.includes('YOUR-SUPABASE-ANON-PUBLIC-KEY');

const supabase = isConfigured ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const form = document.getElementById('bookingForm');
const statusEl = document.getElementById('formStatus');

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.className = `form-status ${type || ''}`.trim();
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = form.querySelector('button[type="submit"]');

    const payload = {
      name: form.name.value.trim(),
      phone: form.phone.value.trim(),
      email: form.email.value.trim(),
      service: form.service.value,
      barber: form.barber.value || 'No preference',
      booking_date: form.date.value,
      booking_time: form.time.value,
      notes: form.notes.value.trim(),
    };

    if (!payload.name || !payload.phone || !payload.email || !payload.service || !payload.booking_date || !payload.booking_time) {
      setStatus('Please fill in every required field.', 'err');
      return;
    }

    if (!isConfigured) {
      // Supabase isn't wired up yet — tell the developer, not the customer, what's wrong.
      console.warn('[Maverick Barbier] Supabase is not configured yet. Edit js/supabase-client.js with your project URL and anon key.');
      setStatus('Booking system is not connected yet. (Add your Supabase keys in js/supabase-client.js)', 'err');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Booking…';
    setStatus('', '');

    const { error } = await supabase.from('reservations').insert([payload]);

    submitBtn.disabled = false;
    submitBtn.textContent = 'Confirm Reservation';

    if (error) {
      console.error(error);
      setStatus('Something went wrong — please call us or try again.', 'err');
      return;
    }

    setStatus(`Thanks ${payload.name.split(' ')[0]}! Your booking request is in — we'll confirm by email.`, 'ok');
    form.reset();
  });
}
