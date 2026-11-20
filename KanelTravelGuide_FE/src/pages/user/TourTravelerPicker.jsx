import { useEffect, useRef, useState } from 'react';

export default function TourTravelerPicker({ adults, childCount, onApply }) {
    const [open, setOpen] = useState(false);
    const [draftAdults, setDraftAdults] = useState(adults);
    const [draftChildren, setDraftChildren] = useState(childCount);
    const wrapper = useRef(null);
    const trigger = useRef(null);
    const firstControl = useRef(null);
    const total = draftAdults + draftChildren;
    const label = adults + (adults === 1 ? ' adult' : ' adults')
        + (childCount > 0 ? ', ' + childCount + (childCount === 1 ? ' child' : ' children') : '');

    useEffect(() => {
        if (!open) return;
        firstControl.current?.focus();
        function closeOutside(event) {
            if (!wrapper.current?.contains(event.target)) setOpen(false);
        }
        function closeOnEscape(event) {
            if (event.key === 'Escape') {
                setOpen(false);
                trigger.current?.focus();
            }
        }
        document.addEventListener('pointerdown', closeOutside);
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.removeEventListener('pointerdown', closeOutside);
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [open]);

    function toggle() {
        if (!open) {
            setDraftAdults(adults);
            setDraftChildren(childCount);
        }
        setOpen((value) => !value);
    }

    function apply() {
        onApply(draftAdults, draftChildren);
        setOpen(false);
        trigger.current?.focus();
    }

    return (
        <div className="tr-traveler-picker" ref={wrapper}
            onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false); }}>
            <span className="tr-traveler-label">Travelers</span>
            <button ref={trigger} type="button" className="tr-traveler-trigger"
                aria-expanded={open} aria-haspopup="dialog" onClick={toggle}>
                <span><i className="bi bi-people" aria-hidden="true" /> {label}</span>
                <i className="bi bi-chevron-down" aria-hidden="true" />
            </button>
            {open && (
                <div className="tr-traveler-popover" role="dialog" aria-label="Who is travelling?">
                    <h3>Who is travelling?</h3>
                    <div className="tr-traveler-row">
                        <div><strong>Adults</strong><small>Ages 18 or above</small></div>
                        <div className="tr-traveler-stepper">
                            <button ref={firstControl} type="button" aria-label="Decrease adults" disabled={draftAdults <= 1}
                                onClick={() => setDraftAdults((value) => Math.max(1, value - 1))}><i className="bi bi-dash" aria-hidden="true" /></button>
                            <output aria-label="Number of adults">{draftAdults}</output>
                            <button type="button" aria-label="Increase adults" disabled={total >= 1000}
                                onClick={() => setDraftAdults((value) => value + 1)}><i className="bi bi-plus" aria-hidden="true" /></button>
                        </div>
                    </div>
                    <div className="tr-traveler-row">
                        <div><strong>Children</strong><small>Ages 2–17</small></div>
                        <div className="tr-traveler-stepper">
                            <button type="button" aria-label="Decrease children" disabled={draftChildren <= 0}
                                onClick={() => setDraftChildren((value) => Math.max(0, value - 1))}><i className="bi bi-dash" aria-hidden="true" /></button>
                            <output aria-label="Number of children">{draftChildren}</output>
                            <button type="button" aria-label="Increase children" disabled={total >= 1000}
                                onClick={() => setDraftChildren((value) => value + 1)}><i className="bi bi-plus" aria-hidden="true" /></button>
                        </div>
                    </div>
                    <div className="tr-traveler-actions"><button type="button" className="tr-primary" onClick={apply}>Apply</button></div>
                </div>
            )}
        </div>
    );
}
