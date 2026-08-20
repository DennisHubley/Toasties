/* ============================================================
   TOASTIES SITE SETTINGS
   This is the ONLY file you need to edit to connect the schedule
   and social links. Save, refresh, done. See README.md for the
   step-by-step Google Calendar setup.
   ============================================================ */

window.TOASTIES_CONFIG = {

  /* ---- Google Calendar (the "Find the Trailer" section) ----
     1) In Google Calendar, make your schedule calendar PUBLIC
        (Settings → Access permissions → "Make available to public").
     2) Copy the Calendar ID from Settings → "Integrate calendar"
        and paste it below. It looks like:
        "abc123xyz@group.calendar.google.com"
  */
  calendarId: "toastiescheeseshack@gmail.com",

  /* 3) OPTIONAL but recommended: a Google Calendar API key.
        With a key, upcoming stops render as nice cards below.
        Without a key, the site falls back to Google's own embedded
        calendar view. See README.md → "Create an API key".
  */
  apiKey: "",

  /* Time zone used to display event times. */
  timeZone: "America/Halifax",

  /* How many upcoming stops to show. */
  maxEvents: 8,

  /* ---- Contact & social ---- Leave blank to hide a link. */
  instagram: "",          // e.g. "https://www.instagram.com/toasties"
  facebook: "",           // e.g. "https://www.facebook.com/toasties"
  email: "",              // e.g. "hello@toasties.ca"
  phone: "",              // e.g. "+1 902 555 0123"

  /* Shown in the footer and used for catering / event enquiries. */
  cateringBlurb: "Booking a festival, market, wedding or staff party? Get in touch and we'll bring the Toasties to you.",
};
