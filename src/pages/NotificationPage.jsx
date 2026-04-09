import { useState, useRef, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { sendSmsApi, sendBulkSmsApi, sendBulkEmailApi, getNotificationAvailabilityApi, getUserProfileApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { isEnglishNumber } from '../utils/validation';

/* ───────── helpers ───────── */
const fmt = (n) => n.toLocaleString('en-IN');
const LAKH = 100_000;
const MAX_SHARE = 10 * LAKH;
const STEP = 10_000;

/* ───────── Dual Range Slider ───────── */
const DualRangeSlider = ({ low, high, onLowChange, onHighChange }) => {
  const pctLow = (low / MAX_SHARE) * 100;
  const pctHigh = (high / MAX_SHARE) * 100;
  return (
    <div className="notif-range-wrapper">
      <div className="notif-range-labels">
        <span>₹ {fmt(low)}</span>
        <span>₹ {fmt(high)}</span>
      </div>
      <div className="notif-range-track-container">
        <div
          className="notif-range-track-fill"
          style={{ left: `${pctLow}%`, width: `${pctHigh - pctLow}%` }}
        />
        <input type="range" className="notif-range-input notif-range-low"
          min={0} max={MAX_SHARE} step={STEP} value={low}
          onChange={(e) => { const v = +e.target.value; if (v <= high) onLowChange(v); }}
        />
        <input type="range" className="notif-range-input notif-range-high"
          min={0} max={MAX_SHARE} step={STEP} value={high}
          onChange={(e) => { const v = +e.target.value; if (v >= low) onHighChange(v); }}
        />
      </div>
      <div className="notif-range-minmax"><span>₹ 0</span><span>₹ 10,00,000</span></div>
    </div>
  );
};

/* ───────── Variable KV Rows ───────── */
const VariableRows = ({ variables, onChange }) => {
  const add = () => onChange([...variables, { key: '', value: '' }]);
  const remove = (i) => onChange(variables.filter((_, idx) => idx !== i));
  const update = (i, f, v) => onChange(variables.map((x, idx) => idx === i ? { ...x, [f]: v } : x));
  return (
    <div className="notif-vars-section">
      <div className="notif-vars-header">
        <label>Variables (Template Props)</label>
        <button type="button" className="btn btn-sm btn-outline notif-add-var-btn" onClick={add}>+ Add Variable</button>
      </div>
      {variables.length === 0 && <p className="notif-vars-empty">No variables added. Click "Add Variable" to define template props.</p>}
      {variables.map((v, i) => (
        <div className="notif-var-row" key={i}>
          <input type="text" placeholder="Key" value={v.key} onChange={(e) => update(i, 'key', e.target.value)} className="form-input" />
          <input type="text" placeholder="Value" value={v.value} onChange={(e) => update(i, 'value', e.target.value)} className="form-input" />
          <button type="button" className="btn-icon-remove" onClick={() => remove(i)} title="Remove">✕</button>
        </div>
      ))}
    </div>
  );
};

/* ───────── Client Rows ───────── */
const ClientRows = ({ clients, onChange, type = 'sms' }) => {
  const add = () => {
    const e = type === 'email' ? { clientId: '', email: '', clientName: '' } : { clientId: '', phoneNumber: '', clientName: '' };
    onChange([...clients, e]);
  };
  const remove = (i) => onChange(clients.filter((_, idx) => idx !== i));
  const update = (i, f, v) => onChange(clients.map((c, idx) => idx === i ? { ...c, [f]: v } : c));
  return (
    <div className="notif-clients-section">
      <div className="notif-vars-header">
        <label>Client List</label>
        <button type="button" className="btn btn-sm btn-outline notif-add-var-btn" onClick={add}>+ Add Client</button>
      </div>
      {clients.length === 0 && <p className="notif-vars-empty">No clients added yet.</p>}
      {clients.map((c, i) => (
        <div className="notif-client-row" key={i}>
          <input type="number" placeholder="Client ID" value={c.clientId} onChange={(e) => update(i, 'clientId', e.target.value)} className="form-input" />
          <input 
            type="text" 
            placeholder={type === 'email' ? 'Email' : 'Phone Number'} 
            value={type === 'email' ? c.email : c.phoneNumber} 
            onChange={(e) => {
              const v = e.target.value;
              if (type === 'sms' && !isEnglishNumber(v)) return;
              update(i, type === 'email' ? 'email' : 'phoneNumber', v);
            }} 
            className="form-input" 
          />
          <input type="text" placeholder="Client Name" value={c.clientName} onChange={(e) => update(i, 'clientName', e.target.value)} className="form-input" />
          <button type="button" className="btn-icon-remove" onClick={() => remove(i)} title="Remove">✕</button>
        </div>
      ))}
    </div>
  );
};

/* ───────── Build variables map ───────── */
const buildVarsMap = (arr) => {
  if (!arr || !arr.length) return undefined;
  const m = {};
  arr.forEach(({ key, value }) => { if (key.trim()) m[key.trim()] = value; });
  return Object.keys(m).length ? m : undefined;
};

/* ───────── Send Button ───────── */
const SendButton = ({ sending, onClick, label }) => (
  <div className="notif-send-footer">
    <button
      className={`btn btn-primary btn-lg notif-send-btn ${sending ? 'sending' : ''}`}
      disabled={sending}
      onClick={onClick}
    >
      {sending ? (<><span className="notif-send-spinner" /> Sending…</>) : (<>🚀 {label}</>)}
    </button>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const NotificationPage = () => {
  const toast = useToast();
  const { user: currentUser } = useAuth();
  const [quota, setQuota] = useState(null);

  useEffect(() => {
    const fetchQuota = async () => {
      try {
        const quotaData = await getNotificationAvailabilityApi();
        setQuota(quotaData);
      } catch (err) {
        console.error('Failed to load notification availability', err);
      }
    };
    fetchQuota();
  }, []);

  /* ── top-level tab ── */
  const [mainTab, setMainTab] = useState('sms');
  /* ── which SMS panel is expanded ── */
  const [smsPanel, setSmsPanel] = useState('single');
  /* ── which Email panel is expanded ── */
  const [emailPanel, setEmailPanel] = useState('byEmails');
  /* ── sending state (keyed by panel id) ── */
  const [sendingKey, setSendingKey] = useState(null);

  /* ═══════ STATE FOR EACH PANEL ═══════ */

  // SMS: Single
  const [singleSms, setSingleSms] = useState({ toPhone: '', message: '', purpose: '', clientId: '' });
  const [singleVars, setSingleVars] = useState([]);

  // SMS: Template-based
  const [templateSms, setTemplateSms] = useState({ purpose: '', message: '', singleClientId: '' });
  const [templateSmsVars, setTemplateSmsVars] = useState([]);

  // SMS: By Contact Numbers
  const [contactSms, setContactSms] = useState({ message: '', purpose: '', contactNumbers: '' });
  const [contactSmsVars, setContactSmsVars] = useState([]);

  // SMS: By Client List
  const [clientSms, setClientSms] = useState({ message: '', purpose: '' });
  const [clientSmsClients, setClientSmsClients] = useState([]);
  const [clientSmsVars, setClientSmsVars] = useState([]);

  // SMS: By Share Amount
  const [shareSms, setShareSms] = useState({ message: '', purpose: '' });
  const [shareSmsLow, setShareSmsLow] = useState(0);
  const [shareSmsHigh, setShareSmsHigh] = useState(MAX_SHARE);
  const [shareSmsVars, setShareSmsVars] = useState([]);

  // Email: By Email Addresses
  const [emailByAddr, setEmailByAddr] = useState({ subject: '', body: '', purpose: '', emails: '' });
  const [emailByAddrVars, setEmailByAddrVars] = useState([]);

  // Email: By Client List
  const [emailByClient, setEmailByClient] = useState({ subject: '', body: '', purpose: '' });
  const [emailByClientClients, setEmailByClientClients] = useState([]);
  const [emailByClientVars, setEmailByClientVars] = useState([]);

  // Email: By Share Amount
  const [emailByShare, setEmailByShare] = useState({ subject: '', body: '', purpose: '' });
  const [emailByShareLow, setEmailByShareLow] = useState(0);
  const [emailByShareHigh, setEmailByShareHigh] = useState(MAX_SHARE);
  const [emailByShareVars, setEmailByShareVars] = useState([]);

  // Email: Template-based
  const [emailTemplate, setEmailTemplate] = useState({ subject: '', purpose: '', singleClientId: '' });
  const [emailTemplateVars, setEmailTemplateVars] = useState([]);

  /* ═══════ HANDLERS ═══════ */

  const isSending = (key) => sendingKey === key;

  const withSending = async (key, fn) => {
    setSendingKey(key);
    try { await fn(); } finally { setSendingKey(null); }
  };

  // -- SMS Single --
  const handleSingleSms = () => withSending('single', async () => {
    if (!singleSms.toPhone.trim()) return toast.error('Phone number is required');
    if (!singleSms.message.trim()) return toast.error('Message is required');
    const payload = {
      toPhone: singleSms.toPhone.trim(),
      message: singleSms.message,
      purpose: singleSms.purpose || undefined,
      clientId: singleSms.clientId ? +singleSms.clientId : undefined,
      variables: buildVarsMap(singleVars),
    };
    await sendSmsApi(payload);
    toast.success('SMS sent successfully!');
    setSingleSms({ toPhone: '', message: '', purpose: '', clientId: '' });
    setSingleVars([]);
  });

  // -- SMS Template --
  const handleTemplateSms = () => withSending('template', async () => {
    if (!templateSms.purpose.trim()) return toast.error('Purpose is required for template SMS');
    const payload = {
      message: templateSms.message || undefined,
      purpose: templateSms.purpose,
      singleClientId: templateSms.singleClientId ? +templateSms.singleClientId : undefined,
      variables: buildVarsMap(templateSmsVars),
    };
    await sendBulkSmsApi(payload);
    toast.success('Template SMS sent successfully!');
    setTemplateSms({ purpose: '', message: '', singleClientId: '' });
    setTemplateSmsVars([]);
  });

  // -- SMS By Contacts --
  const handleContactSms = () => withSending('contacts', async () => {
    if (!contactSms.message.trim()) return toast.error('Message is required');
    const nums = contactSms.contactNumbers.split(/[,\n]+/).map(n => n.trim()).filter(Boolean);
    if (!nums.length) return toast.error('Enter at least one contact number');
    const payload = {
      message: contactSms.message,
      purpose: contactSms.purpose || undefined,
      contactNumbers: nums,
      variables: buildVarsMap(contactSmsVars),
    };
    await sendBulkSmsApi(payload);
    toast.success('Bulk SMS sent to contacts!');
    setContactSms({ message: '', purpose: '', contactNumbers: '' });
    setContactSmsVars([]);
  });

  // -- SMS By Client List --
  const handleClientSms = () => withSending('smsClients', async () => {
    if (!clientSms.message.trim()) return toast.error('Message is required');
    if (!clientSmsClients.length) return toast.error('Add at least one client');
    const payload = {
      message: clientSms.message,
      purpose: clientSms.purpose || undefined,
      clients: clientSmsClients.map(c => ({ clientId: +c.clientId || 0, phoneNumber: c.phoneNumber, clientName: c.clientName })),
      variables: buildVarsMap(clientSmsVars),
    };
    await sendBulkSmsApi(payload);
    toast.success('Bulk SMS sent to clients!');
    setClientSms({ message: '', purpose: '' });
    setClientSmsClients([]);
    setClientSmsVars([]);
  });

  // -- SMS By Share Amount --
  const handleShareSms = () => withSending('smsShare', async () => {
    if (!shareSms.message.trim()) return toast.error('Message is required');
    const payload = {
      message: shareSms.message,
      purpose: shareSms.purpose || undefined,
      shareAmountGreaterThan: shareSmsLow,
      shareAmountLessThan: shareSmsHigh,
      variables: buildVarsMap(shareSmsVars),
    };
    await sendBulkSmsApi(payload);
    toast.success('Bulk SMS sent by share range!');
    setShareSms({ message: '', purpose: '' });
    setShareSmsLow(0);
    setShareSmsHigh(MAX_SHARE);
    setShareSmsVars([]);
  });

  // -- Email By Addresses --
  const handleEmailByAddr = () => withSending('emailAddr', async () => {
    if (!emailByAddr.subject.trim()) return toast.error('Subject is required');
    if (!emailByAddr.body.trim() && !emailByAddr.purpose.trim()) return toast.error('Body or purpose is required');
    const addrs = emailByAddr.emails.split(/[,\n]+/).map(e => e.trim()).filter(Boolean);
    if (!addrs.length) return toast.error('Enter at least one email address');
    const payload = {
      subject: emailByAddr.subject,
      body: emailByAddr.body,
      purpose: emailByAddr.purpose || undefined,
      emails: addrs,
      variables: buildVarsMap(emailByAddrVars),
    };
    await sendBulkEmailApi(payload);
    toast.success('Bulk email sent!');
    setEmailByAddr({ subject: '', body: '', purpose: '', emails: '' });
    setEmailByAddrVars([]);
  });

  // -- Email By Client List --
  const handleEmailByClient = () => withSending('emailClients', async () => {
    if (!emailByClient.subject.trim()) return toast.error('Subject is required');
    if (!emailByClientClients.length) return toast.error('Add at least one client');
    const payload = {
      subject: emailByClient.subject,
      body: emailByClient.body,
      purpose: emailByClient.purpose || undefined,
      clients: emailByClientClients.map(c => ({ clientId: +c.clientId || 0, email: c.email, clientName: c.clientName })),
      variables: buildVarsMap(emailByClientVars),
    };
    await sendBulkEmailApi(payload);
    toast.success('Bulk email sent to clients!');
    setEmailByClient({ subject: '', body: '', purpose: '' });
    setEmailByClientClients([]);
    setEmailByClientVars([]);
  });

  // -- Email By Share Amount --
  const handleEmailByShare = () => withSending('emailShare', async () => {
    if (!emailByShare.subject.trim()) return toast.error('Subject is required');
    const payload = {
      subject: emailByShare.subject,
      body: emailByShare.body,
      purpose: emailByShare.purpose || undefined,
      shareAmountGreaterThan: emailByShareLow,
      shareAmountLessThan: emailByShareHigh,
      variables: buildVarsMap(emailByShareVars),
    };
    await sendBulkEmailApi(payload);
    toast.success('Bulk email sent by share range!');
    setEmailByShare({ subject: '', body: '', purpose: '' });
    setEmailByShareLow(0);
    setEmailByShareHigh(MAX_SHARE);
    setEmailByShareVars([]);
  });

  // -- Email Template --
  const handleEmailTemplate = () => withSending('emailTpl', async () => {
    if (!emailTemplate.purpose.trim()) return toast.error('Purpose is required');
    if (!emailTemplate.subject.trim()) return toast.error('Subject is required');
    const payload = {
      subject: emailTemplate.subject,
      purpose: emailTemplate.purpose,
      body: '',
      singleClientId: emailTemplate.singleClientId ? +emailTemplate.singleClientId : undefined,
      variables: buildVarsMap(emailTemplateVars),
    };
    await sendBulkEmailApi(payload);
    toast.success('Template email sent!');
    setEmailTemplate({ subject: '', purpose: '', singleClientId: '' });
    setEmailTemplateVars([]);
  });

  /* ═══════ SMS PANELS CONFIG ═══════ */
  const smsPanels = [
    { key: 'single', icon: '📱', title: 'Single SMS', desc: 'Send to one phone number' },
    { key: 'template', icon: '🎯', title: 'Template SMS', desc: 'Purpose-based with variables' },
    { key: 'contacts', icon: '📋', title: 'Bulk by Contact Numbers', desc: 'Send to a list of phone numbers' },
    { key: 'smsClients', icon: '👥', title: 'Bulk by Client List', desc: 'Send by client details' },
    { key: 'smsShare', icon: '💰', title: 'Bulk by Share Amount', desc: 'Target clients by share range' },
  ];

  const emailPanels = [
    { key: 'byEmails', icon: '📬', title: 'Bulk by Email Addresses', desc: 'Send to a list of emails' },
    { key: 'byClients', icon: '👥', title: 'Bulk by Client List', desc: 'Send by client details' },
    { key: 'byShare', icon: '💰', title: 'Bulk by Share Amount', desc: 'Target clients by share range' },
    { key: 'byTemplate', icon: '🎯', title: 'Template Email', desc: 'Purpose-based with variables' },
  ];

  /* ═══════ RENDER ═══════ */
  return (
    <div className="page-content">
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1>🔔 Notification Center</h1>
          <p className="page-subtitle">Send SMS and Email notifications to clients</p>
        </div>
      </div>

      {/* Main Tabs */}
      <div className="notif-main-tabs">
        <button className={`notif-main-tab ${mainTab === 'sms' ? 'active' : ''}`} onClick={() => setMainTab('sms')}>
          <span className="notif-tab-icon">💬</span><span>SMS</span>
        </button>
        <button className={`notif-main-tab ${mainTab === 'email' ? 'active' : ''}`} onClick={() => setMainTab('email')}>
          <span className="notif-tab-icon">📧</span><span>Email</span>
        </button>
        <div className="notif-tab-indicator" style={{ transform: `translateX(${mainTab === 'email' ? '100%' : '0'})` }} />
      </div>

      {quota && mainTab === 'sms' && (
        <div className="notification-limits-card" style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>💬</span> Your SMS Quota
              </h4>
              <p style={{ margin: 0, marginTop: '0.25rem', fontSize: '0.9rem', color: '#3b82f6' }}>
                Remaining: <strong>{quota.smsAvailable}</strong> | Used: <strong>{quota.smsUsedTillTheDate}</strong>
              </p>
            </div>
            <div>
              <span className={`badge ${quota.smsIsActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.8rem' }}>
                {quota.smsIsActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      )}

      {quota && mainTab === 'email' && (
        <div className="notification-limits-card" style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem', border: '1px solid #bfdbfe' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: 0, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>📧</span> Your Email Quota
              </h4>
              <p style={{ margin: 0, marginTop: '0.25rem', fontSize: '0.9rem', color: '#3b82f6' }}>
                Remaining: <strong>{quota.emailAvailable}</strong> | Used: <strong>{quota.emailUsedTillTheDate}</strong>
              </p>
            </div>
            <div>
              <span className={`badge ${quota.emailIsActive ? 'badge-success' : 'badge-danger'}`} style={{ fontSize: '0.8rem' }}>
                {quota.emailIsActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ SMS TAB ═══════════════════ */}
      {mainTab === 'sms' && (
        <div className="notif-tab-content" key="sms">
          <div className="notif-panels-container">
            {/* Panel Selector */}
            <div className="notif-panel-selector">
              {smsPanels.map((p) => (
                <button
                  key={p.key}
                  className={`notif-panel-btn ${smsPanel === p.key ? 'active' : ''}`}
                  onClick={() => setSmsPanel(p.key)}
                >
                  <span className="notif-panel-btn-icon">{p.icon}</span>
                  <div className="notif-panel-btn-text">
                    <span className="notif-panel-btn-title">{p.title}</span>
                    <span className="notif-panel-btn-desc">{p.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Panel Content */}
            <div className="notif-panel-content">

              {/* ── Single SMS ── */}
              {smsPanel === 'single' && (
                <div className="notif-card" key="single">
                  <div className="notif-card-header">
                    <div className="notif-card-header-icon">📱</div>
                    <div><h3>Send Single SMS</h3><p>Send a text message to a single phone number</p></div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Phone Number *</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 9846008536" 
                        value={singleSms.toPhone} 
                        onChange={(e) => {
                          const v = e.target.value;
                          if (isEnglishNumber(v)) setSingleSms({ ...singleSms, toPhone: v });
                        }} 
                      />
                    </div>
                    <div className="form-group">
                      <label>Client ID</label>
                      <input type="number" placeholder="Optional" value={singleSms.clientId} onChange={(e) => setSingleSms({ ...singleSms, clientId: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Purpose</label>
                    <input type="text" placeholder="e.g. OTP, LOAN_STATUS" value={singleSms.purpose} onChange={(e) => setSingleSms({ ...singleSms, purpose: e.target.value })} />
                    <span className="form-hint">If purpose is set, variables below populate the message template.</span>
                  </div>
                  <div className="form-group">
                    <label>Message *</label>
                    <textarea rows={4} placeholder="Type your message here..." value={singleSms.message} onChange={(e) => setSingleSms({ ...singleSms, message: e.target.value })} />
                  </div>
                  <VariableRows variables={singleVars} onChange={setSingleVars} />
                  <SendButton sending={isSending('single')} onClick={handleSingleSms} label="Send SMS" />
                </div>
              )}

              {/* ── Template SMS ── */}
              {smsPanel === 'template' && (
                <div className="notif-card" key="template">
                  <div className="notif-card-header">
                    <div className="notif-card-header-icon">🎯</div>
                    <div><h3>Template-based SMS</h3><p>Uses a predefined template with purpose and variables</p></div>
                  </div>
                  <div className="notif-purpose-info">
                    <div className="notif-purpose-info-icon">💡</div>
                    <p>Enter the purpose to select a template. Variables will populate the template placeholders. Optionally target a single client.</p>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Purpose *</label>
                      <input type="text" placeholder="e.g. LOAN_STATUS, OTP" value={templateSms.purpose} onChange={(e) => setTemplateSms({ ...templateSms, purpose: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Single Client ID</label>
                      <input type="number" placeholder="Optional — target one client" value={templateSms.singleClientId} onChange={(e) => setTemplateSms({ ...templateSms, singleClientId: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Message (Optional override)</label>
                    <textarea rows={3} placeholder="Leave empty to use template message" value={templateSms.message} onChange={(e) => setTemplateSms({ ...templateSms, message: e.target.value })} />
                  </div>
                  <VariableRows variables={templateSmsVars} onChange={setTemplateSmsVars} />
                  <SendButton sending={isSending('template')} onClick={handleTemplateSms} label="Send Template SMS" />
                </div>
              )}

              {/* ── Bulk by Contact Numbers ── */}
              {smsPanel === 'contacts' && (
                <div className="notif-card" key="contacts">
                  <div className="notif-card-header">
                    <div className="notif-card-header-icon">📋</div>
                    <div><h3>Bulk SMS by Contact Numbers</h3><p>Send the same message to multiple phone numbers</p></div>
                  </div>
                  <div className="form-group">
                    <label>Message *</label>
                    <textarea rows={3} placeholder="Type your bulk message here..." value={contactSms.message} onChange={(e) => setContactSms({ ...contactSms, message: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Purpose</label>
                    <input type="text" placeholder="Optional — e.g. LOAN_STATUS" value={contactSms.purpose} onChange={(e) => setContactSms({ ...contactSms, purpose: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Contact Numbers *</label>
                    <textarea 
                      rows={4} 
                      placeholder={"Enter numbers separated by commas or new lines\ne.g. 9801234567, 9807654321"} 
                      value={contactSms.contactNumbers} 
                      onChange={(e) => {
                        const v = e.target.value;
                        // Allow 0-9, comma, newline, space
                        if (/^[0-9,\s\n]*$/.test(v)) {
                          setContactSms({ ...contactSms, contactNumbers: v });
                        }
                      }} 
                    />
                    <span className="form-hint">Separate with commas or new lines</span>
                  </div>
                  <VariableRows variables={contactSmsVars} onChange={setContactSmsVars} />
                  <SendButton sending={isSending('contacts')} onClick={handleContactSms} label="Send Bulk SMS" />
                </div>
              )}

              {/* ── Bulk by Client List ── */}
              {smsPanel === 'smsClients' && (
                <div className="notif-card" key="smsClients">
                  <div className="notif-card-header">
                    <div className="notif-card-header-icon">👥</div>
                    <div><h3>Bulk SMS by Client List</h3><p>Add individual clients with their phone numbers</p></div>
                  </div>
                  <div className="form-group">
                    <label>Message *</label>
                    <textarea rows={3} placeholder="Type your bulk message here..." value={clientSms.message} onChange={(e) => setClientSms({ ...clientSms, message: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Purpose</label>
                    <input type="text" placeholder="Optional" value={clientSms.purpose} onChange={(e) => setClientSms({ ...clientSms, purpose: e.target.value })} />
                  </div>
                  <ClientRows clients={clientSmsClients} onChange={setClientSmsClients} type="sms" />
                  <VariableRows variables={clientSmsVars} onChange={setClientSmsVars} />
                  <SendButton sending={isSending('smsClients')} onClick={handleClientSms} label="Send to Clients" />
                </div>
              )}

              {/* ── Bulk by Share Amount ── */}
              {smsPanel === 'smsShare' && (
                <div className="notif-card" key="smsShare">
                  <div className="notif-card-header">
                    <div className="notif-card-header-icon">💰</div>
                    <div><h3>Bulk SMS by Share Amount</h3><p>Target clients within a share amount range</p></div>
                  </div>
                  <div className="form-group">
                    <label>Message *</label>
                    <textarea rows={3} placeholder="Type your bulk message here..." value={shareSms.message} onChange={(e) => setShareSms({ ...shareSms, message: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Purpose</label>
                    <input type="text" placeholder="Optional" value={shareSms.purpose} onChange={(e) => setShareSms({ ...shareSms, purpose: e.target.value })} />
                  </div>
                  <div className="notif-share-section">
                    <label>Share Amount Range</label>
                    <p className="notif-share-desc">Select the minimum and maximum share amount to target clients</p>
                    <DualRangeSlider low={shareSmsLow} high={shareSmsHigh} onLowChange={setShareSmsLow} onHighChange={setShareSmsHigh} />
                  </div>
                  <VariableRows variables={shareSmsVars} onChange={setShareSmsVars} />
                  <SendButton sending={isSending('smsShare')} onClick={handleShareSms} label="Send by Range" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════ EMAIL TAB ═══════════════════ */}
      {mainTab === 'email' && (
        <div className="notif-tab-content" key="email">
          <div className="notif-panels-container">
            {/* Panel Selector */}
            <div className="notif-panel-selector">
              {emailPanels.map((p) => (
                <button
                  key={p.key}
                  className={`notif-panel-btn ${emailPanel === p.key ? 'active' : ''}`}
                  onClick={() => setEmailPanel(p.key)}
                >
                  <span className="notif-panel-btn-icon">{p.icon}</span>
                  <div className="notif-panel-btn-text">
                    <span className="notif-panel-btn-title">{p.title}</span>
                    <span className="notif-panel-btn-desc">{p.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Panel Content */}
            <div className="notif-panel-content">

              {/* ── Email by Addresses ── */}
              {emailPanel === 'byEmails' && (
                <div className="notif-card" key="byEmails">
                  <div className="notif-card-header">
                    <div className="notif-card-header-icon">📬</div>
                    <div><h3>Bulk Email by Addresses</h3><p>Send the same email to a list of email addresses</p></div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Subject *</label>
                      <input type="text" placeholder="Email subject line" value={emailByAddr.subject} onChange={(e) => setEmailByAddr({ ...emailByAddr, subject: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Purpose</label>
                      <input type="text" placeholder="Optional — e.g. LOAN_STATUS" value={emailByAddr.purpose} onChange={(e) => setEmailByAddr({ ...emailByAddr, purpose: e.target.value })} />
                      <span className="form-hint">If set, template variables are used</span>
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email Body</label>
                    <textarea rows={4} placeholder="Write your email content here..." value={emailByAddr.body} onChange={(e) => setEmailByAddr({ ...emailByAddr, body: e.target.value })} />
                    <span className="form-hint">Plain text. For rich templates, use purpose + variables.</span>
                  </div>
                  <div className="form-group">
                    <label>Email Addresses *</label>
                    <textarea rows={3} placeholder={"Enter emails separated by commas or new lines\ne.g. john@example.com, jane@example.com"} value={emailByAddr.emails} onChange={(e) => setEmailByAddr({ ...emailByAddr, emails: e.target.value })} />
                    <span className="form-hint">Separate with commas or new lines</span>
                  </div>
                  <VariableRows variables={emailByAddrVars} onChange={setEmailByAddrVars} />
                  <SendButton sending={isSending('emailAddr')} onClick={handleEmailByAddr} label="Send Bulk Email" />
                </div>
              )}

              {/* ── Email by Client List ── */}
              {emailPanel === 'byClients' && (
                <div className="notif-card" key="byClients">
                  <div className="notif-card-header">
                    <div className="notif-card-header-icon">👥</div>
                    <div><h3>Bulk Email by Client List</h3><p>Add individual clients with their email addresses</p></div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Subject *</label>
                      <input type="text" placeholder="Email subject line" value={emailByClient.subject} onChange={(e) => setEmailByClient({ ...emailByClient, subject: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Purpose</label>
                      <input type="text" placeholder="Optional" value={emailByClient.purpose} onChange={(e) => setEmailByClient({ ...emailByClient, purpose: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email Body</label>
                    <textarea rows={4} placeholder="Write your email content here..." value={emailByClient.body} onChange={(e) => setEmailByClient({ ...emailByClient, body: e.target.value })} />
                  </div>
                  <ClientRows clients={emailByClientClients} onChange={setEmailByClientClients} type="email" />
                  <VariableRows variables={emailByClientVars} onChange={setEmailByClientVars} />
                  <SendButton sending={isSending('emailClients')} onClick={handleEmailByClient} label="Send to Clients" />
                </div>
              )}

              {/* ── Email by Share Amount ── */}
              {emailPanel === 'byShare' && (
                <div className="notif-card" key="byShare">
                  <div className="notif-card-header">
                    <div className="notif-card-header-icon">💰</div>
                    <div><h3>Bulk Email by Share Amount</h3><p>Target clients within a share amount range</p></div>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Subject *</label>
                      <input type="text" placeholder="Email subject line" value={emailByShare.subject} onChange={(e) => setEmailByShare({ ...emailByShare, subject: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Purpose</label>
                      <input type="text" placeholder="Optional" value={emailByShare.purpose} onChange={(e) => setEmailByShare({ ...emailByShare, purpose: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Email Body</label>
                    <textarea rows={4} placeholder="Write your email content here..." value={emailByShare.body} onChange={(e) => setEmailByShare({ ...emailByShare, body: e.target.value })} />
                  </div>
                  <div className="notif-share-section">
                    <label>Share Amount Range</label>
                    <p className="notif-share-desc">Select the minimum and maximum share amount to target clients</p>
                    <DualRangeSlider low={emailByShareLow} high={emailByShareHigh} onLowChange={setEmailByShareLow} onHighChange={setEmailByShareHigh} />
                  </div>
                  <VariableRows variables={emailByShareVars} onChange={setEmailByShareVars} />
                  <SendButton sending={isSending('emailShare')} onClick={handleEmailByShare} label="Send by Range" />
                </div>
              )}

              {/* ── Template Email ── */}
              {emailPanel === 'byTemplate' && (
                <div className="notif-card" key="byTemplate">
                  <div className="notif-card-header">
                    <div className="notif-card-header-icon">🎯</div>
                    <div><h3>Template-based Email</h3><p>Uses a predefined template with purpose and variables</p></div>
                  </div>
                  <div className="notif-purpose-info">
                    <div className="notif-purpose-info-icon">💡</div>
                    <p>Enter the purpose to select a template. Variables will populate the template placeholders. Optionally target a single client.</p>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label>Subject *</label>
                      <input type="text" placeholder="Email subject line" value={emailTemplate.subject} onChange={(e) => setEmailTemplate({ ...emailTemplate, subject: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Purpose *</label>
                      <input type="text" placeholder="e.g. LOAN_STATUS" value={emailTemplate.purpose} onChange={(e) => setEmailTemplate({ ...emailTemplate, purpose: e.target.value })} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Single Client ID</label>
                    <input type="number" placeholder="Optional — target one client" value={emailTemplate.singleClientId} onChange={(e) => setEmailTemplate({ ...emailTemplate, singleClientId: e.target.value })} />
                  </div>
                  <VariableRows variables={emailTemplateVars} onChange={setEmailTemplateVars} />
                  <SendButton sending={isSending('emailTpl')} onClick={handleEmailTemplate} label="Send Template Email" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationPage;
