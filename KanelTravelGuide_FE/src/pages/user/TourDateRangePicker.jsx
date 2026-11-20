import { useEffect, useRef, useState } from 'react';

export default function TourDateRangePicker({ value, onApply }) {
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState(value);
    const wrapper = useRef(null);
    const trigger = useRef(null);
    const invalid = draft.fromDate && draft.toDate && draft.fromDate > draft.toDate;
    const format = (date) => date.split('-').reverse().join('/');
    const label = value.fromDate && value.toDate
        ? format(value.fromDate) + ' – ' + format(value.toDate)
        : value.fromDate ? 'From ' + format(value.fromDate)
            : value.toDate ? 'Until ' + format(value.toDate) : 'Select travel dates';

    useEffect(() => {
        if (!open) return;
        function closeOutside(event) {
            if (!wrapper.current?.contains(event.target)) setOpen(false);
        }
        function closeEscape(event) {
            if (event.key === 'Escape') { setOpen(false); trigger.current?.focus(); }
        }
        document.addEventListener('pointerdown', closeOutside);
        document.addEventListener('keydown', closeEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOutside);
            document.removeEventListener('keydown', closeEscape);
        };
    }, [open]);

    return (
        <div className="tr-date-picker" ref={wrapper}
            onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
            <button type="button" ref={trigger} className="tr-traveler-trigger"
                aria-haspopup="dialog" aria-expanded={open}
                onClick={() => { if (!open) setDraft(value); setOpen((current) => !current); }}>
                <span><i className="bi bi-calendar3" aria-hidden="true" />{label}</span><i className="bi bi-chevron-down" aria-hidden="true" />
            </button>
            {open && <form className="tr-traveler-popover tr-date-popover" role="dialog" aria-label="Choose travel dates"
                onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    const next = { fromDate: data.get('fromDate'), toDate: data.get('toDate') };
                    if (next.fromDate && next.toDate && next.fromDate > next.toDate) { setDraft(next); return; }
                    onApply(next);
                    setOpen(false);
                    trigger.current?.focus();
                }}>
                <h3>When are you travelling?</h3>
                <label>Departure from<input name="fromDate" type="date" value={draft.fromDate} onChange={(event) => setDraft({ ...draft, fromDate: event.target.value })} /></label>
                <label>Departure to<input name="toDate" type="date" value={draft.toDate} onChange={(event) => setDraft({ ...draft, toDate: event.target.value })} /></label>
                {invalid && <p className="tr-error" role="alert">The end date must be on or after the start date.</p>}
                <div className="tr-date-actions">
                    <button type="button" className="tr-text-link" onClick={() => setDraft({ fromDate: '', toDate: '' })}>All dates</button>
                    <button type="submit" className="tr-primary" disabled={Boolean(invalid)}>Apply</button>
                </div>
            </form>}
        </div>
    );
}
