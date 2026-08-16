/* ==========================================================================
   Toasties — site behaviour
   - Renders the menu from js/menu.js
   - Loads the schedule from Google Calendar (settings in js/config.js)
   - Nav, scroll reveal, gallery lightbox, contact/social buttons
   Plain JS, no build step. Loaded as a classic script after config/menu.
   ========================================================================== */
(function () {
  'use strict';

  const CFG  = window.TOASTIES_CONFIG || {};
  const MENU = window.TOASTIES_MENU || { sections: [] };
  const $  = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /* Tiny DOM builder: h('div.foo', {attr: v}, child, 'text', [more]) */
  function h(tag, attrs, ...children) {
    const [name, ...classes] = tag.split('.');
    const el = document.createElement(name || 'div');
    if (classes.length) el.className = classes.join(' ');
    if (attrs && typeof attrs === 'object' && !(attrs instanceof Node) && !Array.isArray(attrs)) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'html') el.innerHTML = v;            // only used with trusted, site-authored strings
        else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    } else if (attrs != null) {
      children.unshift(attrs);
    }
    for (const c of children.flat(Infinity)) {
      if (c == null || c === false) continue;
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  /* ======================================================================
     MENU
     ====================================================================== */
  function initial(name) {
    return String(name || '?').replace(/^the\s+/i, '').trim().charAt(0).toUpperCase();
  }

  function renderMenuItem(item) {
    const thumb = item.photo
      ? h('div.menu-item__thumb', h('img', { src: 'assets/gallery/' + item.photo, alt: '', loading: 'lazy', width: 64, height: 64, style: item.focus ? 'object-position:' + item.focus : null }))
      : h('div.menu-item__thumb', { 'aria-hidden': 'true' }, initial(item.name));
    return h('li.menu-item',
      thumb,
      h('div.menu-item__body',
        h('div.menu-item__name', item.name, item.tag ? h('span.tag', item.tag) : null),
        item.desc ? h('p.menu-item__desc', item.desc) : null
      ),
      h('div.menu-item__price', item.price)
    );
  }

  function renderMenu() {
    const root = $('#menu-root');
    if (!root) return;
    root.textContent = '';

    (MENU.sections || []).forEach(sec => {
      root.append(h('section.menu-block.reveal', { id: 'menu-' + sec.id },
        h('header.menu-block__head',
          h('div',
            h('h3.menu-block__title', sec.title),
            sec.subtitle ? h('p.menu-block__subtitle', sec.subtitle) : null
          ),
          sec.upgrade ? h('span.menu-block__upgrade', sec.upgrade.label, h('b', '+$' + sec.upgrade.price)) : null
        ),
        h('ul.menu-items', (sec.items || []).map(renderMenuItem))
      ));
    });

    const extras = h('div.menu-grid-3');
    if (MENU.addOns) {
      extras.append(h('section.menu-block.reveal', { id: 'menu-add-ons' },
        h('header.menu-block__head', h('div',
          h('h3.menu-block__title', MENU.addOns.title),
          MENU.addOns.subtitle ? h('p.menu-block__subtitle', MENU.addOns.subtitle) : null
        )),
        h('div.addons__groups', (MENU.addOns.groups || []).map(g =>
          h('div.addons__group',
            h('div.addons__price', g.price),
            h('ul.addons__list', g.items.map(i => h('li', i)))
          )
        ))
      ));
    }
    const stack = h('div.menu-stack');
    for (const key of ['sides', 'drinks']) {
      const block = MENU[key];
      if (!block) continue;
      stack.append(h('section.menu-block.reveal', { id: 'menu-' + key },
        h('header.menu-block__head', h('h3.menu-block__title', block.title)),
        h('ul.simple-list', block.items.map(i => h('li', h('span', i.name), h('span.menu-item__price', i.price))))
      ));
    }
    if (stack.childElementCount) extras.append(stack);
    root.append(extras);

    const notes = $('#menu-notes');
    if (notes && MENU.notes) {
      notes.textContent = '';
      Object.values(MENU.notes).forEach(n => notes.append(h('span', n)));
    }
  }

  /* ======================================================================
     SCHEDULE — Google Calendar
     ====================================================================== */
  const TZ = CFG.timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const fmt = {
    dow:  new Intl.DateTimeFormat('en-CA', { weekday: 'short', timeZone: TZ }),
    dowL: new Intl.DateTimeFormat('en-CA', { weekday: 'long', timeZone: TZ }),
    day:  new Intl.DateTimeFormat('en-CA', { day: 'numeric', timeZone: TZ }),
    mon:  new Intl.DateTimeFormat('en-CA', { month: 'short', timeZone: TZ }),
    monL: new Intl.DateTimeFormat('en-CA', { month: 'long', timeZone: TZ }),
    time: new Intl.DateTimeFormat('en-CA', { hour: 'numeric', minute: '2-digit', timeZone: TZ }),
    ymd:  new Intl.DateTimeFormat('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: TZ }),
  };
  // Local-date formatters for all-day events (their date has no time zone).
  const fmtLocal = {
    dow:  new Intl.DateTimeFormat('en-CA', { weekday: 'short' }),
    dowL: new Intl.DateTimeFormat('en-CA', { weekday: 'long' }),
    day:  new Intl.DateTimeFormat('en-CA', { day: 'numeric' }),
    mon:  new Intl.DateTimeFormat('en-CA', { month: 'short' }),
    monL: new Intl.DateTimeFormat('en-CA', { month: 'long' }),
  };

  function tidyTime(s) { return s.replace(/ /g, ' ').replace(':00', ''); }
  function ymdInTZ(date) { return fmt.ymd.format(date); }              // "2026-08-22"
  function ymdFromLocalParts(y, m, d) { return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }

  /** Normalise a Google Calendar event into what the UI needs. */
  function normaliseEvent(ev, now) {
    const allDay = !!(ev.start && ev.start.date);
    let start, end, ymd, dateFmt;
    if (allDay) {
      const [y, m, d] = ev.start.date.split('-').map(Number);
      start = new Date(y, m - 1, d);                            // local midnight on that calendar date
      const [ey, em, ed] = (ev.end && ev.end.date ? ev.end.date : ev.start.date).split('-').map(Number);
      end = new Date(ey, em - 1, ed);                            // exclusive
      ymd = ymdFromLocalParts(y, m, d);
      dateFmt = fmtLocal;
    } else {
      start = new Date(ev.start.dateTime);
      end = new Date(ev.end && ev.end.dateTime ? ev.end.dateTime : ev.start.dateTime);
      ymd = ymdInTZ(start);
      dateFmt = fmt;
    }
    const todayYmd = ymdInTZ(now);
    const tomorrow = new Date(now.getTime() + 864e5);
    const tomorrowYmd = ymdInTZ(tomorrow);

    // Google Calendar descriptions may contain HTML. Turn line breaks into newlines, then strip tags safely.
    const description = ev.description
      ? new DOMParser().parseFromString(
          String(ev.description).replace(/<br\s*\/?>/gi, '\n').replace(/<\/(p|div|li)>/gi, '\n'),
          'text/html'
        ).body.textContent.replace(/\n{3,}/g, '\n\n').trim()
      : '';

    return {
      id: ev.id,
      title: ev.summary || 'Toasties',
      location: ev.location || '',
      description: description.length > 220 ? description.slice(0, 217).trimEnd() + '…' : description,
      link: ev.htmlLink || '',
      allDay, start, end, ymd,
      isNow: !allDay ? (start <= now && now < end) : (ymd === todayYmd),
      isToday: ymd === todayYmd,
      isTomorrow: ymd === tomorrowYmd,
      dow: dateFmt.dow.format(start),
      dowL: dateFmt.dowL.format(start),
      day: dateFmt.day.format(start),
      mon: dateFmt.mon.format(start),
      monL: dateFmt.monL.format(start),
      timeRange: allDay ? 'All day' : `${tidyTime(fmt.time.format(start))} – ${tidyTime(fmt.time.format(end))}`,
    };
  }

  function mapsUrl(q) { return 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(q); }

  const ICON = {
    clock: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    pin:   '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 21s-6-5.3-6-10a6 6 0 1 1 12 0c0 4.7-6 10-6 10z"/><circle cx="12" cy="11" r="2.2"/></svg>',
  };

  function renderStop(e, featured) {
    let badge = null;
    if (e.isNow && !e.allDay) badge = h('span.stop__badge.stop__badge--now', 'Happening now');
    else if (e.isToday)       badge = h('span.stop__badge', 'Today');
    else if (e.isTomorrow)    badge = h('span.stop__badge', 'Tomorrow');
    else if (featured)        badge = h('span.stop__badge', 'Next stop');

    const actions = [];
    if (e.location) actions.push(h('a.btn.btn--small.btn--yellow', { href: mapsUrl(e.location), target: '_blank', rel: 'noopener' }, 'Get directions'));
    if (e.link)     actions.push(h('a.btn.btn--small.btn--ghost',  { href: e.link, target: '_blank', rel: 'noopener' }, 'Add to my calendar'));

    return h('article.stop' + (featured ? '.stop--featured' : ''),
      h('div.stop__date',
        h('span.dow', e.dow), h('span.day', e.day), h('span.mon', e.mon)
      ),
      h('div.stop__body',
        badge,
        h('h3.stop__title', e.title),
        h('div.stop__meta',
          h('span', { html: ICON.clock }, ' ', `${e.dowL}, ${e.monL} ${e.day} · ${e.timeRange}`),
          e.location ? h('span', { html: ICON.pin }, ' ', e.location) : null
        ),
        (featured && e.description) ? h('p.stop__desc', e.description) : null,
        actions.length ? h('div.stop__actions', actions) : null
      )
    );
  }

  function renderSchedule(events, opts = {}) {
    const root = $('#schedule-root');
    root.textContent = '';

    if (opts.sample) {
      root.append(h('div.schedule__banner',
        h('strong', 'Sample schedule.'),
        ' Connect Brett\'s Google Calendar in ', h('code', 'js/config.js'), ' and real stops will show up here automatically.'
      ));
    }

    if (!events.length) {
      root.append(h('div.schedule__empty',
        h('h3', 'Nothing on the calendar just yet'),
        h('p', 'We\'re between events — check back soon or follow us on social for the next stop.')
      ));
      if (opts.calendarId) root.append(subscribeCard(opts.calendarId));
      return;
    }

    const [first, ...rest] = events;
    const primary = h('div.schedule__primary', renderStop(first, true));
    if (opts.calendarId) primary.append(subscribeCard(opts.calendarId));
    root.append(primary);
    if (rest.length) {
      root.append(h('div.schedule__list',
        h('h3.schedule__list-title', 'Coming up'),
        rest.map(e => renderStop(e, false))
      ));
    }

    // Hero chip
    const chip = $('#hero-next-stop');
    if (chip) {
      const when = first.isNow && !first.allDay ? 'Happening now' : first.isToday ? 'Today' : first.isTomorrow ? 'Tomorrow' : `${first.dow} ${first.mon} ${first.day}`;
      const text = $('.next-stop__text', chip);
      text.textContent = '';
      text.append(h('b', when + ':'), ' ', first.title);
      if (opts.sample) text.append(h('span.tag', { style: 'margin-left:.5rem' }, 'sample'));
      chip.hidden = false;
    }
  }

  function renderEmbed(calendarId, note) {
    const root = $('#schedule-root');
    root.textContent = '';
    if (note) root.append(h('div.schedule__banner', note));
    const src = 'https://calendar.google.com/calendar/embed?src=' + encodeURIComponent(calendarId)
      + '&ctz=' + encodeURIComponent(TZ)
      + '&mode=AGENDA&showTitle=0&showPrint=0&showTabs=0&showCalendars=0&showTz=0&showNav=1&showDate=1';
    root.append(h('div.schedule__embed',
      h('iframe', { src, title: 'Toasties schedule', loading: 'lazy', referrerpolicy: 'no-referrer-when-downgrade' })
    ));
  }

  function subscribeCard(calendarId) {
    const enc = encodeURIComponent(calendarId);
    return h('div.subscribe-card',
      h('h4', 'Never miss a stop'),
      h('p', 'Follow our schedule in your own calendar app — new stops show up automatically.'),
      h('div.subscribe-card__actions',
        h('a.btn.btn--small.btn--ghost', { href: 'https://calendar.google.com/calendar/render?cid=' + enc, target: '_blank', rel: 'noopener' }, 'Google Calendar'),
        h('a.btn.btn--small.btn--ghost', { href: 'webcal://calendar.google.com/calendar/ical/' + enc + '/public/basic.ics' }, 'Apple / Outlook')
      )
    );
  }

  /** Placeholder events so the design is visible before the calendar is connected. */
  function sampleEvents() {
    const now = new Date();
    const nextDow = (dow, hour) => {
      const d = new Date(now); d.setHours(hour, 0, 0, 0);
      const delta = (dow - d.getDay() + 7) % 7 || 7;
      d.setDate(d.getDate() + delta);
      return d;
    };
    const mk = (title, start, hours, location, description) => ({
      id: title, summary: title, location, description,
      start: { dateTime: start.toISOString() },
      end:   { dateTime: new Date(start.getTime() + hours * 36e5).toISOString() },
    });
    const sat = nextDow(6, 9), sun = nextDow(0, 11), thu = nextDow(4, 16);
    const sat2 = new Date(sat); sat2.setDate(sat2.getDate() + 7);
    return [
      mk('Farmers\' Market — Lunenburg', sat, 4, 'Lunenburg, NS', 'Toastie of the Day: The Golden Onion with local caramelized onions. Come early — the Dilly sells out.'),
      mk('Beach Day — Rissers Beach', sun, 5, 'Rissers Beach Provincial Park, NS'),
      mk('Community Concert in the Park', thu, 3, 'Bridgewater, NS'),
      mk('Farmers\' Market — Hubbards', sat2, 4, 'Hubbards, NS'),
    ];
  }

  async function loadSchedule() {
    const calendarId = (CFG.calendarId || '').trim();
    const apiKey = (CFG.apiKey || '').trim();
    const now = new Date();

    if (!calendarId) {
      const sample = sampleEvents().map(e => normaliseEvent(e, now)).sort((a, b) => a.start - b.start);
      renderSchedule(sample, { sample: true });
      return;
    }

    if (!apiKey) {
      renderEmbed(calendarId);
      $('#schedule-root').append(subscribeCard(calendarId));
      return;
    }

    const timeMin = new Date(now.getTime() - 24 * 36e5).toISOString(); // include events that started earlier today
    const url = 'https://www.googleapis.com/calendar/v3/calendars/' + encodeURIComponent(calendarId) + '/events'
      + '?key=' + encodeURIComponent(apiKey)
      + '&timeMin=' + encodeURIComponent(timeMin)
      + '&maxResults=' + encodeURIComponent(Math.min(50, (CFG.maxEvents || 8) + 10))
      + '&singleEvents=true&orderBy=startTime'
      + '&timeZone=' + encodeURIComponent(TZ)
      + '&fields=items(id,summary,description,location,start,end,htmlLink,status)';

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Calendar API ' + res.status);
      const data = await res.json();
      const events = (data.items || [])
        .filter(ev => ev.status !== 'cancelled' && ev.start)
        .map(ev => normaliseEvent(ev, now))
        .filter(e => e.end > now)                     // hide stops that have already wrapped up
        .sort((a, b) => a.start - b.start)
        .slice(0, CFG.maxEvents || 8);
      renderSchedule(events, { calendarId });
    } catch (err) {
      console.warn('[Toasties] Calendar API failed, falling back to embed:', err);
      renderEmbed(calendarId, 'Live schedule is temporarily unavailable — here\'s the calendar view instead.');
      $('#schedule-root').append(subscribeCard(calendarId));
    }
  }

  /* ======================================================================
     CONTACT + SOCIAL
     ====================================================================== */
  const SOCIAL_ICON = {
    instagram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 7.3a4.7 4.7 0 1 0 0 9.4 4.7 4.7 0 0 0 0-9.4zm0 7.7a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm5.9-7.9a1.1 1.1 0 1 1-2.2 0 1.1 1.1 0 0 1 2.2 0zM12 2c-2.7 0-3 0-4.1.1-3.3.1-5.7 2.5-5.8 5.8C2 9 2 9.3 2 12s0 3 .1 4.1c.1 3.3 2.5 5.7 5.8 5.8C9 22 9.3 22 12 22s3 0 4.1-.1c3.3-.1 5.7-2.5 5.8-5.8.1-1.1.1-1.4.1-4.1s0-3-.1-4.1c-.1-3.3-2.5-5.7-5.8-5.8C15 2 14.7 2 12 2zm0 1.8c2.7 0 3 0 4 .1 2.4.1 3.9 1.6 4 4 .1 1 .1 1.3.1 4s0 3-.1 4c-.1 2.4-1.6 3.9-4 4-1 .1-1.3.1-4 .1s-3 0-4-.1c-2.4-.1-3.9-1.6-4-4-.1-1-.1-1.3-.1-4s0-3 .1-4c.1-2.4 1.6-3.9 4-4 1-.1 1.3-.1 4-.1z"/></svg>',
    facebook:  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg>',
    email:     '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm0 2v.5l8 5 8-5V6H4zm16 2.8-8 5-8-5V18h16V8.8z"/></svg>',
    phone:     '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8a15 15 0 0 0 6.6 6.6l2.2-2.2a1 1 0 0 1 1-.25 11.4 11.4 0 0 0 3.6.57 1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1L6.6 10.8z"/></svg>',
  };

  function renderContact() {
    const blurb = $('#contact-blurb');
    if (blurb) blurb.textContent = CFG.cateringBlurb || 'Get in touch and we\'ll bring the Toasties to you.';

    const actions = $('#contact-actions');
    const social = $('#footer-social');
    const links = [];
    if (CFG.email)     links.push({ key: 'email',     label: 'Email us',            href: 'mailto:' + CFG.email });
    if (CFG.phone)     links.push({ key: 'phone',     label: 'Call or text',        href: 'tel:' + String(CFG.phone).replace(/[^\d+]/g, '') });
    if (CFG.instagram) links.push({ key: 'instagram', label: 'Instagram',           href: CFG.instagram });
    if (CFG.facebook)  links.push({ key: 'facebook',  label: 'Facebook',            href: CFG.facebook });

    if (actions) {
      actions.textContent = '';
      if (links.length) {
        links.forEach((l, i) => actions.append(
          h('a.btn' + (i === 0 ? '' : '.btn--light'), { href: l.href, target: l.href.startsWith('http') ? '_blank' : null, rel: 'noopener' },
            h('span', { html: SOCIAL_ICON[l.key], style: 'display:inline-flex;width:18px;height:18px' }), l.label)
        ));
      } else {
        actions.append(h('p.contact__hint', 'Contact details coming soon — add an email or social link in js/config.js to show buttons here.'));
      }
    }
    if (social) {
      social.textContent = '';
      links.forEach(l => social.append(
        h('a.social-btn', { href: l.href, target: l.href.startsWith('http') ? '_blank' : null, rel: 'noopener', 'aria-label': l.label },
          h('span', { html: SOCIAL_ICON[l.key], style: 'display:inline-flex;width:18px;height:18px' }), l.label)
      ));
    }
  }

  /* ======================================================================
     NAV, REVEAL, LIGHTBOX, MISC
     ====================================================================== */
  function initNav() {
    const header = $('.site-header');
    const toggle = $('.nav__toggle');
    const links = $('#nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', () => {
        const open = links.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(open));
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });
      $$('a', links).forEach(a => a.addEventListener('click', () => {
        links.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
      }));
      document.addEventListener('keydown', e => { if (e.key === 'Escape' && links.classList.contains('is-open')) toggle.click(); });
    }
    const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    // Active section highlighting
    const navAnchors = $$('.nav__links a[href^="#"]');
    const sections = navAnchors.map(a => $(a.getAttribute('href'))).filter(Boolean);
    if ('IntersectionObserver' in window && sections.length) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(en => {
          if (!en.isIntersecting) return;
          navAnchors.forEach(a => a.classList.toggle('is-active', a.getAttribute('href') === '#' + en.target.id));
        });
      }, { rootMargin: '-40% 0px -55% 0px' });
      sections.forEach(s => io.observe(s));
    }
  }

  function initReveal() {
    const targets = $$('.section__head, .menu-block, .stop, .gallery__item, .about__photo, .about__copy, .contact__card');
    targets.forEach(t => t.classList.add('reveal'));
    if (!('IntersectionObserver' in window)) { targets.forEach(t => t.classList.add('is-visible')); return; }
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
    targets.forEach(t => io.observe(t));
    return io;
  }

  function initLightbox() {
    const dlg = $('#lightbox');
    const img = $('#lightbox-img');
    if (!dlg || !img || typeof dlg.showModal !== 'function') return;
    $$('.gallery__item').forEach(btn => btn.addEventListener('click', () => {
      const src = btn.dataset.full;
      const alt = ($('img', btn) || {}).alt || '';
      img.src = src; img.alt = alt;
      dlg.showModal();
    }));
    $('.lightbox__close', dlg).addEventListener('click', () => dlg.close());
    dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });
    dlg.addEventListener('close', () => { img.removeAttribute('src'); });
  }

  /* ======================================================================
     BOOT
     ====================================================================== */
  document.addEventListener('DOMContentLoaded', () => {
    $('#year').textContent = new Date().getFullYear();
    renderMenu();
    renderContact();
    initNav();
    initLightbox();
    initReveal();
    loadSchedule().then(() => {
      // Newly rendered stops should reveal too.
      $$('.stop').forEach(s => s.classList.add('reveal', 'is-visible'));
    });
  });
})();
